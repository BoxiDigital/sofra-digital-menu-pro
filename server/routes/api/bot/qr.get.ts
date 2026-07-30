/**
 * GET /api/bot/qr
 * صفحة HTML منفصلة تعرض QR Code لمسح واتساب.
 * هذه الصفحة للاستخدام الشخصي فقط ولا ترتبط بتطبيق المطاعم.
 */

import { defineHandler } from "nitro";
import { initSalesBot } from "../../bot/init";
import { getBotState } from "../../bot/baileys";
import { getActiveCount, getRecentLogs } from "../../bot/conversations";

export default defineHandler(async () => {
  await initSalesBot();
  const state = getBotState();
  const activeConversations = getActiveCount();
  const recent = getRecentLogs(5);

  const html = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>🤖 بوت مبيعات سفرة ديجيتال</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #0f172a;
      color: #e2e8f0;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 2rem 1rem;
    }
    .container { max-width: 560px; width: 100%; }
    h1 {
      text-align: center;
      font-size: 1.75rem;
      margin-bottom: 2rem;
      color: #f8fafc;
    }
    .status-card {
      background: #1e293b;
      border-radius: 16px;
      padding: 1.5rem;
      margin-bottom: 1.5rem;
      border: 1px solid #334155;
    }
    .status-row {
      display: flex;
      justify-content: space-between;
      padding: 0.6rem 0;
      border-bottom: 1px solid #1e293b;
    }
    .status-row:last-child { border-bottom: none; }
    .label { color: #94a3b8; font-size: 0.9rem; }
    .value { color: #f1f5f9; font-weight: 600; }
    .badge {
      display: inline-block;
      padding: 0.3rem 0.8rem;
      border-radius: 20px;
      font-size: 0.8rem;
      font-weight: 700;
    }
    .badge-connected { background: #065f46; color: #6ee7b7; }
    .badge-connecting { background: #78350f; color: #fcd34d; }
    .badge-disconnected { background: #7f1d1d; color: #fca5a5; }
    .badge-error { background: #7f1d1d; color: #fca5a5; }
    .qr-container {
      background: #fff;
      border-radius: 16px;
      padding: 1.5rem;
      text-align: center;
      margin-bottom: 1.5rem;
    }
    .qr-container img {
      width: 100%;
      max-width: 300px;
      border-radius: 8px;
    }
    .qr-hint {
      color: #0f172a;
      margin-top: 1rem;
      font-size: 1rem;
      font-weight: 600;
    }
    .actions {
      display: flex;
      gap: 0.75rem;
      margin-bottom: 1.5rem;
    }
    .btn {
      flex: 1;
      padding: 0.75rem 1.5rem;
      border-radius: 12px;
      border: none;
      font-size: 1rem;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s;
    }
    .btn-start { background: #059669; color: #fff; }
    .btn-start:hover { background: #047857; }
    .btn-stop { background: #dc2626; color: #fff; }
    .btn-stop:hover { background: #b91c1c; }
    .btn-refresh { background: #2563eb; color: #fff; }
    .btn-refresh:hover { background: #1d4ed8; }
    .recent { margin-top: 1rem; }
    .recent h3 { font-size: 1.1rem; margin-bottom: 0.75rem; color: #94a3b8; }
    .recent-item {
      background: #1e293b;
      border-radius: 10px;
      padding: 0.75rem 1rem;
      margin-bottom: 0.5rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.9rem;
    }
    .stage-tag {
      padding: 0.2rem 0.6rem;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 600;
      background: #334155;
      color: #cbd5e1;
    }
    .meta-refresh {
      text-align: center;
      color: #64748b;
      margin-top: 0.5rem;
      font-size: 0.8rem;
    }
    .stats { display: flex; gap: 1rem; margin-bottom: 1.5rem; }
    .stat {
      flex: 1;
      background: #1e293b;
      border-radius: 12px;
      padding: 1rem;
      text-align: center;
      border: 1px solid #334155;
    }
    .stat-num { font-size: 1.75rem; font-weight: 800; color: #38bdf8; }
    .stat-label { font-size: 0.8rem; color: #94a3b8; margin-top: 0.25rem; }
    @media (max-width: 480px) {
      h1 { font-size: 1.3rem; }
      .actions { flex-direction: column; }
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>🤖 بوت مبيعات سفرة ديجيتال</h1>

    <div class="stats">
      <div class="stat">
        <div class="stat-num">${state.messagesReceived}</div>
        <div class="stat-label">الرسائل المستلمة</div>
      </div>
      <div class="stat">
        <div class="stat-num">${state.messagesSent}</div>
        <div class="stat-label">الردود المرسلة</div>
      </div>
      <div class="stat">
        <div class="stat-num">${activeConversations}</div>
        <div class="stat-label">محادثة نشطة</div>
      </div>
    </div>

    <div class="status-card">
      <div class="status-row">
        <span class="label">الحالة</span>
        <span class="value">
          <span class="badge badge-${state.status}">
            ${state.status === "connected" ? "🟢 متصل" : state.status === "connecting" ? "🟡 جاري الاتصال" : state.status === "error" ? "🔴 خطأ" : "⚫ غير متصل"}
          </span>
        </span>
      </div>
      ${state.phoneNumber ? \`
      <div class="status-row">
        <span class="label">الرقم المتصل</span>
        <span class="value">\${state.phoneNumber}</span>
      </div>\` : ""}
      ${state.startedAt ? \`
      <div class="status-row">
        <span class="label">بدء التشغيل</span>
        <span class="value">\${new Date(state.startedAt).toLocaleString("ar")}</span>
      </div>\` : ""}
      ${state.lastError ? \`
      <div class="status-row">
        <span class="label">آخر خطأ</span>
        <span class="value" style="color:#fca5a5">\${state.lastError}</span>
      </div>\` : ""}
    </div>

    ${state.qrCode ? \`
    <div class="qr-container">
      <img src="\${state.qrCode}" alt="QR Code">
      <div class="qr-hint">📱 افتح واتساب → الأجهزة المرتبطة → امسح الكود</div>
    </div>
    \` : state.status === "connected" ? \`
    <div class="qr-container" style="background:#065f46;">
      <div style="font-size:3rem;padding:1rem;">✅</div>
      <div class="qr-hint" style="color:#fff;">البوت متصل ويعمل الآن!</div>
    </div>
    \` : ""}

    <div class="actions">
      <form method="POST" action="/api/bot/start" style="flex:1;display:flex;">
        <button type="submit" class="btn btn-start">▶ تشغيل البوت</button>
      </form>
      <form method="POST" action="/api/bot/stop" style="flex:1;display:flex;">
        <button type="submit" class="btn btn-stop">⏹ إيقاف البوت</button>
      </form>
    </div>
    <button class="btn btn-refresh" onclick="location.reload()" style="width:100%;">🔄 تحديث الحالة</button>

    ${recent.length > 0 ? \`
    <div class="recent">
      <h3>📋 آخر المحادثات</h3>
      \${recent.map(c => \`
        <div class="recent-item">
          <span>\${c.name || c.phone}</span>
          <span class="stage-tag">\${c.stage}</span>
        </div>
      \`).join("")}
    </div>
    \` : ""}

    <div class="meta-refresh">
      آخر تحديث: ${new Date().toLocaleString("ar")} — الصفحة تُحدّث يدوياً
    </div>
  </div>
</body>
</html>`;

  return html;
});