import { supabase } from "@/integrations/supabase/client";
import { Category, Dish, RestaurantConfig } from "../types";
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

function mapCategoryToDB(cat: Category): any {
  return {
    id: cat.id,
    name_ar: cat.nameAr,
    name_fr: cat.nameFr,
    icon: cat.icon,
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

function mapDishToDB(dish: Dish): any {
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
  };
}

function mapConfigFromDB(row: any): RestaurantConfig {
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
  };
}

// ───────────────────────────────────────────
// دوال البيانات (فئات، أطباق، إعدادات)
// ───────────────────────────────────────────

export async function hasRegisteredRestaurant(): Promise<boolean> {
  const { data, error } = await supabase
    .from("restaurants")
    .select("id")
    .limit(1);

  if (error) {
    console.error("[sofra] hasRegisteredRestaurant error:", error);
    return false;
  }

  return (data?.length ?? 0) > 0;
}

export async function getCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("[sofra] getCategories error:", error);
    return [];
  }

  return (data || []).map(mapCategoryFromDB);
}

export async function saveCategories(categories: Category[]): Promise<void> {
  const rows = categories.map(mapCategoryToDB);
  const { error } = await supabase.from("categories").upsert(rows);
  if (error) {
    console.error("[sofra] saveCategories error:", error);
    throw error;
  }
  dispatchDataChange();
}

export async function getDishes(): Promise<Dish[]> {
  const { data, error } = await supabase
    .from("dishes")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("[sofra] getDishes error:", error);
    return [];
  }

  return (data || []).map(mapDishFromDB);
}

export async function saveDishes(dishes: Dish[]): Promise<void> {
  const rows = dishes.map(mapDishToDB);
  const { error } = await supabase.from("dishes").upsert(rows);
  if (error) {
    console.error("[sofra] saveDishes error:", error);
    throw error;
  }
  dispatchDataChange();
}

export async function getRestaurantConfig(): Promise<RestaurantConfig | null> {
  const { data, error } = await supabase
    .from("restaurants")
    .select("*")
    .limit(1)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null; // no rows
    console.error("[sofra] getRestaurantConfig error:", error);
    return null;
  }

  return mapConfigFromDB(data);
}

export async function saveRestaurantConfig(config: RestaurantConfig): Promise<void> {
  const { data: existing } = await supabase
    .from("restaurants")
    .select("id, user_id")
    .limit(1)
    .maybeSingle();

  const row = mapConfigToDB(config);

  if (existing) {
    const { error } = await supabase
      .from("restaurants")
      .update({ ...row, updated_at: new Date().toISOString() })
      .eq("id", existing.id);

    if (error) {
      console.error("[sofra] saveRestaurantConfig update error:", error);
      throw error;
    }
  } else {
    // إذا كنت مسجلاً دخولك، اربط المطعم بالمستخدم
    const { data: authData } = await supabase.auth.getSession();
    const userId = authData.session?.user?.id;

    const { error } = await supabase
      .from("restaurants")
      .insert({ ...row, user_id: userId });

    if (error) {
      console.error("[sofra] saveRestaurantConfig insert error:", error);
      throw error;
    }
  }
  dispatchDataChange();
}

export async function seedDefaultData(nameAr?: string, nameFr?: string): Promise<void> {
  const { data: authData } = await supabase.auth.getSession();
  const userEmail = authData.session?.user?.email || "";
  const restaurantNameFromEmail = userEmail.includes("@")
    ? userEmail.split("@")[0].replace(/[._-]/g, " ")
    : "";

  const finalNameAr = nameAr || `مطعم ${restaurantNameFromEmail}` || defaultRestaurantConfig.nameAr;
  const finalNameFr = nameFr || `Restaurant ${restaurantNameFromEmail}` || defaultRestaurantConfig.nameFr;
  const userId = authData.session?.user?.id;

  // 1. إدراج بيانات المطعم
  const configRow = mapConfigToDB({
    ...defaultRestaurantConfig,
    nameAr: finalNameAr,
    nameFr: finalNameFr,
  });

  await supabase.from("restaurants").upsert({ ...configRow, user_id: userId });

  // 2. إدراج الفئات
  const catRows = defaultCategories.map(mapCategoryToDB);
  await supabase.from("categories").upsert(catRows);

  // 3. إدراج الأطباق
  const dishRows = defaultDishes.map(mapDishToDB);
  await supabase.from("dishes").upsert(dishRows);

  dispatchDataChange();
}

export async function resetToDefault(): Promise<void> {
  await supabase.from("dishes").delete().neq("id", "");
  await supabase.from("categories").delete().neq("id", "");
  await supabase.from("restaurants").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await seedDefaultData();
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