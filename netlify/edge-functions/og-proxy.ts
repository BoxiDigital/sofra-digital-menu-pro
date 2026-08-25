// Netlify Edge Function — OG Proxy
// يعترض كاشفات واتساب/Facebook/Twitter ويعيد HTML مخصصًا بـ OG Tags ديناميكية لكل مطعم
//
// Supabase anon key MUST be set in Netlify environment variables:
//   Key:   SUPABASE_ANON_KEY
//   Value: (انسخ المفتاح من Supabase Dashboard → Settings → API → anon public)

import type { Context } from "https://edge.netlify.com";

const SUPABASE_URL = "https://likajtjowrmwjkoieznp.supabase.co";

// قائمة User-Agents التي نعتبرها كاشفات وسائل التواصل
const CRAWLER_PATTERN = /facebookexternalhit|whatsapp|twitterbot|linkedinbot|discordbot|slackbot|telegrambot|skypeuripreview|googlebot|bingbot/i;

// المسارات المعروفة التي ليست صفحات منيو
const NON_MENU_PATHS = new Set(["", "/", "/admin", "/login", "/register", "/favicon.ico"]);

export default async function handler(request: Request, context: Context) {
  const url = new URL(request.url);
  const path = url.pathname.replace(/\/$/, "");

  // تجاهل كل الطلبات ما عدا الكاشفات
  const ua = (request.headers.get("user-agent") || "");
  if (!CRAWLER_PATTERN.test(ua)) return context.next();

  // تجاهل المسارات غير المرتبطة بالمنيو
  if (NON_MENU_PATHS.has(path)) return context.next();
  if (path.includes(".")) return context.next(); // ملفات (CSS, JS, صور...)

  // استخراج slug من المسار
  const slug = path.replace(/^\//, "").split("/")[0];
  if (!slug || slug.length < 2) return context.next();

  try {
    const anonKey = (context as any).env?.SUPABASE_ANON_KEY
      || Deno.env.get("SUPABASE_ANON_KEY")
      || "";

    if (!anonKey) {
      console.error("[og-proxy] SUPABASE_ANON_KEY not set in Netlify env vars");
      return context.next();
    }

    // استعلام Supabase عن بيانات المطعم
    const apiUrl = `${SUPABASE_URL}/rest/v1/restaurants?slug=eq.${encodeURIComponent(slug)}&select=name_ar,logo_url,cover_url,slogan_ar&limit=1`;
    const dbRes = await fetch(apiUrl, {
      headers: {
        "apikey": anonKey,
        "Authorization": `Bearer ${anonKey}`,
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
      const image = restaurant.logo_url || restaurant.cover_url || "";

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

      if (image) {
        html = html.replace(
          /<meta property="og:image" content="[^"]*"/,
          `<meta property="og:image" content="${escapeAttr(image)}"`
        );
        html = html.replace(
          /<meta name="twitter:image" content="[^"]*"/,
          `<meta name="twitter:image" content="${escapeAttr(image)}"`
        );
      }

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