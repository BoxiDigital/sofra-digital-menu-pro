import { Category, Dish, RestaurantConfig } from "../types";
import { defaultCategories, defaultDishes, defaultRestaurantConfig } from "../data/defaultData";

const CATEGORIES_KEY = "sofra_categories";
const DISHES_KEY = "sofra_dishes";
const CONFIG_KEY = "sofra_config";

// ═══════════════════════════════════════════
// دوال عامة (تستخدم حالياً مع localStorage)
// سيتم استبدالها بدوال Supabase عند تفعيل Agent Mode
// ═══════════════════════════════════════════

export const getCategories = (): Category[] => {
  const data = localStorage.getItem(CATEGORIES_KEY);
  if (!data) {
    localStorage.setItem(CATEGORIES_KEY, JSON.stringify(defaultCategories));
    return defaultCategories;
  }
  return JSON.parse(data);
};

export const saveCategories = (categories: Category[]) => {
  localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories));
};

export const getDishes = (): Dish[] => {
  const data = localStorage.getItem(DISHES_KEY);
  if (!data) {
    localStorage.setItem(DISHES_KEY, JSON.stringify(defaultDishes));
    return defaultDishes;
  }
  return JSON.parse(data);
};

export const saveDishes = (dishes: Dish[]) => {
  localStorage.setItem(DISHES_KEY, JSON.stringify(dishes));
};

export const getRestaurantConfig = (): RestaurantConfig => {
  const data = localStorage.getItem(CONFIG_KEY);
  if (!data) {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(defaultRestaurantConfig));
    return defaultRestaurantConfig;
  }
  return JSON.parse(data);
};

export const saveRestaurantConfig = (config: RestaurantConfig) => {
  localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
};

export const resetToDefault = () => {
  localStorage.setItem(CATEGORIES_KEY, JSON.stringify(defaultCategories));
  localStorage.setItem(DISHES_KEY, JSON.stringify(defaultDishes));
  localStorage.setItem(CONFIG_KEY, JSON.stringify(defaultRestaurantConfig));
};

// ═══════════════════════════════════════════
// دوال مهيأة لتعدد المطاعم (للربط مع Supabase مستقبلاً)
// تقبل restaurantId كمعامل - حالياً تتجاهله مؤقتاً
// ═══════════════════════════════════════════

export const getCategoriesByRestaurant = (restaurantId: string): Category[] => {
  // TODO: عند تفعيل Agent Mode → استبدل بـ supabase.from('categories').select('*').eq('restaurant_id', restaurantId)
  return getCategories();
};

export const saveCategoriesForRestaurant = (restaurantId: string, categories: Category[]) => {
  // TODO: عند تفعيل Agent Mode → حفظ مع restaurant_id
  const enriched = categories.map((c) => ({ ...c, restaurantId }));
  saveCategories(enriched);
};

export const getDishesByRestaurant = (restaurantId: string): Dish[] => {
  // TODO: عند تفعيل Agent Mode → استبدل بـ supabase.from('dishes').select('*').eq('restaurant_id', restaurantId)
  return getDishes();
};

export const saveDishesForRestaurant = (restaurantId: string, dishes: Dish[]) => {
  // TODO: عند تفعيل Agent Mode → حفظ مع restaurant_id
  const enriched = dishes.map((d) => ({ ...d, restaurantId }));
  saveDishes(enriched);
};

export const getConfigByRestaurant = (restaurantId: string): RestaurantConfig => {
  // TODO: عند تفعيل Agent Mode → استبدل بـ supabase.from('restaurants').select('config').eq('id', restaurantId).single()
  return getRestaurantConfig();
};

export const saveConfigForRestaurant = (restaurantId: string, config: RestaurantConfig) => {
  // TODO: عند تفعيل Agent Mode → حفظ مع restaurant_id
  saveRestaurantConfig(config);
};