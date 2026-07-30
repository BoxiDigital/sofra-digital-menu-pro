/**
 * GET /api/bot/status
 * يعرض حالة بوت المبيعات + QR Code للمسح
 */

import { defineHandler } from "nitro";
import { initSalesBot } from "../../bot/init";
import { getBotState } from "../../bot/baileys";
import { getRecentLogs, getActiveCount } from "../../bot/conversations";

export default defineHandler(async () => {
  // تأكد أن البوت يعمل
  await initSalesBot();

  const state = getBotState();
  const activeCount = getActiveCount();
  const recent = getRecentLogs(10);

  return {
    ...state,
    activeConversations: activeCount,
    recentConversations: recent,
    hint: state.qrCode
      ? "امسح QR Code الظاهر في qrCode لتسجيل الدخول إلى واتساب"
      : state.status === "connected"
        ? "البوت متصل وجاهز لاستقبال الرسائل"
        : "البوت في وضع الاستعداد",
  };
});