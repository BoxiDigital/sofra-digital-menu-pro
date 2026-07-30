/**
 * WhatsApp Connection Manager using Baileys
 * 
 * إعدادات محسّنة للاتصال بـ WebSocket مع سرفيرات واتساب.
 * يتضمن:
 * - محاكاة متصفح واتساب ويب الحقيقي
 * - إعدادات timeout مناسبة
 * - إعادة اتصال ذكية مع تأخير تصاعدي
 * - تنظيف تلقائي للجلسة القديمة
 * - حفظ QR Code كصورة PNG مباشرة في مجلد المشروع
 */

import type { Boom } from "@hapi/boom";
import { existsSync, rmSync, mkdirSync } from "fs";
import { join } from "path";
import pino from "pino";

let makeWASocket: any;
let useMultiFileAuthState: any;
let DisconnectReason: any;
let fetchLatestBaileysVersion: any;
let makeCacheableSignalKeyStore: any;
let baileysLoaded = false;

const AUTH_DIR = "./.salesbot-auth";
const QR_FILE_PATH = "./qr-code.png";

// Logger صامت (فقط للأخطاء) لتجنب spam في Terminal
const logger = pino({
  level: "silent",
  transport: {
    target: "pino/file",
    options: { destination: 1 }, // stdout
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

/**
 * حفظ QR Code كصورة PNG عالية الجودة في مجلد المشروع
 */
async function saveQRCodeImage(qrCode: string): Promise<string | null> {
  try {
    const qrcode = await import("qrcode");
    await qrcode.toFile(QR_FILE_PATH, qrCode, { 
      width: 500, 
      margin: 2,
      color: {
        dark: "#000000",
        light: "#ffffff"
      }
    });
    console.log("");
    console.log("╔═══════════════════════════════════════════════════╗");
    console.log("║  ✅ تم إنشاء/تحديث كود QR بنجاح!                 ║");
    console.log("║                                                   ║");
    console.log("║  📁 مكان الملف: qr-code.png                      ║");
    console.log("║  📱 افتح الملف وامسح الكود من واتساب تاعك       ║");
    console.log("║  📲 واتساب ← الأجهزة المرتبطة ← امسح الكود      ║");
    console.log("║                                                   ║");
    console.log("║  🔄 راح يتحدث الكود تلقائياً كل ما تحتاج         ║");
    console.log("╚═══════════════════════════════════════════════════╝");
    console.log("");
    return QR_FILE_PATH;
  } catch (error: any) {
    console.error("[SalesBot] ⚠️ فشل حفظ صورة QR:", error.message);
    return null;
  }
}

// ── الحالة ──────────────────────────────────────────────

export type BotStatus = "disconnected" | "connecting" | "connected" | "error";

export interface BotState {
  status: BotStatus;
  qrCode: string | null;
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

  const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 60000); // 1s, 2s, 4s, 8s, 16s, 32s, 60s (max)
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

// ── بدء / إيقاف البوت ───────────────────────────────────

export async function startBot(): Promise<BotState> {
  // إذا كان متصلاً بالفعل، لا تفعل شيئاً
  if (state.status === "connected") {
    return getBotState();
  }

  // إذا كان يحاول الاتصال، انتظر
  if (state.status === "connecting") {
    console.log("[SalesBot] ⏳ الاتصال قيد التقدم...");
    return getBotState();
  }

  try { await loadBaileys(); } catch {
    state.status = "error";
    state.lastError = "حزمة Baileys غير مثبتة. شغّل: npm install @whiskeysockets/baileys@latest qrcode pino";
    return getBotState();
  }

  cleanupOldSession();

  state.status = "connecting";
  state.qrCode = null;
  state.lastError = null;

  try {
    const { state: authState, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
    const { version, isLatest } = await fetchLatestBaileysVersion().catch(() => ({ version: [2, 3000, 0], isLatest: true }));

    console.log(`[SalesBot] 📦 إصدار Baileys: ${version.join(".")} — ${isLatest ? "✅ أحدث إصدار" : "⚠️ يوجد إصدار أحدث"}`);

    // ⚙️ إعدادات الاتصال المحسّنة
    sock = makeWASocket({
      version,
      auth: {
        creds: authState.creds,
        keys: makeCacheableSignalKeyStore(authState.keys, logger),
      },
      logger,
      // محاكاة متصفح واتساب ويب الحقيقي (مهم جداً لتجنب Error 515)
      browser: ["Ubuntu", "Chrome", "20.0.04"],
      // إعدادات timeout
      connectTimeoutMs: 60_000,
      qrTimeout: 60_000,
      defaultQueryTimeoutMs: 30_000,
      // تحسين الأداء
      syncFullHistory: false,
      markOnlineOnConnect: false,
      generateHighQualityLinkPreview: false,
      // طباعة QR في Terminal للمساعدة
      printQRInTerminal: false,
    });

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("connection.update", (update: any) => {
      const { connection, lastDisconnect, qr } = update;

      // ── QR Code جديد ──
      if (qr) {
        console.log("[SalesBot] 📱 QR Code جديد تم استلامه - جاري حفظه كصورة...");
        
        // حفظ الصورة مباشرة في مجلد المشروع
        saveQRCodeImage(qr).then((filePath) => {
          if (filePath) {
            state.qrCode = filePath; // نخزن مسار الملف بدل base64
          }
        }).catch((err: any) => {
          console.error("[SalesBot] ❌ فشل حفظ QR Code:", err.message);
        });
      }

      // ── تم الاتصال بنجاح ──
      if (connection === "open") {
        reconnectAttempts = 0; // تصفير عداد المحاولات
        state.status = "connected";
        state.qrCode = null;
        state.startedAt = new Date().toISOString();
        state.lastError = null;
        state.phoneNumber = sock?.user?.id?.split(":")[0] || null;
        console.log(`[SalesBot] ✅ متصل بالواتساب! الرقم: ${state.phoneNumber}`);
      }

      // ── انقطع الاتصال ──
      if (connection === "close") {
        const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;
        const errorMessage = (lastDisconnect?.error as Error)?.message || "";

        console.log(`[SalesBot] ⚠️ انقطع الاتصال (Code: ${statusCode || "غير معروف"}) — ${errorMessage}`);

        // هل خرج المستخدم يدوياً؟
        const isLoggedOut =
          statusCode === DisconnectReason?.loggedOut ||
          errorMessage?.includes("logged out") ||
          errorMessage?.includes("Stream Errored");

        if (isLoggedOut) {
          console.log("[SalesBot] 🚪 تم تسجيل الخروج. تنظيف وإعادة بدء...");
          state.status = "disconnected";
          state.qrCode = null;
          state.phoneNumber = null;
          sock = null;
          cleanupOldSession();
          // إعادة تشغيل تلقائي بعد ثانيتين
          setTimeout(() => startBot(), 2000);
        } else {
          // انقطاع مؤقت: إعادة اتصال
          state.status = "connecting";
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

    return getBotState();
  } catch (e: any) {
    state.status = "error";
    state.lastError = e.message || "خطأ غير معروف";
    console.error("[SalesBot] ❌ خطأ في بدء البوت:", e.message);

    // إعادة محاولة بعد التأخير
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
  state.phoneNumber = null;
  state.startedAt = null;
}