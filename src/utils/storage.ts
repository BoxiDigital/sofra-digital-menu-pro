import { supabase } from "@/integrations/supabase/client";
import { Category, Dish, RestaurantConfig, Review } from "../types";
import { defaultCategories, defaultDishes, defaultRestaurantConfig } from "../data/defaultData";

// ───────────────────────────────────────────
// دوال التحويل بين صيغ قاعدة البيانات و TypeScript
// ───────────────────────────────────────────

function mapCategoryFromDB(row: any): Category {
  return {
    id: row.id,
    nameAr: row.name_ar,
    nameFr: row.name_fr,
    icon: row.icon,
  };
}

function mapCategoryToDB(cat: Category, restaurantId: string): any {
  return {
    id: cat.id,
    name_ar: cat.nameAr,
    name_fr: cat.nameFr,
    icon: cat.icon,
    restaurant_id: restaurantId,
  };
}

function mapDishFromDB(row: any): Dish {
  return {
    id: row.id,
    nameAr: row.name_ar,
    nameFr: row.name_fr,
    descriptionAr: row.description_ar,
    descriptionFr: row.description_fr,
    price: Number(row.price),
    category: row.category,
    image: row.image,
    isAvailable: row.is_available,
    isNew: row.is_new,
    isBestSeller: row.is_best_seller,
    isVegetarian: row.is_vegetarian,
    isHalal: row.is_halal,
    isGlutenFree: row.is_gluten_free,
    isPromo: row.is_promo,
    promoLabelAr: row.promo_label_ar,
    promoLabelFr: row.promo_label_fr,
    promoTextAr: row.promo_text_ar,
    promoTextFr: row.promo_text_fr,
  };
}

function mapDishToDB(dish: Dish, restaurantId: string): any {
  return {
    id: dish.id,
    name_ar: dish.nameAr,
    name_fr: dish.nameFr,
    description_ar: dish.descriptionAr,
    description_fr: dish.descriptionFr,
    price: dish.price,
    category: dish.category,
    image: dish.image,
    is_available: dish.isAvailable,
    is_new: dish.isNew || false,
    is_best_seller: dish.isBestSeller || false,
    is_vegetarian: dish.isVegetarian || false,
    is_halal: dish.isHalal || false,
    is_gluten_free: dish.isGlutenFree || false,
    is_promo: dish.isPromo || false,
    promo_label_ar: dish.promoLabelAr || "",
    promo_label_fr: dish.promoLabelFr || "",
    promo_text_ar: dish.promoTextAr || "",
    promo_text_fr: dish.promoTextFr || "",
    restaurant_id: restaurantId,
  };
}

function mapConfigFromDB(row: any): RestaurantConfig & { id?: string; slug?: string } {
  return {
    nameAr: row.name_ar,
    nameFr: row.name_fr,
    sloganAr: row.slogan_ar,
    sloganFr: row.slogan_fr,
    logoUrl: row.logo_url,
    coverUrl: row.cover_url,
    workingHoursAr: row.working_hours_ar,
    workingHoursFr: row.working_hours_fr,
    whatsappNumber: row.whatsapp_number,
    whatsappMessageAr: row.whatsapp_message_ar,
    whatsappMessageFr: row.whatsapp_message_fr,
    primaryColor: row.primary_color,
    backgroundColor: row.background_color,
    currencyAr: row.currency_ar,
    currencyFr: row.currency_fr,
    googleMapsUrl: row.google_maps_url || "",
    id: row.id,
    slug: row.slug,
  };
}

function mapConfigToDB(config: RestaurantConfig): any {
  return {
    name_ar: config.nameAr,
    name_fr: config.nameFr,
    slogan_ar: config.sloganAr,
    slogan_fr: config.sloganFr,
    logo_url: config.logoUrl,
    cover_url: config.coverUrl,
    working_hours_ar: config.workingHoursAr,
    working_hours_fr: config.workingHoursFr,
    whatsapp_number: config.whatsappNumber,
    whatsapp_message_ar: config.whatsappMessageAr,
    whatsapp_message_fr: config.whatsappMessageFr,
    primary_color: config.primaryColor,
    background_color: config.backgroundColor,
    currency_ar: config.currencyAr,
    currency_fr: config.currencyFr,
    google_maps_url: config.googleMapsUrl,
  };
}

// ───────────────────────────────────────────
// دوال عامة (للزوار)
// ───────────────────────────────────────────

export async function hasAnyRestaurant(): Promise<boolean> {
  const { data } = await supabase
    .from("restaurants")
    .select("id")
    .limit(1);
  return (data?.length ?? 0) > 0;
}

export const hasRegisteredRestaurant = hasAnyRestaurant;

