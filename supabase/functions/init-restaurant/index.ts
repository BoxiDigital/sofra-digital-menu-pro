import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ───────────────────────────────────────────
// القالب الافتراضي الثابت (يُنسخ لكل مطعم جديد)
// ───────────────────────────────────────────

const DEFAULT_CATEGORIES = [
  { id: "entrees", name_ar: "مقبلات", name_fr: "Entrées", icon: "Utensils", sort_order: 1 },
  { id: "plats", name_ar: "أطباق رئيسية", name_fr: "Plats", icon: "Beef", sort_order: 2 },
  { id: "snacks", name_ar: "وجبات خفيفة", name_fr: "Snacks", icon: "Sandwich", sort_order: 3 },
  { id: "boissons", name_ar: "مشروبات", name_fr: "Boissons", icon: "Coffee", sort_order: 4 },
];

const DEFAULT_DISHES = [
  {
    id: "en1", name_ar: "بريوات بالدجاج واللوز",
    name_fr: "Briouates au Poulet et Amandes",
    description_ar: "عجينة رقيقة محشوة بالدجاج المتبل واللوز المقرمش، مقلية حتى تصبح ذهبية ومقرمشة.",
    description_fr: "Pâte fine farcie de poulet mariné et d'amandes croustillantes, frite jusqu'à ce qu'elle soit dorée et croustillante.",
    price: 45, category: "entrees",
    image: "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=800&q=80",
    is_available: true, is_halal: true, sort_order: 1,
  },
  {
    id: "en2", name_ar: "سلطة زعلوك مغربية",
    name_fr: "Salade Zaalouk",
    description_ar: "باذنجان مشوي مع الطماطم، الثوم، الكمون، وزيت الزيتون البكر - باردة أو دافئة.",
    description_fr: "Aubergines grillées aux tomates, ail, cumin et huile d'olive vierge - servie froide ou tiède.",
    price: 38, category: "entrees",
    image: "https://images.unsplash.com/photo-1516685018646-549198525c1b?auto=format&fit=crop&w=800&q=80",
    is_available: true, is_vegetarian: true, is_halal: true, is_gluten_free: true, sort_order: 2,
  },
  {
    id: "pl1", name_ar: "طاجين لحم بالبرقوق واللوز",
    name_fr: "Tajine d'Agneau aux Pruneaux",
    description_ar: "لحم غنم طري مطهو ببطء مع البرقوق، اللوز المحمص، العسل والتوابل المغربية العطرية.",
    description_fr: "Agneau tendre mijoté avec pruneaux, amandes grillées, miel et épices marocaines parfumées.",
    price: 95, category: "plats",
    image: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80",
    is_available: true, is_best_seller: true, is_halal: true, sort_order: 3,
  },
  {
    id: "pl2", name_ar: "كسكس ملكي بالخضار واللحم",
    name_fr: "Couscous Royal",
    description_ar: "كسكس تقليدي بالخضار الموسمية، قطع لحم الغنم والدجاج، الحمص والزبيب مع مرق خاص.",
    description_fr: "Couscous traditionnel aux légumes de saison, morceaux d'agneau et poulet, pois chiches et raisins secs avec bouillon spécial.",
    price: 85, category: "plats",
    image: "https://images.unsplash.com/photo-1633945274405-b6c8069047b0?auto=format&fit=crop&w=800&q=80",
    is_available: true, is_halal: true, sort_order: 4,
  },
  {
    id: "pl3", name_ar: "باستيلا بالدجاج",
    name_fr: "Pastilla au Poulet",
    description_ar: "عجينة ورقية هشة محشوة بالدجاج المتبل، اللوز، القرفة والسكر - طبق الملوك التقليدي.",
    description_fr: "Pâte feuilletée croustillante farcie de poulet mariné, amandes, cannelle et sucre - le plat des rois traditionnel.",
    price: 110, category: "plats",
    image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=800&q=80",
    is_available: true, is_new: true, is_halal: true, sort_order: 5,
  },
  {
    id: "sn1", name_ar: "مسمن بالعسل والزبدة",
    name_fr: "Msemen au Miel et Beurre",
    description_ar: "فطائر مغربية مقلية ومقرمشة، تقدم ساخنة مع العسل الطبيعي والزبدة الذائبة.",
    description_fr: "Crêpes feuilletées marocaines croustillantes, servies chaudes avec du miel naturel et du beurre fondu.",
    price: 25, category: "snacks",
    image: "https://images.unsplash.com/photo-1506354666786-959d6d497f1a?auto=format&fit=crop&w=800&q=80",
    is_available: true, is_vegetarian: true, is_halal: true, sort_order: 6,
  },
  {
    id: "sn2", name_ar: "حريرة مغربية",
    name_fr: "Harira Marocaine",
    description_ar: "شوربة مغربية تقليدية غنية بالطماطم، العدس، الحمص، والأعشاب العطرية - طبق رمضاني أصيل.",
    description_fr: "Soupe marocaine traditionnelle riche en tomates, lentilles, pois chiches et herbes aromatiques.",
    price: 30, category: "snacks",
    image: "https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=800&q=80",
    is_available: true, is_halal: true, sort_order: 7,
  },
  {
    id: "bo1", name_ar: "عصير برتقال طازج",
    name_fr: "Jus d'Orange Frais",
    description_ar: "عصير برتقال طبيعي 100% معصور طازج عند الطلب، منعش ومليء بالفيتامينات.",
    description_fr: "Jus d'orange 100% naturel pressé frais à la commande, rafraîchissant et riche en vitamines.",
    price: 20, category: "boissons",
    image: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=800&q=80",
    is_available: true, is_vegetarian: true, is_halal: true, is_gluten_free: true, sort_order: 8,
  },
  {
    id: "bo2", name_ar: "شاي نعناع مغربي",
    name_fr: "Thé à la Menthe Marocain",
    description_ar: "شاي أخضر مع نعناع طازج وسكر، رمز الضيافة المغربية الأصيلة.",
    description_fr: "Thé vert à la menthe fraîche et sucre, symbole de l'hospitalité marocaine authentique.",
    price: 15, category: "boissons",
    image: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80",
    is_available: true, is_vegetarian: true, is_halal: true, is_gluten_free: true, sort_order: 9,
  },
  {
    id: "promo1", name_ar: "طاجين كفتة بالبيض والزيتون",
    name_fr: "Tajine Kefta aux Œufs",
    description_ar: "كرات لحم مفروم متبلة في صلصة الطماطم الغنية مع البيض والزيتون الأخضر - طبق عائلي شهي.",
    description_fr: "Boulettes de viande hachée épicées dans une riche sauce tomate aux œufs et olives vertes - plat familial savoureux.",
    price: 75, category: "plats",
    image: "https://images.unsplash.com/photo-1563379926898-05f4575a45d8?auto=format&fit=crop&w=800&q=80",
    is_available: true, is_halal: true, is_promo: true,
    promo_label_ar: "عرض خاص", promo_label_fr: "Offre Spéciale",
    promo_text_ar: "-10% على كل شيء يوم الثلاثاء",
    promo_text_fr: "-10% sur tout les Mardis",
    sort_order: 10,
  },
];

