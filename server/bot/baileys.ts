/**
 * WhatsApp Connection Manager using Baileys
 * 
 * تثبيت الحزمة المطلوبة:
 * npm install @whiskeysockets/baileys qrcode pino
 * 
 * هذا الملف خاص بي أنا فقط (صاحب المنصة). يدير اتصال بوت المبيعات
 * برقم واتسابي الشخصي للرد التلقائي على أصحاب المطاعم.
 * 
 * 🔄 التنظيف التلقائي: يحذف جلسة واتساب القديمة عند كل تشغيل
 *    لتوليد QR Code جديد ونظيف تلقائياً.
 */

import type { Boom } from "@hapi/boom";
import { existsSync, rmSync, mkdirSync } from "fs";
import { join } from "path";

let makeWASocket: any;
let useMultiFileAuthState: any;
let DisconnectReason: any;
let fetchLatestBaileysVersion: any;
let baileysLoaded = false;

const AUTH_DIR = "./.salesbot-auth";

async function loadBaileys() {
  if (!baileysLoaded) {
    try {
      const b = await import("@whiskeysockets/baileys");
      makeWASocket = b.default;
      useMultiFileAuthState = b.useMultiFileAuthState;
      DisconnectReason = b.DisconnectReason;
      fetchLatestBaileysVersion = b.fetchLatestBaileysVersion;
      baileysLoaded = true;
    } catch {
      console.error("[SalesBot] ⚠️ Baileys غير مثبت. شغّل: npm install @whiskeysockets/baileys qrcode pino");
      throw new Error("BAILEYS_NOT_INSTALLED");
    }
  }
}

/**
 * تنظيف الجلسة القديمة تلقائياً
 * يحذف مجلد المصادقة القديم لبدء جلسة جديدة تماماً
 */
function cleanupOldSession(): void {
  try {
    const authPath = join(process.cwd(), AUTH_DIR);
    if (existsSync(authPath)) {
      rmSync(authPath, { recursive: true, force: true });
      console.log("[SalesBot] 🧹 تم تنظيف جلسة المصادقة القديمة");
    }
    // إعادة إنشاء المجلد نظيف
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

// ── بدء / إيقاف البوت ───────────────────────────────────

export async function startBot(): Promise<BotState> {
  if (state.status === "connected" || state.status === "connecting") {
    return getBotState();
  }

  try { await loadBaileys(); } catch {
    state.status = "error";
    state.lastError = "حزمة Baileys غير مثبتة. شغّل: npm install @whiskeysockets/baileys qrcode pino";
    return getBotState();
  }

  // 🧹 تنظيف الجلسة القديمة تلقائياً
  cleanupOldSession();

  state.status = "connecting";
  state.qrCode = null;
  state.lastError = null;

  try {
    const { state: authState, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
    const { version } = await fetchLatestBaileysVersion();
    console.log(`[SalesBot] إصدار WA: v${version.join(".")}`);

    sock = makeWASocket({
      version,
      auth: authState,
    });

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("connection.update", (update: any) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        import("qrcode").then(m => {
          // 1. حفظ صورة QR حقيقية في ملف PNG
          m.toFile("./qr-code-1.png", qr, { width: 400 }, (err: any) => {
            if (!err) {
              console.log("");
              console.log("╔═══════════════════════════════════════════════════╗");
              console.log("║  ✅ تم حفظ صورة QR في: qr-code-1.png             ║");
              console.log("║  📱 افتح الملف وامسح الكود من واتساب تاعك       ║");
              console.log("║  📲 واتساب ← الأجهزة المرتبطة ← امسح الكود      ║");
              console.log("╚═══════════════════════════════════════════════════╝");
              console.log("");
              console.log("🔗 أو افتح هاد الرابط في المتصفح:");
              console.log("   http://localhost:8080/api/bot/qr");
              console.log("");
            }
          });

          // 2. توليد base64 لصفحة الويب
          m.toDataURL(qr, { width: 400 }).then((url: string) => {
            state.qrCode = url;
          }).catch(() => { state.qrCode = qr; });
        }).catch(() => { state.qrCode = qr; });
      }

      if (connection === "open") {
        state.status = "connected";
        state.qrCode = null;
        state.startedAt = new Date().toISOString();
        state.lastError = null;
        state.phoneNumber = sock?.user?.id?.split(":")[0] || null;
        console.log("[SalesBot] ✅ متصل بالواتساب");
      }

      if (connection === "close") {
        const code = (lastDisconnect?.error as Boom)?.output?.statusCode;
        const loggedOut = code === DisconnectReason?.loggedOut;
        console.log(`[SalesBot] اتصال مغلق. إعادة اتصال: ${!loggedOut}`);

        if (!loggedOut) {
          state.status = "connecting";
          startBot();
        } else {
          state.status = "disconnected";
          state.qrCode = null;
          state.phoneNumber = null;
          sock = null;
        }
      }
    });

    // استقبال الرسائل
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

        if (messageHandler) {
          try {
            const reply = await messageHandler(incoming);
            if (reply) {
              await sock.sendMessage(incoming.from, { text: reply });
              state.messagesSent++;
            }
          } catch (e) {
            console.error("[SalesBot] خطأ في معالج الرسائل:", e);
          }
        }
      }
    });

    return getBotState();
  } catch (e: any) {
    state.status = "error";
    state.lastError = e.message || "خطأ غير معروف";
    console.error("[SalesBot] خطأ في البدء:", e);
    return getBotState();
  }
}

export async function stopBot(): Promise<void> {
  if (sock) {
    try { await sock.logout(); } catch {}
    sock = null;
  }
  state.status = "disconnected";
  state.qrCode = null;
  state.phoneNumber = null;
  state.startedAt = null;
}