export async function getRestaurantBySlug(slug: string): Promise<(RestaurantConfig & { id: string; slug: string }) | null> {
  const { data, error } = await supabase
    .from("restaurants")
    .select("*")
    .eq("slug", slug)
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;

  return mapConfigFromDB(data) as RestaurantConfig & { id: string; slug: string };
}

export async function getCategoriesByRestaurant(restaurantId: string): Promise<Category[]> {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("restaurant_id", restaurantId)
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("[sofra] getCategoriesByRestaurant error:", error);
    return [];
  }
  return (data || []).map(mapCategoryFromDB);
}

export async function getDishesByRestaurant(restaurantId: string): Promise<Dish[]> {
  const { data, error } = await supabase
    .from("dishes")
    .select("*")
    .eq("restaurant_id", restaurantId)
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("[sofra] getDishesByRestaurant error:", error);
    return [];
  }
  return (data || []).map(mapDishFromDB);
}

// ───────────────────────────────────────────
// دوال لوحة التحكم (للمالك)
// ───────────────────────────────────────────

export async function getMyRestaurantId(): Promise<string | null> {
  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData.session?.user?.id;
  if (!userId) return null;

  const { data, error } = await supabase
    .from("restaurants")
    .select("id")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;
  return data.id;
}

export async function getMyRestaurant(): Promise<(RestaurantConfig & { id: string; slug: string }) | null> {
  const restaurantId = await getMyRestaurantId();
  if (!restaurantId) return null;

  const { data, error } = await supabase
    .from("restaurants")
    .select("*")
    .eq("id", restaurantId)
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;
  return mapConfigFromDB(data) as RestaurantConfig & { id: string; slug: string };
}

export async function getMyCategories(): Promise<Category[]> {
  const restaurantId = await getMyRestaurantId();
  if (!restaurantId) return [];
  return getCategoriesByRestaurant(restaurantId);
}

export async function getMyDishes(): Promise<Dish[]> {
  const restaurantId = await getMyRestaurantId();
  if (!restaurantId) return [];
  return getDishesByRestaurant(restaurantId);
}

export async function saveMyCategories(categories: Category[]): Promise<void> {
  const restaurantId = await getMyRestaurantId();
  if (!restaurantId) throw new Error("المطعم غير موجود");

  const rows = categories.map((cat) => mapCategoryToDB(cat, restaurantId));

  const keptIds = categories.map((c) => c.id);
  const { data: existing } = await supabase.from("categories").select("id").eq("restaurant_id", restaurantId);
  const toDelete = (existing || []).filter((row) => !keptIds.includes(row.id)).map((row) => row.id);
  if (toDelete.length > 0) {
    await supabase.from("categories").delete().in("id", toDelete);
  }

  if (rows.length > 0) {
    const { error } = await supabase.from("categories").upsert(rows);
    if (error) throw error;
  }
  dispatchDataChange();
}

export async function saveMyDishes(dishes: Dish[]): Promise<void> {
  const restaurantId = await getMyRestaurantId();
  if (!restaurantId) throw new Error("المطعم غير موجود");

  const rows = dishes.map((dish) => mapDishToDB(dish, restaurantId));

  const keptIds = dishes.map((d) => d.id);
  const { data: existing } = await supabase.from("dishes").select("id").eq("restaurant_id", restaurantId);
  const toDelete = (existing || []).filter((row) => !keptIds.includes(row.id)).map((row) => row.id);
  if (toDelete.length > 0) {
    await supabase.from("dishes").delete().in("id", toDelete);
  }

  if (rows.length > 0) {
    const { error } = await supabase.from("dishes").upsert(rows);
    if (error) throw error;
  }
  dispatchDataChange();
}

export async function saveMyConfig(config: RestaurantConfig): Promise<void> {
  const restaurantId = await getMyRestaurantId();
  if (!restaurantId) throw new Error("المطعم غير موجود");

  const row = mapConfigToDB(config);
  const { error } = await supabase
    .from("restaurants")
    .update({ ...row, updated_at: new Date().toISOString() })
    .eq("id", restaurantId);

  if (error) throw error;
  dispatchDataChange();
}

export async function seedMyDefaultData(nameAr?: string, nameFr?: string): Promise<{ slug: string }> {
  const { data: authData } = await supabase.auth.getSession();
  const userId = authData.session?.user?.id;
  const userEmail = authData.session?.user?.email || "";

  if (!userId) throw new Error("يجب تسجيل الدخول أولاً");

  const emailPrefix = userEmail.includes("@")
    ? userEmail.split("@")[0].replace(/[._-]/g, " ")
    : "";

  const finalNameAr = nameAr || `مطعم ${emailPrefix}` || defaultRestaurantConfig.nameAr;
  const finalNameFr = nameFr || `Restaurant ${emailPrefix}` || defaultRestaurantConfig.nameFr;

  const base = finalNameAr
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9\u0600-\u06FF\-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
  const suffix = Math.random().toString(36).substring(2, 6);
  const slug = `${base}-${suffix}`;

  const configRow = mapConfigToDB({
    ...defaultRestaurantConfig,
    nameAr: finalNameAr,
    nameFr: finalNameFr,
  });

  const { error: insertError } = await supabase
    .from("restaurants")
    .insert({ ...configRow, user_id: userId, slug });

  if (insertError) {
    console.error("[sofra] seedMyDefaultData error:", insertError);
    throw insertError;
  }

  dispatchDataChange();
  return { slug };
}