const DEFAULT_CONFIG = {
  name_ar: "مطعم شِي نُو",
  name_fr: "Chez Nous",
  slogan_ar: "أجود الأطباق المغربية الأصيلة",
  slogan_fr: "Le meilleur de la cuisine marocaine",
  logo_url: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=150&h=150&q=80",
  cover_url: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80",
  working_hours_ar: "يومياً من 12:00 ظهراً حتى 11:00 مساءً",
  working_hours_fr: "Tous les jours de 12h00 à 23h00",
  whatsapp_number: "212600000000",
  whatsapp_message_ar: "مرحباً Chez Nous، أود طلب الوجبات التالية من المنيو:\n\n{items}\n\nالمجموع: {total} درهم\n\nالاسم:\nرقم الهاتف:",
  whatsapp_message_fr: "Bonjour Chez Nous, je souhaite commander les plats suivants:\n\n{items}\n\nTotal : {total} MAD\n\nNom :\nTéléphone :",
  primary_color: "#C8A24D",
  background_color: "dark",
  currency_ar: "درهم",
  currency_fr: "MAD",
};

// ───────────────────────────────────────────

function generateSlug(name: string): string {
  const base = name
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9\u0600-\u06FF\-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
  const suffix = Math.random().toString(36).substring(2, 6);
  return `${base}-${suffix}`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // إنشاء Supabase client بخدمة المستخدم
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    // التحقق من المستخدم
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      console.error("[init-restaurant] Auth error:", authError);
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("[init-restaurant] User:", user.id, user.email);

    // ── جلب اسم المطعم من body الطلب (اختياري) ──
    let restaurantNameAr = "مطعم شِي نُو";
    let restaurantNameFr = "Chez Nous";
    try {
      const body = await req.json();
      if (body.nameAr) restaurantNameAr = body.nameAr;
      if (body.nameFr) restaurantNameFr = body.nameFr;
    } catch { /* no body */ }

    // ── التحقق: هل يوجد مطعم بالفعل لهذا المستخدم؟ ──
    const { data: existingRestaurant, error: checkError } = await supabaseClient
      .from("restaurants")
      .select("id, slug")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle();

    if (checkError) {
      console.error("[init-restaurant] Check error:", checkError);
      return new Response(JSON.stringify({ error: "Database error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (existingRestaurant) {
      console.log("[init-restaurant] Restaurant already exists:", existingRestaurant.id);
      return new Response(JSON.stringify({
        slug: existingRestaurant.slug,
        message: "Restaurant already initialized",
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── إنشاء المطعم الجديد ──
    const slug = generateSlug(restaurantNameAr);
    const restaurantConfig = {
      ...DEFAULT_CONFIG,
      name_ar: restaurantNameAr,
      name_fr: restaurantNameFr,
    };

    const { data: restaurant, error: insertError } = await supabaseClient
      .from("restaurants")
      .insert({ ...restaurantConfig, user_id: user.id, slug })
      .select("id, slug")
      .single();

    if (insertError || !restaurant) {
      console.error("[init-restaurant] Insert restaurant error:", insertError);
      return new Response(JSON.stringify({ error: "Failed to create restaurant" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const restaurantId = restaurant.id;

    console.log("[init-restaurant] Created restaurant:", restaurantId, slug);

    // ── إدراج الفئات الافتراضية ──
    const categoriesWithRestaurant = DEFAULT_CATEGORIES.map((cat) => ({
      ...cat,
      restaurant_id: restaurantId,
    }));

    const { error: catError } = await supabaseClient
      .from("categories")
      .insert(categoriesWithRestaurant);

    if (catError) {
      console.error("[init-restaurant] Categories error:", catError);
      return new Response(JSON.stringify({ error: "Failed to seed categories" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("[init-restaurant] Seeded", categoriesWithRestaurant.length, "categories");

    // ── إدراج الأطباق الافتراضية ──
    const dishesWithRestaurant = DEFAULT_DISHES.map((dish) => ({
      ...dish,
      restaurant_id: restaurantId,
    }));

    const { error: dishError } = await supabaseClient
      .from("dishes")
      .insert(dishesWithRestaurant);

    if (dishError) {
      console.error("[init-restaurant] Dishes error:", dishError);
      return new Response(JSON.stringify({ error: "Failed to seed dishes" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("[init-restaurant] Seeded", dishesWithRestaurant.length, "dishes");
    console.log("[init-restaurant] ✅ Restaurant fully initialized:", slug);

    return new Response(JSON.stringify({ slug }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[init-restaurant] Unexpected error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});