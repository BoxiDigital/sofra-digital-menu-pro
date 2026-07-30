/**
 * WhatsApp Connection Manager using Baileys
 * 
 * إعدادات محسّنة للاتصال بـ WebSocket مع سرفيرات واتساب.
 * يستخدم الآن طريقة "رمز الاقتران" (Pairing Code) بدل QR Code لاتصال أسرع وأكثر استقراراً.
 * 
 * الطريقة: اكتب رقم هاتف واتساب في المتغير أدناه، وسيتم توليد رمز اقتران.
 * افتح واتساب ← الأجهزة المرتبطة ← رابط برقم الهاتف ← أدخل الرمز.
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

// ⚙️ رقم هاتف واتساب المراد ربطه (مع رمز الدولة، بدون + ولا مسافات)
// مثال: 212612345678
const WHATSAPP_PHONE_NUMBER = "212600000000";

// ⏱️ إعدادات التوقيت (بالمللي ثانية)
const CONNECT_TIMEOUT = 300_000;   // 5 دقائق — وقت محاولة الاتصال
const QUERY_TIMEOUT = 60_000;      // دقيقة — مهلة الاستعلامات

// Logger صامت (فقط للأخطاء) لتجنب spam في Terminal
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
      console.error("[SalesBot] ⚠️ Baileys غير مثبت أو فشل التحميل:", e.message);
      console.error("[SalesBot] شغّل: npm install @whiskeysockets/baileys@latest qrcode pino");
      throw new Error("BAILEYS_NOT_INSTALLED");
    }
  }
}

function cleanupOldSession(): void {
  try {
    const authPath = join(process.cwd(), AUTH_DIR);
    if (existsSync(authPath)) {
      rmSync(authPath, { recursive: true, force: true });
      console.log("[SalesBot] 🧹 تم تنظيف جلسة المصادقة القديمة");
    }
    mkdirSync(authPath, { recursive: true });
    console.log("[SalesBot] ✨ تم تجهيز مجلد مصادقة جديد");
  } catch (e: any) {
    console.error("[SalesBot] ⚠️ خطأ في تنظيف الجلسة:", e.message);
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

function scheduleReconnect() {
  if (reconnectTimer) clearTimeout(reconnectTimer);

  const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 60000);
  reconnectAttempts++;

  console.log(`[SalesBot] 🔄 محاولة إعادة الاتصال رقم ${reconnectAttempts} بعد ${delay / 1000} ثواني...`);
  reconnectTimer = setTimeout(async () => {
    try {
      await startBot();
    } catch (e) {
      console.error("[SalesBot] ❌ فشلت محاولة إعادة الاتصال:", e);
    }
  }, delay);
}

/**
 * طلب رمز اقتران (Pairing Code) من واتساب
 * يُظهر الرمز في Terminal ويحفظه في ملف pairing-code.txt
 */
