/**
 * Sales Bot Initializer
 * 
 * هذا الملف يجمع مدير اتصال الواتساب مع وكيل المبيعات الذكي.
 * يستدعى مرة واحدة عند بدء تشغيل الخادم.
 */

import { startBot, setMessageHandler } from "./baileys";
import { handleIncomingMessage } from "./salesAgent";

let initialized = false;

export async function initSalesBot() {
  if (initialized) return;
  initialized = true;

  console.log("[SalesBot] 🤖 جاري تهيئة بوت المبيعات...");

  // ربط معالج الرسائل بوكيل المبيعات
  setMessageHandler(async (msg) => {
    try {
      const reply = await handleIncomingMessage(msg);
      if (reply) {
        console.log(`[SalesBot] 📨 رد على ${msg.fromName}: ${reply.substring(0, 50)}...`);
      }
      return reply;
    } catch (e) {
      console.error("[SalesBot] ❌ خطأ في معالجة الرسالة:", e);
      return "عذراً، حدث خطأ تقني. سأعود للرد عليك قريباً 🤝";
    }
  });

  // بدء البوت تلقائياً
  try {
    const state = await startBot();
    console.log(`[SalesBot] 📊 الحالة: ${state.status}`);
    if (state.status === "error") {
      console.error(`[SalesBot] ⚠️ ${state.lastError}`);
    }
    if (state.qrCode) {
      console.log("[SalesBot] 📱 امسح QR Code من لوحة API: GET /api/bot/status");
    }
  } catch (e) {
    console.error("[SalesBot] ❌ فشل بدء البوت:", e);
  }
}