// Netlify Edge Function — OG Proxy
// يعترض كاشفات واتساب/Facebook/Twitter ويعيد HTML مخصصًا بـ OG Tags ديناميكية لكل مطعم
//
// المفتاح (anon public key) مثبت مباشرة هنا لأنه مفتاح عام يُبثّ أصلاً داخل حزمة الواجهة
// (client.ts) — فلا يمثل أي كشف إضافي، ويُلغي الحاجة لضبط متغيرات Netlify يدويًا.

import type { Context } from "https://edge.netlify.com";

const SUPABASE_URL = "https://likajtjowrmwjkoieznp.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxpa2FqdGpvd3Jtd2prb2llem5wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ5NTgwNTEsImV4cCI6MjEwMDUzNDA1MX0.wknTP5CnWIm92YILSn91obuNLQry-p-A2qjjew6I0V0";

// الصورة الافتراضية العامة (تُستخدم عند غياب شعار المطعم أو حدوث خطأ)
const DEFAULT_OG_IMAGE =
  "https://likajtjowrmwjkoieznp.supabase.co/storage/v1/object/public/dish-images/sofra-og-default.jpg";

// قائمة User-Agents التي نعتبرها كاشفات وسائل التواصل
const CRAWLER_PATTERN = /facebookexternalhit|whatsapp|twitterbot|linkedinbot|discordbot|slackbot|telegrambot|skypeuripreview|googlebot|bingbot/i;

// المسارات المعروفة التي ليست صفحات منيو
const NON_MENU_PATHS = new Set(["", "/", "/admin", "/login", "/register", "/favicon.ico"]);

export default async function handler(request: Request, context: Context) {
  const url = new URL(request.url);

  // فك تشفير المسار (مهم جدًا للسَلَغ العربية مثل /مطعم-test-t7jw)
  let path = url.pathname.replace(/\/$/, "");
  try {
    path = decodeURIComponent(path);
  } catch {
    // في حال وجود تسلسل ترميز خاطئ نُبقي المسار كما هو
  }

  // تجاهل كل الطلبات ما عدا الكاشفات
  const ua = request.headers.get("user-agent") || "";
  if (!CRAWLER_PATTERN.test(ua)) return context.next();

  // تجاهل المسارات غير المرتبطة بالمنيو
  if (NON_MENU_PATHS.has(path)) return context.next();
  if (path.includes(".")) return context.next(); // ملفات (CSS, JS, صور...)

  // استخراج slug من المسار (بعد فك الترميز)
  const slug = path.replace(/^\//, "").split("/")[0];
  if (!slug || slug.length < 2) return context.next();

  try {
    // استعلام Supabase عن بيانات المطعم
    const apiUrl = `${SUPABASE_URL}/rest/v1/restaurants?slug=eq.${encodeURIComponent(slug)}&select=name_ar,logo_url,cover_url,slogan_ar&limit=1`;
    const dbRes = await fetch(apiUrl, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
    });

    if (!dbRes.ok) {
      console.error(`[og-proxy] Supabase error: ${dbRes.status}`);
      return context.next();
    }

    const data = await dbRes.json();
    const restaurant = data?.[0];

    // جلب استجابة HTML الأصلية
    const response = await context.next();
    const originalHtml = await response.text();

    if (restaurant) {
      const title = `${restaurant.name_ar} — قائمة رقمية | سُفرة`;
      const desc = restaurant.slogan_ar || `${restaurant.name_ar} — منيو رقمي احترافي`;
      // الشعار أولاً، ثم الغلاف، ثم الصورة الافتراضية (Fallback)
      const image = restaurant.logo_url || restaurant.cover_url || DEFAULT_OG_IMAGE;

      // استبدال OG tags في HTML
      let html = originalHtml;

      // <title>
      html = html.replace(/<title>[^<]*<\/title>/, `<title>${escapeHtml(title)}</title>`);

      // og:title
      html = html.replace(
        /<meta property="og:title" content="[^"]*"/,
        `<meta property="og:title" content="${escapeAttr(title)}"`
      );

      // og:description
      html = html.replace(
        /<meta property="og:description" content="[^"]*"/,
        `<meta property="og:description" content="${escapeAttr(desc)}"`
      );

      // og:url
      html = html.replace(
        /<meta property="og:url" content="[^"]*"/,
        `<meta property="og:url" content="${escapeAttr(request.url)}"`
      );

      // og:image (دائمًا — مع fallback للصورة الافتراضية)
      html = html.replace(
        /<meta property="og:image" content="[^"]*"/,
        `<meta property="og:image" content="${escapeAttr(image)}"`
      );

      // description
      html = html.replace(
        /<meta name="description" content="[^"]*"/,
        `<meta name="description" content="${escapeAttr(desc)}"`
      );

      // twitter
      html = html.replace(
        /<meta name="twitter:title" content="[^"]*"/,
        `<meta name="twitter:title" content="${escapeAttr(title)}"`
      );
      html = html.replace(
        /<meta name="twitter:description" content="[^"]*"/,
        `<meta name="twitter:description" content="${escapeAttr(desc)}"`
      );
      html = html.replace(
        /<meta name="twitter:image" content="[^"]*"/,
        `<meta name="twitter:image" content="${escapeAttr(image)}"`
      );

      return new Response(html, {
        status: response.status,
        headers: response.headers,
      });
    }

    return new Response(originalHtml, {
      status: response.status,
      headers: response.headers,
    });
  } catch (err) {
    console.error("[og-proxy] Unexpected error:", err);
    return context.next();
  }
}

// دوال مساعدة لتنظيف النصوص من HTML injection
function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function escapeAttr(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

export const config = { path: "/*" };