export async function resetMyToDefault(): Promise<void> {
  const restaurantId = await getMyRestaurantId();
  if (!restaurantId) return;

  await supabase.from("dishes").delete().eq("restaurant_id", restaurantId);
  await supabase.from("categories").delete().eq("restaurant_id", restaurantId);

  const catRows = defaultCategories.map((cat) => mapCategoryToDB({ ...cat, id: crypto.randomUUID() }, restaurantId));
  await supabase.from("categories").insert(catRows);

  const catMap = new Map<string, string>();
  defaultCategories.forEach((oldCat, i) => {
    catMap.set(oldCat.id, catRows[i].id);
  });

  const dishRows = defaultDishes.map((dish) =>
    mapDishToDB({ ...dish, id: crypto.randomUUID(), category: catMap.get(dish.category) || dish.category }, restaurantId)
  );
  await supabase.from("dishes").insert(dishRows);

  dispatchDataChange();
}

// ───────────────────────────────────────────
// دوال متوافقة مع الكود القديم
// ───────────────────────────────────────────

export async function getRestaurantConfig(): Promise<RestaurantConfig | null> {
  const myRestaurant = await getMyRestaurant();
  if (!myRestaurant) return null;
  const { id, slug, ...config } = myRestaurant as any;
  return config;
}

export async function saveRestaurantConfig(config: RestaurantConfig): Promise<void> {
  await saveMyConfig(config);
}

export async function getCategories(): Promise<Category[]> {
  return getMyCategories();
}

export async function saveCategories(categories: Category[]): Promise<void> {
  await saveMyCategories(categories);
}

export async function getDishes(): Promise<Dish[]> {
  return getMyDishes();
}

export async function saveDishes(dishes: Dish[]): Promise<void> {
  await saveMyDishes(dishes);
}

export async function seedDefaultData(nameAr?: string, nameFr?: string): Promise<void> {
  await seedMyDefaultData(nameAr, nameFr);
}

export async function resetToDefault(): Promise<void> {
  await resetMyToDefault();
}

// ───────────────────────────────────────────
// أحداث التزامن
// ───────────────────────────────────────────

export const DATA_CHANGE_EVENT = "sofra_data_change";

function dispatchDataChange() {
  window.dispatchEvent(new CustomEvent(DATA_CHANGE_EVENT));
}

export function subscribeToDataChanges(callback: () => void): () => void {
  const handler = () => callback();
  window.addEventListener(DATA_CHANGE_EVENT, handler);
  return () => {
    window.removeEventListener(DATA_CHANGE_EVENT, handler);
  };
}

// ───────────────────────────────────────────
// التقييمات والشكاوى (Reviews)
// ───────────────────────────────────────────

export async function getMyReviews(): Promise<Review[]> {
  const myRestaurant = await getMyRestaurant();
  if (!myRestaurant) return [];
  
  const { data, error } = await supabase
    .from("reviews")
    .select("*")
    .eq("restaurant_id", myRestaurant.id)
    .order("created_at", { ascending: false });
    
  if (error) {
    console.error("[storage] getMyReviews error:", error);
    return [];
  }
  
  return (data || []).map((r: any) => ({
    id: r.id,
    restaurant_id: r.restaurant_id,
    rating: r.rating,
    feedback: r.feedback,
    created_at: r.created_at,
  }));
}

export async function submitReview(review: {
  restaurant_id: string;
  rating: number;
  feedback?: string;
}): Promise<boolean> {
  console.log("[storage] submitReview called with:", { 
    restaurant_id: review.restaurant_id, 
    rating: review.rating, 
    feedback: review.feedback?.substring(0, 50) 
  });

  const { data, error } = await supabase
    .from("reviews")
    .insert({
      restaurant_id: review.restaurant_id,
      rating: review.rating,
      feedback: review.feedback || "",
    })
    .select()
    .single();

  if (error) {
    console.error("[storage] submitReview error:", {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
    throw new Error(error.message || "فشل في حفظ التقييم");
  }

  console.log("[storage] submitReview success:", data?.id);
  dispatchDataChange();
  return true;
}