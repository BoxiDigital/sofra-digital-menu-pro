/**
 * WhatsApp Connection Manager using Baileys
 * 
 * 🔧 وضع البدء النظيف: يتم حذف الجلسة القديمة وطلب كود اقتران طازج فور الإقلاع.
 * الرقم الحصري: 212699954816
 */

import type { Boom } from "@hapi/boom";
import { existsSync, rmSync, mkdirSync, writeFileSync } from "fs";
import { join } from "path";
import pino from "pino";

let makeWASocket: any;
let useMultiFileAuthState: any;
let DisconnectReason: any;
let fetchLatestBaileysVersion: any;
let makeCacheableSignalKeyStore: any;
let baileysLoaded = false;

const AUTH_DIR = "./.salesbot-auth";
const PAIRING_CODE_FILE = "./pairing-code.txt";

// ⚙️ رقم هاتف واتساب المراد ربطه
const WHATSAPP_PHONE_NUMBER = "212699954816";

// ⏱️ إعدادات التوقيت (بالمللي ثانية)
const CONNECT_TIMEOUT = 300_000;   // 5 دقائق
const QUERY_TIMEOUT = 60_000;      // دقيقة

// Logger صامت (فقط الأخطاء المهمة تظهر)
const logger = pino({
  level: "silent",
  transport: {
    target: "pino/file",
    options: { destination: 1 },
  },
});

async function loadBaileys() {
  if (!baileysLoaded) {
    try {
      const b = await import("@whiskeysockets/baileys");
      makeWASocket = b.default;
      useMultiFileAuthState = b.useMultiFileAuthState;
      DisconnectReason = b.DisconnectReason;
      fetchLatestBaileysVersion = b.fetchLatestBaileysVersion;
      makeCacheableSignalKeyStore = b.makeCacheableSignalKeyStore;
      baileysLoaded = true;
      console.log("[SalesBot] ✅ Baileys تم تحميله بنجاح");
    } catch (e: any) {
      console.error("[SalesBot] ⚠️ Baileys غير مثبت:", e.message);
      throw new Error("BAILEYS_NOT_INSTALLED");
    }
  }
}

/**
 * حذف الجلسة القديمة وملف الكود القديم بالكامل
 * لضمان بداية نظيفة 100% في كل إقلاع
 */
function cleanupEverything(): void {
  try {
    // حذف مجلد الجلسة القديمة
    const authPath = join(process.cwd(), AUTH_DIR);
    if (existsSync(authPath)) {
      rmSync(authPath, { recursive: true, force: true });
      console.log("[SalesBot] 🧹 تم حذف مجلد الجلسة القديم بالكامل");
    }
    mkdirSync(authPath, { recursive: true });

    // حذف ملف الكود القديم
    const pairingPath = join(process.cwd(), PAIRING_CODE_FILE);
    if (existsSync(pairingPath)) {
      rmSync(pairingPath, { force: true });
      console.log("[SalesBot] 🧹 تم حذف ملف pairing-code.txt القديم");
    }

    console.log("[SalesBot] ✨ جاهز لبداية نظيفة 100%");
  } catch (e: any) {
    console.error("[SalesBot] ⚠️ خطأ في التنظيف:", e.message);
  }
}

// ── الحالة ──────────────────────────────────────────────

export type BotStatus = "disconnected" | "connecting" | "connected" | "error";

export interface BotState {
  status: BotStatus;
  qrCode: string | null;
  pairingCode: string | null;
  phoneNumber: string | null;
  startedAt: string | null;
  lastError: string | null;
  messagesReceived: number;
  messagesSent: number;
  activeConversations: number;
}

const state: BotState = {
  status: "disconnected",
  qrCode: null,
  pairingCode: null,
  phoneNumber: null,
  startedAt: null,
  lastError: null,
  messagesReceived: 0,
  messagesSent: 0,
  activeConversations: 0,
};

