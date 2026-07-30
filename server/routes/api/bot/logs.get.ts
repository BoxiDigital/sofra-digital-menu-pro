/**
 * GET /api/bot/logs
 * سجل المحادثات الأخيرة
 */

import { defineHandler } from "nitro";
import { getQuery } from "nitro/h3";
import { getRecentLogs } from "../../bot/conversations";

export default defineHandler(async (event) => {
  const query = getQuery(event);
  const limit = Math.min(Number(query.limit) || 20, 100);
  const logs = getRecentLogs(limit);

  return {
    total: logs.length,
    conversations: logs,
  };
});