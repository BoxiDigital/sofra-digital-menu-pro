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

  console.log("");
  console.log("╔═══════════════════════════════════════════════════╗");
  console.log("║  🤖 جاري تشغيل بوت المبيعات الذكي...            ║");
  console.log("╚═══════════════════════════════════════════════════╝");
  console.log("");

  // ربط معالج الرسائل بوكيل المبيعات
  setMessageHandler(async (msg) => {
    try {
      const reply = await handleIncomingMessage(msg);
      if (reply) {
        console.log(`[SalesBot] 📨 رد على ${msg.fromName}: ${reply.substring(0, 60)}...`);
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

    if (state.status === "connecting" || state.qrCode) {
      console.log("");
      console.log("╔═══════════════════════════════════════════════════╗");
      console.log("║  📱 امسح QR Code للدخول إلى واتساب              ║");
      console.log("║                                                   ║");
      console.log("║  🔗 افتح هذا الرابط في المتصفح:                  ║");
      console.log("║  http://localhost:8080/api/bot/qr                 ║");
      console.log("║                                                   ║");
      console.log("║  📲 واتساب ← الأجهزة المرتبطة ← امسح الكود      ║");
      console.log("╚═══════════════════════════════════════════════════╝");
      console.log("");
    }

    if (state.status === "connected") {
      console.log("[SalesBot] ✅ البوت متصل وجاهز لاستقبال رسائل الزبناء");
    }

    if (state.status === "error") {
      console.error(`[SalesBot] ⚠️ ${state.lastError}`);
    }
  } catch (e) {
    console.error("[SalesBot] ❌ فشل بدء البوت:", e);
  }
}