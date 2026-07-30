/**
 * POST /api/bot/stop
 * إيقاف بوت المبيعات
 */

import { defineHandler } from "nitro";
import { stopBot } from "../../../bot/baileys";

export default defineHandler(async () => {
  await stopBot();
  return {
    success: true,
    message: "تم إيقاف البوت بنجاح ✅",
  };
});