async function requestPairingCode(socket: any, phoneNumber: string): Promise<string | null> {
  try {
    // نتأكد أن الرقم بالتنسيق الصحيح (بدون + ولا مسافات)
    const cleanNumber = phoneNumber.replace(/[+\s]/g, "");
    
    console.log(`[SalesBot] 📱 جاري طلب رمز الاقتران للرقم: ${cleanNumber}...`);
    
    // طلب رمز الاقتران من واتساب
    const code = await socket.requestPairingCode(cleanNumber);
    
    if (!code || code === "INVALID_PHONE_NUMBER") {
      console.error("[SalesBot] ❌ رقم الهاتف غير صالح أو لا يدعم الاقتران");
      console.error("[SalesBot] تأكد من صحة الرقم وأن واتساب مثبت على الهاتف");
      return null;
    }

    // حفظ الرمز في ملف
    const codeMsg = `رقم الهاتف: ${cleanNumber}\nرمز الاقتران: ${code}\nصالح لمدة دقيقتين\n`;
    writeFileSync(PAIRING_CODE_FILE, codeMsg, "utf-8");

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
    console.log(`║  📁 الرمز محفوظ أيضاً في: ${PAIRING_CODE_FILE.padEnd(20)}║`);
    console.log("║  ⏱️  الرمز صالح لمدة دقيقتين فقط                  ║");
    console.log("╚═══════════════════════════════════════════════════╝");
    console.log("");

    return code;
  } catch (err: any) {
    console.error("[SalesBot] ❌ فشل طلب رمز الاقتران:", err.message);
    
    // في بعض الإصدارات، الدالة قد تسمى requestPairingCode أو تختلف
    if (err.message?.includes("is not a function")) {
      console.log("[SalesBot] ℹ️ جاري تجربة طريقة بديلة لرمز الاقتران...");
      try {
        // بعض إصدارات Baileys تستخدم طريقة مختلفة
        const code = await socket.authState.creds.requestPairingCode?.(cleanNumber);
        return code || null;
      } catch {
        console.error("[SalesBot] ❌ جميع محاولات الاقتران فشلت");
        return null;
      }
    }
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
    state.lastError = "حزمة Baileys غير مثبتة. شغّل: npm install @whiskeysockets/baileys@latest qrcode pino";
    return getBotState();
  }

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

    console.log(`[SalesBot] 📦 إصدار Baileys: ${version.join(".")} — ${isLatest ? "✅ أحدث إصدار" : "⚠️ يوجد إصدار أحدث"}`);

    sock = makeWASocket({
      version,
      auth: {
        creds: authState.creds,
        keys: makeCacheableSignalKeyStore(authState.keys, logger),
      },
      logger,
      browser: ["Ubuntu", "Chrome", "20.0.04"],
      connectTimeoutMs: CONNECT_TIMEOUT,      // 5 دقائق
      defaultQueryTimeoutMs: QUERY_TIMEOUT,    // دقيقة
      syncFullHistory: false,
      markOnlineOnConnect: false,
      generateHighQualityLinkPreview: false,
      printQRInTerminal: false,
      mobile: false, // نتأكد من استخدام اتصال سطح المكتب العادي
    });

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("connection.update", async (update: any) => {
      const { connection, lastDisconnect, qr } = update;

      // ── تم فتح الاتصال وجاهز لطلب رمز الاقتران ──
      if (connection === "connecting" && !state.pairingCode) {
        // ننتظر قليلاً حتى يصبح socket جاهزاً لاستقبال طلب الاقتران
        setTimeout(async () => {
          if (sock && state.status === "connecting" && !state.pairingCode) {
            const code = await requestPairingCode(sock, WHATSAPP_PHONE_NUMBER);
            if (code) {
              state.pairingCode = code;
            }
          }
        }, 3000);
      }

      // ── QR Code (خطة بديلة في حالة فشل الاقتران) ──
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
        console.log(`[SalesBot] ✅ متصل بالواتساب! الرقم: ${state.phoneNumber}`);
        console.log("[SalesBot] 🟢 البوت نشط ومستعد لاستقبال الرسائل 24/7");
        
        // حذف ملف رمز الاقتران بعد الاتصال الناجح
        try {
          if (existsSync(PAIRING_CODE_FILE)) {
            rmSync(PAIRING_CODE_FILE);
          }
        } catch {}
      }

      // ── انقطع الاتصال ──
      if (connection === "close") {
        const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;
        const errorMessage = (lastDisconnect?.error as Error)?.message || "";

        console.log(`[SalesBot] ⚠️ انقطع الاتصال (Code: ${statusCode || "غير معروف"}) — ${errorMessage}`);

        const isLoggedOut =
          statusCode === DisconnectReason?.loggedOut ||
          errorMessage?.includes("logged out") ||
          errorMessage?.includes("Stream Errored");

        if (isLoggedOut) {
          console.log("[SalesBot] 🚪 تم تسجيل الخروج. تنظيف وإعادة بدء...");
          state.status = "disconnected";
          state.qrCode = null;
          state.pairingCode = null;
          state.phoneNumber = null;
          sock = null;
          cleanupOldSession();
          setTimeout(() => {
            reconnectAttempts = 0;
            startBot();
          }, 2000);
        } else {
          // انقطاع مؤقت: إعادة اتصال
          state.status = "connecting";
          state.pairingCode = null;
          sock = null;
          scheduleReconnect();
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
              console.log(`[SalesBot] 📤 رد إلى ${incoming.fromName}: ${reply.substring(0, 50)}...`);
            }
          } catch (e) {
            console.error("[SalesBot] ❌ خطأ في معالجة الرسالة:", e);
          }
        }
      }
    });

    console.log("[SalesBot] ⏳ جاري إنشاء رمز الاقتران... انتظر لحظة");
    return getBotState();
  } catch (e: any) {
    state.status = "error";
    state.lastError = e.message || "خطأ غير معروف";
    console.error("[SalesBot] ❌ خطأ في بدء البوت:", e.message);

    scheduleReconnect();
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
}