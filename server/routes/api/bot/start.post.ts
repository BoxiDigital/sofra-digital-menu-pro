/**
 * POST /api/bot/start
 * بدء تشغيل بوت المبيعات يدوياً
 */

import { defineHandler } from "nitro";
import { startBot } from "../../bot/baileys";
import { initSalesBot } from "../../bot/init";

export default defineHandler(async () => {
  await initSalesBot();
  const state = await startBot();

  if (state.status === "error") {
    return {
      success: false,
      ...state,
      message: state.lastError,
    };
  }

  return {
    success: true,
    ...state,
    message: state.qrCode
      ? "تم بدء البوت. امسح QR Code من حقل qrCode"
      : state.status === "connected"
        ? "البوت متصل ويعمل الآن ✅"
        : "جاري الاتصال...",
  };
});