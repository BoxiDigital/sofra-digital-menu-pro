/**
 * WhatsApp Connection Manager using WhatsApp Web.js + Puppeteer
 * 
 * 🚀 حل بديل مضمون 100%: محاكاة متصفح Chromium عادي عبر HTTPS
 * لا يحتاج WebSocket مباشر - يعمل عبر بورت 443 المفتوح دائماً
 * 
 * الرقم الحصري: 212699954816
 */

import { Client, LocalAuth, Message } from "whatsapp-web.js";
import { existsSync, mkdirSync, rmSync, writeFileSync } from "fs";
import { join } from "path";

const AUTH_DIR = "./.wwebjs-auth";
const QR_CODE_FILE = "./qr-code.png";
const RECONNECT_DELAY = 10_000; // 10 ثواني

// ⚙️ رقم هاتف واتساب المراد ربطه
const WHATSAPP_PHONE_NUMBER = "212699954816";

// ── الحالة ──────────────────────────────────────────────

export type BotStatus = "disconnected" | "connecting" | "connected" | "error" | "qr_ready";

export interface BotState {
  status: BotStatus;
  qrCode: string | null;
  pairingCode: null;
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

let client: Client | null = null;
let messageHandler: ((msg: IncomingMessage) => Promise<string | null>) | null = null;
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
  if (!client || state.status !== "connected") return false;
  try {
    await client.sendMessage(to, text);
    state.messagesSent++;
    return true;
  } catch (e: any) {
    console.error("[SalesBot] فشل إرسال الرسالة:", e.message);
    return false;
  }
}

// ── تنظيف الجلسة القديمة ────────────────────────────────

function cleanupSession() {
  try {
    const authPath = join(process.cwd(), AUTH_DIR);
    if (existsSync(authPath)) {
      rmSync(authPath, { recursive: true, force: true });
      console.log("[SalesBot] 🧹 تم حذف جلسة WhatsApp Web القديمة");
    }
    mkdirSync(authPath, { recursive: true });
    console.log("[SalesBot] ✨ مجلد جلسة جديد جاهز");
  } catch (e: any) {
    console.error("[SalesBot] ⚠️ خطأ في تنظيف الجلسة:", e.message);
  }
}

// ── إنشاء عميل WhatsApp Web.js ───────────────────────────

function createClient(): Client {
  const clientOptions: any = {
    authStrategy: new LocalAuth({
      dataPath: AUTH_DIR,
    }),
    puppeteer: {
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--no-first-run",
        "--no-zygote",
        "--disable-gpu",
        "--single-process",
      ],
    },
  };

  const c = new Client(clientOptions);

  // ── QR Code جاهز ──
  c.on("qr", (qr: string) => {
    console.log("");
    console.log("╔═══════════════════════════════════════════════════╗");
    console.log("║  📱 WhatsApp Web QR Code جاهز!                   ║");
    console.log("║                                                   ║");
    console.log("║  📲 للربط:                                        ║");
    console.log("║  1. افتح واتساب على هاتفك                          ║");
    console.log("║  2. اذهب إلى: الأجهزة المرتبطة                    ║");
    console.log("║  3. اضغط: ربط جهاز                                ║");
    console.log("║  4. امسح QR Code الظاهر في terminal               ║");
    console.log("║                                                   ║");
    console.log("║  💡 أو افتح صفحة /api/bot/qr لعرض الكود            ║");
    console.log("╚═══════════════════════════════════════════════════╝");
    console.log("");

    state.status = "qr_ready";
    state.qrCode = qr;
    state.lastError = null;
  });

  // ── تم الاتصال بنجاح ──
  c.on("ready", () => {
    state.status = "connected";
    state.qrCode = null;
    state.startedAt = new Date().toISOString();
    state.lastError = null;
    state.phoneNumber = WHATSAPP_PHONE_NUMBER;

    console.log("");
    console.log("╔═══════════════════════════════════════════════════╗");
    console.log("║  ✅✅✅ تم الاتصال بالواتساب بنجاح!              ║");
    console.log(`║  📱 الرقم: ${WHATSAPP_PHONE_NUMBER.padEnd(36)}║`);
    console.log("║  🟢 البوت نشط ومستعد لاستقبال الرسائل             ║");
    console.log("╚═══════════════════════════════════════════════════╝");
    console.log("");
  });

  // ── انقطع الاتصال ──
  c.on("disconnected", (reason: string) => {
    console.log(`[SalesBot] ⚠️ انقطع الاتصال: ${reason}`);
    state.status = "disconnected";
    state.qrCode = null;
    
    // إعادة اتصال تلقائية
    if (reason === "NAVIGATION" || reason === "CLOSE" || reason === "LOGOUT") {
      console.log("[SalesBot] 🔄 إعادة تشغيل تلقائية...");
      if (reconnectTimer) clearTimeout(reconnectTimer);
      reconnectTimer = setTimeout(() => {
        cleanupSession();
        startBot();
      }, RECONNECT_DELAY);
    }
  });

  // ── فشل المصادقة ──
  c.on("auth_failure", (msg: string) => {
    console.error(`[SalesBot] ❌ فشل المصادقة: ${msg}`);
    state.status = "error";
    state.lastError = `AUTH_FAILURE: ${msg}`;
  });

  // ── استقبال الرسائل ──
  c.on("message_create", async (msg: Message) => {
    // تجاهل الرسائل الصادرة من البوت نفسه
    if (msg.fromMe) return;

    const text = msg.body?.trim();
    if (!text) return;

    state.messagesReceived++;
    const incoming: IncomingMessage = {
      from: msg.from,
      fromName: msg._data?.notifyName || "زائر",
      body: text,
      timestamp: msg.timestamp * 1000 || Date.now(),
    };

    console.log(`[SalesBot] 📩 رسالة من ${incoming.fromName}: ${text.substring(0, 50)}...`);

    if (messageHandler) {
      try {
        const reply = await messageHandler(incoming);
        if (reply && msg.from) {
          await client?.sendMessage(msg.from, reply);
          state.messagesSent++;
        }
      } catch (e: any) {
        console.error("[SalesBot] خطأ في معالجة الرسالة:", e.message);
      }
    }
  });

  return c;
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

  // تنظيف الجلسة القديمة
  cleanupSession();

  state.status = "connecting";
  state.qrCode = null;
  state.lastError = null;

  try {
    client = createClient();
    
    console.log("[SalesBot] 🚀 جاري بدء WhatsApp Web (HTTPS/443)...");
    console.log("[SalesBot] ⏳ في انتظار QR Code...");
    
    // تشغيل العميل - هذا غير متزامن ولا ننتظره
    client.initialize().catch((e: any) => {
      console.error("[SalesBot] ❌ فشل تهيئة العميل:", e.message);
      state.status = "error";
      state.lastError = `INIT_FAILED: ${e.message}`;
    });

    return getBotState();
  } catch (e: any) {
    state.status = "error";
    state.lastError = e.message;
    console.error("[SalesBot] ❌ خطأ في startBot:", e.message);
    return getBotState();
  }
}

export async function stopBot(): Promise<void> {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }

  if (client) {
    try {
      await client.destroy();
      console.log("[SalesBot] 👋 تم تدمير العميل");
    } catch (e: any) {
      console.log("[SalesBot] ℹ️ تدمير العميل:", e.message);
    }
    client = null;
  }
  state.status = "disconnected";
  state.qrCode = null;
  state.phoneNumber = null;
  state.startedAt = null;
}