let sock: any = null;
let messageHandler: ((msg: IncomingMessage) => Promise<string | null>) | null = null;
let reconnectAttempts = 0;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let pairingRequested = false; // نتأكد أننا نطلب الكود مرة واحدة فقط

// ── الأنواع ─────────────────────────────────────────────

export interface IncomingMessage {
  from: string;
  fromName: string;
  body: string;
  timestamp: number;
}

// ── الدوال العامة ───────────────────────────────────────

export function getBotState(): BotState {
  return { ...state, activeConversations: state.activeConversations };
}

export function updateActiveConversations(count: number) {
  state.activeConversations = count;
}

export function setMessageHandler(handler: (msg: IncomingMessage) => Promise<string | null>) {
  messageHandler = handler;
}

export async function sendMessage(to: string, text: string): Promise<boolean> {
  if (!sock) return false;
  try {
    await sock.sendMessage(to, { text });
    state.messagesSent++;
    return true;
  } catch (e) {
    console.error("[SalesBot] فشل إرسال الرسالة:", e);
    return false;
  }
}

// ── إعادة الاتصال بتأخير تصاعدي ─────────────────────────

function scheduleReconnect(reason: string) {
  if (reconnectTimer) clearTimeout(reconnectTimer);

  const delay = Math.min(2000 * Math.pow(1.5, reconnectAttempts), 30000);
  reconnectAttempts++;

  console.log(`[SalesBot] 🔄 إعادة الاتصال (${reason}) — المحاولة ${reconnectAttempts} بعد ${delay / 1000}s`);
  reconnectTimer = setTimeout(async () => {
    try {
      await startBot();
    } catch (e) {
      console.error("[SalesBot] فشل إعادة الاتصال:", e);
    }
  }, delay);
}

/**
 * طلب رمز اقتران (Pairing Code) من واتساب
 * يُظهر الرمز في Terminal ويحفظه في ملف pairing-code.txt
 */
async function requestPairingCode(socket: any, phoneNumber: string): Promise<string | null> {
  if (pairingRequested) return null; // لا نطلب مرتين
  pairingRequested = true;

  try {
    const cleanNumber = phoneNumber.replace(/[+\s]/g, "");
    
    console.log(`[SalesBot] 📱 جاري طلب رمز اقتران طازج للرقم: ${cleanNumber}...`);
    
    const code = await socket.requestPairingCode(cleanNumber);
    
    if (!code || code === "INVALID_PHONE_NUMBER") {
      console.error("[SalesBot] ❌ رقم الهاتف غير صالح أو لا يدعم الاقتران");
      pairingRequested = false; // نسمح بإعادة المحاولة
      return null;
    }

    // حفظ الرمز في الملف فوراً
    const codeMsg = `رقم الهاتف: ${cleanNumber}\nرمز الاقتران: ${code}\nصالح لمدة دقيقتين\n`;
    writeFileSync(PAIRING_CODE_FILE, codeMsg, "utf-8");
    console.log(`[SalesBot] 💾 تم حفظ رمز الاقتران فوراً في: ${PAIRING_CODE_FILE}`);

    // عرض الرمز بشكل بارز في Terminal
    console.log("");
    console.log("╔═══════════════════════════════════════════════════╗");
    console.log("║  ✅ تم إنشاء رمز الاقتران بنجاح!                 ║");
    console.log("║                                                   ║");
    console.log(`║  📱 رقم الهاتف: ${cleanNumber.padEnd(34)}║`);
    console.log(`║  🔢 رمز الاقتران: ${code.padEnd(32)}║`);
    console.log("║                                                   ║");
    console.log("║  📲 للربط:                                        ║");
    console.log("║  1. افتح واتساب على هاتفك                          ║");
    console.log("║  2. اذهب إلى: الأجهزة المرتبطة                    ║");
    console.log("║  3. اختر: ربط باستخدام رقم الهاتف                 ║");
    console.log("║  4. أدخل الرمز أعلاه                              ║");
    console.log("║                                                   ║");
    console.log(`║  📁 الرمز محفوظ في: ${PAIRING_CODE_FILE.padEnd(20)}║`);
    console.log("║  ⏱️  الرمز صالح لمدة دقيقتين فقط                  ║");
    console.log("╚═══════════════════════════════════════════════════╝");
    console.log("");

    return code;
  } catch (err: any) {
    console.error("[SalesBot] ❌ فشل طلب رمز الاقتران:", err.message);
    pairingRequested = false; // نسمح بإعادة المحاولة
    return null;
  }
}

