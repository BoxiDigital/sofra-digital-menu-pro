/**
 * GET /api/bot/qr
 * صفحة HTML مستقلة تعرض QR Code لمسح واتساب.
 * لا تستورد أي ملفات من bot/ — تجلب البيانات عبر JavaScript من /api/bot/status.
 */

import { defineHandler } from "nitro";

export default defineHandler(() => {
  const html = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>🤖 بوت مبيعات سفرة ديجيتال</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#0f172a;color:#e2e8f0;min-height:100vh;display:flex;flex-direction:column;align-items:center;padding:2rem 1rem}
.container{max-width:560px;width:100%}
h1{text-align:center;font-size:1.75rem;margin-bottom:2rem;color:#f8fafc}
.status-card{background:#1e293b;border-radius:16px;padding:1.5rem;margin-bottom:1.5rem;border:1px solid #334155}
.status-row{display:flex;justify-content:space-between;padding:.6rem 0;border-bottom:1px solid #1e293b}
.status-row:last-child{border-bottom:none}
.label{color:#94a3b8;font-size:.9rem}
.value{color:#f1f5f9;font-weight:600}
.badge{display:inline-block;padding:.3rem .8rem;border-radius:20px;font-size:.8rem;font-weight:700}
.bg-green{background:#065f46;color:#6ee7b7}
.bg-yellow{background:#78350f;color:#fcd34d}
.bg-red{background:#7f1d1d;color:#fca5a5}
.qr-container{background:#fff;border-radius:16px;padding:1.5rem;text-align:center;margin-bottom:1.5rem}
.qr-container img{width:100%;max-width:300px;border-radius:8px}
.qr-hint{color:#0f172a;margin-top:1rem;font-size:1rem;font-weight:600}
.actions{display:flex;gap:.75rem;margin-bottom:1.5rem}
.btn{flex:1;padding:.75rem 1.5rem;border-radius:12px;border:none;font-size:1rem;font-weight:700;cursor:pointer;transition:all .2s;color:#fff}
.btn-start{background:#059669}.btn-start:hover{background:#047857}
.btn-stop{background:#dc2626}.btn-stop:hover{background:#b91c1c}
.btn-refresh{background:#2563eb;width:100%}.btn-refresh:hover{background:#1d4ed8}
.recent{margin-top:1rem}
.recent h3{font-size:1.1rem;margin-bottom:.75rem;color:#94a3b8}
.recent-item{background:#1e293b;border-radius:10px;padding:.75rem 1rem;margin-bottom:.5rem;display:flex;justify-content:space-between;align-items:center;font-size:.9rem}
.stage-tag{padding:.2rem .6rem;border-radius:12px;font-size:.75rem;font-weight:600;background:#334155;color:#cbd5e1}
.meta-refresh{text-align:center;color:#64748b;margin-top:.5rem;font-size:.8rem}
.stats{display:flex;gap:1rem;margin-bottom:1.5rem}
.stat{flex:1;background:#1e293b;border-radius:12px;padding:1rem;text-align:center;border:1px solid #334155}
.stat-num{font-size:1.75rem;font-weight:800;color:#38bdf8}
.stat-label{font-size:.8rem;color:#94a3b8;margin-top:.25rem}
.spinner{border:3px solid #334155;border-top:3px solid #38bdf8;border-radius:50%;width:40px;height:40px;animation:spin 1s linear infinite;margin:2rem auto}
@keyframes spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}
@media(max-width:480px){h1{font-size:1.3rem}.actions{flex-direction:column}}
</style>
</head>
<body>
<div class="container">
<h1>🤖 بوت مبيعات سفرة ديجيتال</h1>
<div id="stats" class="stats">
<div class="stat"><div class="stat-num">-</div><div class="stat-label">الرسائل المستلمة</div></div>
<div class="stat"><div class="stat-num">-</div><div class="stat-label">الردود المرسلة</div></div>
<div class="stat"><div class="stat-num">-</div><div class="stat-label">محادثة نشطة</div></div>
</div>
<div id="status-card" class="status-card"><div class="spinner"></div></div>
<div id="qr-section"></div>
<div class="actions">
<button class="btn btn-start" onclick="callBot('start')">▶ تشغيل البوت</button>
<button class="btn btn-stop" onclick="callBot('stop')">⏹ إيقاف البوت</button>
</div>
<button class="btn btn-refresh" onclick="loadStatus()">🔄 تحديث الحالة</button>
<div id="recent"></div>
<div class="meta-refresh" id="last-update">جاري التحميل...</div>
</div>
<script>
function badgeClass(s){return s==='connected'?'bg-green':s==='connecting'?'bg-yellow':'bg-red'}
function badgeText(s){return s==='connected'?'🟢 متصل':s==='connecting'?'🟡 جاري الاتصال':s==='error'?'🔴 خطأ':'⚫ غير متصل'}

async function callBot(action){
  const resp = await fetch('/api/bot/'+action, {method:'POST'});
  if(resp.ok) loadStatus();
}

async function loadStatus(){
  try{
    const resp = await fetch('/api/bot/status');
    if(!resp.ok){document.getElementById('status-card').innerHTML='<div style="color:#fca5a5;text-align:center;padding:1rem">⚠️ تعذر الاتصال بالخادم. تأكد من تشغيل npm run dev</div>';return}
    const s = await resp.json();

    // Stats
    document.getElementById('stats').innerHTML =
      '<div class="stat"><div class="stat-num">'+s.messagesReceived+'</div><div class="stat-label">الرسائل المستلمة</div></div>'+
      '<div class="stat"><div class="stat-num">'+s.messagesSent+'</div><div class="stat-label">الردود المرسلة</div></div>'+
      '<div class="stat"><div class="stat-num">'+s.activeConversations+'</div><div class="stat-label">محادثة نشطة</div></div>';

    // Status card
    var rows = '<div class="status-row"><span class="label">الحالة</span><span class="value"><span class="badge '+badgeClass(s.status)+'">'+badgeText(s.status)+'</span></span></div>';
    if(s.phoneNumber) rows+='<div class="status-row"><span class="label">الرقم المتصل</span><span class="value">'+esc(s.phoneNumber)+'</span></div>';
    if(s.startedAt) rows+='<div class="status-row"><span class="label">بدء التشغيل</span><span class="value">'+new Date(s.startedAt).toLocaleString('ar')+'</span></div>';
    if(s.lastError) rows+='<div class="status-row"><span class="label">آخر خطأ</span><span class="value" style="color:#fca5a5">'+esc(s.lastError)+'</span></div>';
    document.getElementById('status-card').innerHTML = rows;

    // QR or connected
    var qr = '';
    if(s.qrCode){
      qr = '<div class="qr-container"><img src="'+esc(s.qrCode)+'" alt="QR Code"><div class="qr-hint">📱 افتح واتساب ← الأجهزة المرتبطة ← امسح الكود</div></div>';
    } else if(s.status==='connected'){
      qr = '<div class="qr-container" style="background:#065f46"><div style="font-size:3rem;padding:1rem">✅</div><div class="qr-hint" style="color:#fff">البوت متصل ويعمل الآن!</div></div>';
    }
    document.getElementById('qr-section').innerHTML = qr;

    // Recent
    var recentHtml = '';
    if(s.recentConversations && s.recentConversations.length>0){
      recentHtml = '<div class="recent"><h3>📋 آخر المحادثات</h3>';
      for(var i=0; i<s.recentConversations.length; i++){
        var c = s.recentConversations[i];
        recentHtml += '<div class="recent-item"><span>'+esc(c.name||c.phone)+'</span><span class="stage-tag">'+esc(c.stage)+'</span></div>';
      }
      recentHtml += '</div>';
    }
    document.getElementById('recent').innerHTML = recentHtml;

    document.getElementById('last-update').textContent = 'آخر تحديث: '+new Date().toLocaleString('ar');
  }catch(e){
    document.getElementById('status-card').innerHTML='<div style="color:#fca5a5;text-align:center;padding:1rem">⚠️ خطأ: '+esc(String(e))+'</div>';
  }
}

function esc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}

loadStatus();
setInterval(loadStatus, 10000);
</script>
</body>
</html>`;

  return html;
});