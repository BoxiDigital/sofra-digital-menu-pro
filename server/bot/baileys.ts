/**
 * WhatsApp Connection Manager using Baileys
 * 
 * 🔧 تشخيص الاتصال: تم تفعيل logging عالي المستوى لمعرفة سبب فشل الاتصال بالضبط.
 * 
 * الأسباب المحتملة لفشل WebSocket:
 * 1. Port 5222 محجوب في البيئة (Render / Railway / بعض VPS)
 * 2. DNS لا يحل web.whatsapp.com
 * 3. وكيل (Proxy) يعترض الاتصال
 * 
 * الحلول التقنية حسب السبب:
 * - السبب 1: لا يمكن تجاوزه مباشرة من الكود. تحتاج VPS مع بورتات مفتوحة أو Railway/Render مع خطة Pro.
 * - السبب 2: يمكننا إضافة fallback DNS.
 * - السبب 3: يمكننا تكوين Baileys لاستخدام وكيل (proxy).
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

// 🔧 Logger مفعّل عالياً لتشخيص المشكلة
// level: "debug" = يظهر كل التفاصيل بما فيها WebSocket errors
const logger = pino({
  level: "debug",
  transport: {
    target: "pino/file",
    options: { destination: 1 }, // stdout = Terminal
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
 */
async function requestPairingCode(socket: any, phoneNumber: string): Promise<string | null> {
  try {
    const cleanNumber = phoneNumber.replace(/[+\s]/g, "");
    
    console.log(`[SalesBot] 📱 طلب رمز الاقتران للرقم: ${cleanNumber}...`);
    
    const code = await socket.requestPairingCode(cleanNumber);
    
    if (!code || code === "INVALID_PHONE_NUMBER") {
      console.error("[SalesBot] ❌ رقم الهاتف غير صالح أو لا يدعم الاقتران");
      return null;
    }

    const codeMsg = `رقم الهاتف: ${cleanNumber}\nرمز الاقتران: ${code}\nصالح لمدة دقيقتين\n`;
    writeFileSync(PAIRING_CODE_FILE, codeMsg, "utf-8");

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
    console.log("╚═══════════════════════════════════════════════════╝");
    console.log("");

    return code;
  } catch (err: any) {
    console.error("[SalesBot] ❌ فشل طلب رمز الاقتران:", err.message);
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

  // لا ننظف الجلسة إذا كان هناك محاولة سابقة
  // cleanupOldSession(); ← معطل مؤقتاً لتجنب فقدان الجلسة

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
    console.log(`[SalesBot] 🧪 وضع التشخيص مفعّل — جميع الأخطاء ستظهر في Terminal`);
    console.log(`[SalesBot] 🔌 جاري محاولة الاتصال بـ web.whatsapp.com:5222...`);

    sock = makeWASocket({
      version,
      auth: {
        creds: authState.creds,
        keys: makeCacheableSignalKeyStore(authState.keys, logger),
      },
      logger, // ← مفعّل عالياً باش يظهر WebSocket errors
      browser: ["Ubuntu", "Chrome", "20.0.04"],
      connectTimeoutMs: CONNECT_TIMEOUT,
      defaultQueryTimeoutMs: QUERY_TIMEOUT,
      syncFullHistory: false,
      markOnlineOnConnect: false,
      generateHighQualityLinkPreview: false,
      printQRInTerminal: false,
      mobile: false,
      // 🔧 إعدادات إضافية لتحسين الاتصال في بيئات مقيدة
      keepAliveIntervalMs: 25000,   // إرسال ping كل 25 ثانية
      retryRequestDelayMs: 500,     // إعادة المحاولة بسرعة
    });

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("connection.update", async (update: any) => {
      const { connection, lastDisconnect, qr } = update;

      console.log(`[SalesBot] 📡 connection.update → ${JSON.stringify({ connection, hasQR: !!qr, lastDisconnect: !!lastDisconnect })}`);

      // ── QR Code متاح ──
      if (qr) {
        console.log("[SalesBot] 📱 QR Code تم استلامه");
        state.qrCode = qr;
      }

      // ── جاري الاتصال ──
      if (connection === "connecting") {
        console.log("[SalesBot] ⏳ WebSocket: محاولة الاتصال...");
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
        console.log(`[SalesBot] ✅✅✅ متصل! الرقم: ${state.phoneNumber}`);
        console.log("[SalesBot] 🟢 البوت نشط ومستعد لاستقبال الرسائل");

        // طلب رمز الاقتران بعد الاتصال
        setTimeout(async () => {
          if (sock && state.status === "connected" && !state.pairingCode) {
            await requestPairingCode(sock, WHATSAPP_PHONE_NUMBER);
          }
        }, 2000);

        // حذف ملف رمز الاقتران القديم
        try { if (existsSync(PAIRING_CODE_FILE)) rmSync(PAIRING_CODE_FILE); } catch {}
      }

      // ── انقطع الاتصال ──
      if (connection === "close") {
        const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;
        const errorMessage = (lastDisconnect?.error as Error)?.message || (lastDisconnect?.error as any)?.stack || "";
        const errorName = (lastDisconnect?.error as Error)?.name || "";

        console.log("");
        console.log("╔═══════════════════════════════════════════════════╗");
        console.log("║  🔴 انقطع الاتصال — تفاصيل الخطأ:               ║");
        console.log(`║  Status Code: ${String(statusCode || "غير معروف").padEnd(36)}║`);
        console.log(`║  Error Name:  ${errorName.padEnd(36)}║`);
        console.log(`║  Message:     ${errorMessage.substring(0, 50).padEnd(36)}║`);
        console.log("╚═══════════════════════════════════════════════════╝");
        console.log("");

        // تحليل السبب الجذري
        if (statusCode === DisconnectReason?.loggedOut) {
          console.log("[SalesBot] 🚪 السبب: تم تسجيل الخروج");
          state.status = "disconnected";
          sock = null;
          cleanupOldSession();
          setTimeout(() => { reconnectAttempts = 0; startBot(); }, 2000);
        } else if (errorMessage?.includes("ECONNREFUSED") || errorMessage?.includes("ENOTFOUND") || errorMessage?.includes("ETIMEDOUT")) {
          // 🔴 هذا هو السبب الأكثر احتمالاً — البورت محجوب أو DNS لا يحل
          console.log("[SalesBot] 🔴 السبب الجذري: لا يمكن الوصول إلى web.whatsapp.com:5222");
          console.log("[SalesBot] 🔴 الاحتمالات:");
          console.log("[SalesBot]    1. البورت 5222 محجوب في البيئة (Render/Railway free tier يمنع WebSocket خارجي)");
          console.log("[SalesBot]    2. DNS لا يحل web.whatsapp.com");
          console.log("[SalesBot]    3. جدار ناري (Firewall) يمنع الاتصال الصادر");
          state.status = "error";
          state.lastError = `WEB_SOCKET_BLOCKED: ${errorMessage.substring(0, 100)}`;
          scheduleReconnect("WebSocket blocked");
        } else if (errorMessage?.includes("QR") || errorMessage?.includes("timed out")) {
          console.log("[SalesBot] ⏰ انتهت صلاحية QR — إعادة المحاولة...");
          state.status = "disconnected";
          sock = null;
          reconnectAttempts = 0;
          setTimeout(() => startBot(), 500);
        } else {
          // انقطاع عام
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

    console.log("[SalesBot] ⏳ في انتظار نتيجة الاتصال...");
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
}