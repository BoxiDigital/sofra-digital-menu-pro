/**
 * Nitro Server Plugin — التشغيل التلقائي لبوت المبيعات
 *
 * يتم استدعاء هذا الملف تلقائياً عند بدء تشغيل خادم Nitro.
 * يضمن أن بوت المبيعات يعمل 24/7 في السحاب دون تدخل يدوي.
 */

import { defineNitroPlugin } from "nitro";

export default defineNitroPlugin(() => {
  // تأخير بسيط لضمان جاهزية الخادم
  setTimeout(async () => {
    try {
      const { initSalesBot } = await import("../bot/init");
      await initSalesBot();
      console.log("[SalesBot] ✅ تم التشغيل التلقائي لبوت المبيعات");
    } catch (e: any) {
      if (e?.message === "BAILEYS_NOT_INSTALLED") {
        console.log("[SalesBot] ⚠️ بوت المبيعات معلق - ثبّت baileys أولاً");
      } else {
        console.error("[SalesBot] ❌ فشل التشغيل التلقائي:", e);
      }
    }
  }, 3000);
});