// ── بدء / إيقاف البوت ───────────────────────────────────

export async function startBot(): Promise<BotState> {
  if (state.status === "connected") {
    return getBotState();
  }

  if (state.status === "connecting") {
    console.log("[SalesBot] ⏳ الاتصال قيد التقدم...");
    return getBotState();
  }

  try { await loadBaileys(); } catch {
    state.status = "error";
    state.lastError = "حزمة Baileys غير مثبتة";
    return getBotState();
  }

  // 🧹 تنظيف كامل: حذف الجلسة القديمة وملف الكود القديم
  cleanupEverything();
  pairingRequested = false;

  state.status = "connecting";
  state.qrCode = null;
  state.pairingCode = null;
  state.lastError = null;

  try {
    const authDir = join(process.cwd(), AUTH_DIR);
    if (!existsSync(authDir)) {
      mkdirSync(authDir, { recursive: true });
    }

    const { state: authState, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
    const { version, isLatest } = await fetchLatestBaileysVersion().catch(() => ({ version: [2, 3000, 0], isLatest: true }));

    console.log(`[SalesBot] 📦 Baileys v${version.join(".")} — ${isLatest ? "✅ أحدث إصدار" : "⚠️ يوجد إصدار أحدث"}`);
    console.log(`[SalesBot] 🔌 جاري الاتصال بسيرفرات واتساب...`);

    sock = makeWASocket({
      version,
      auth: {
        creds: authState.creds,
        keys: makeCacheableSignalKeyStore(authState.keys, logger),
      },
      logger,
      browser: ["Ubuntu", "Chrome", "20.0.04"],
      connectTimeoutMs: CONNECT_TIMEOUT,
      defaultQueryTimeoutMs: QUERY_TIMEOUT,
      syncFullHistory: false,
      markOnlineOnConnect: false,
      generateHighQualityLinkPreview: false,
      printQRInTerminal: false,
      mobile: false,
      keepAliveIntervalMs: 25000,
      retryRequestDelayMs: 500,
    });

    sock.ev.on("creds.update", saveCreds);

    // ⚡ طلب كود الاقتران فوراً عند أول إشارة اتصال
    sock.ev.on("connection.update", async (update: any) => {
      const { connection, lastDisconnect, qr } = update;

      // ── طلب كود الاقتران فوراً عند أول محاولة اتصال ──
      if (connection === "connecting" && !state.pairingCode && !pairingRequested) {
        console.log("[SalesBot] ⚡ بدأ الاتصال — جاري طلب كود الاقتران فوراً...");
        setTimeout(async () => {
          if (sock && state.status === "connecting" && !pairingRequested) {
            const code = await requestPairingCode(sock, WHATSAPP_PHONE_NUMBER);
            if (code) {
              state.pairingCode = code;
            }
          }
        }, 2000);
      }

      // ── QR Code (خطة بديلة) ──
      if (qr && !state.pairingCode) {
        console.log("[SalesBot] 📱 QR Code متاح كخطة بديلة");
        state.qrCode = qr;
      }

      // ── تم الاتصال بنجاح ──
      if (connection === "open") {
        reconnectAttempts = 0;
        state.status = "connected";
        state.qrCode = null;
        state.pairingCode = null;
        state.startedAt = new Date().toISOString();
        state.lastError = null;
        state.phoneNumber = sock?.user?.id?.split(":")[0] || null;
        console.log(`[SalesBot] ✅✅✅ متصل بالواتساب! الرقم: ${state.phoneNumber}`);
        console.log("[SalesBot] 🟢 البوت نشط ومستعد لاستقبال الرسائل");
        
        // حذف ملف رمز الاقتران بعد الاتصال الناجح
        try {
          if (existsSync(PAIRING_CODE_FILE)) {
            rmSync(PAIRING_CODE_FILE);
            console.log("[SalesBot] 🧹 تم حذف ملف الكود بعد الاتصال الناجح");
          }
        } catch {}
      }

      // ── انقطع الاتصال ──
      if (connection === "close") {
        const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;
        const errorMessage = (lastDisconnect?.error as Error)?.message || (lastDisconnect?.error as any)?.stack || "";
        const errorName = (lastDisconnect?.error as Error)?.name || "";

        console.log("");
        console.log(`[SalesBot] ⚠️ انقطع الاتصال`);
        console.log(`[SalesBot]    Status: ${statusCode || "غير معروف"}`);
        console.log(`[SalesBot]    Error: ${errorName} — ${errorMessage.substring(0, 100)}`);
        console.log("");

        if (statusCode === DisconnectReason?.loggedOut) {
          console.log("[SalesBot] 🚪 تم تسجيل الخروج — إعادة بدء نظيفة...");
          state.status = "disconnected";
          state.pairingCode = null;
          sock = null;
          pairingRequested = false;
          setTimeout(() => { reconnectAttempts = 0; startBot(); }, 2000);
        } else if (errorMessage?.includes("ECONNREFUSED") || errorMessage?.includes("ENOTFOUND") || errorMessage?.includes("ETIMEDOUT")) {
          console.log("[SalesBot] 🔴 البورت 5222 محجوب أو DNS لا يحل web.whatsapp.com");
          state.status = "error";
          state.lastError = `WEB_SOCKET_BLOCKED: ${errorMessage.substring(0, 100)}`;
          scheduleReconnect("WebSocket blocked");
        } else {
          state.status = "error";
          state.lastError = errorMessage || "انقطاع غير معروف";
          scheduleReconnect("unknown");
        }
      }
    });

    // ── استقبال الرسائل ──
    sock.ev.on("messages.upsert", async (m: any) => {
      if (m.type !== "notify") return;
      for (const msg of m.messages) {
        if (msg.key.fromMe) continue;

        const text =
          msg.message?.conversation ||
          msg.message?.extendedTextMessage?.text ||
          msg.message?.imageMessage?.caption || "";

        if (!text?.trim()) continue;

        state.messagesReceived++;
        const incoming: IncomingMessage = {
          from: msg.key.remoteJid,
          fromName: msg.pushName || "زائر",
          body: text,
          timestamp: (msg.messageTimestamp as number) * 1000 || Date.now(),
        };

        console.log(`[SalesBot] 📩 رسالة من ${incoming.fromName}: ${text.substring(0, 50)}...`);

        if (messageHandler) {
          try {
            const reply = await messageHandler(incoming);
            if (reply) {
              await sock.sendMessage(incoming.from, { text: reply });
              state.messagesSent++;
            }
          } catch (e) {
            console.error("[SalesBot] خطأ في معالجة الرسالة:", e);
          }
        }
      }
    });

    console.log("[SalesBot] ⏳ في انتظار كود الاقتران...");
    return getBotState();
  } catch (e: any) {
    state.status = "error";
    state.lastError = e.message;
    console.error("[SalesBot] ❌ خطأ في startBot:", e.message);
    scheduleReconnect("startBot error");
    return getBotState();
  }
}

export async function stopBot(): Promise<void> {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  reconnectAttempts = 0;

  if (sock) {
    try {
      await sock.logout();
      console.log("[SalesBot] 👋 تم تسجيل الخروج");
    } catch (e: any) {
      console.log("[SalesBot] ℹ️ تسجيل الخروج:", e.message);
    }
    sock = null;
  }
  state.status = "disconnected";
  state.qrCode = null;
  state.pairingCode = null;
  state.phoneNumber = null;
  state.startedAt = null;
  pairingRequested = false;
}