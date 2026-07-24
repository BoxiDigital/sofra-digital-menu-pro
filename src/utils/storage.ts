import { Category, Dish, RestaurantConfig, Restaurant, AuthUser } from "../types";
import { defaultCategories, defaultDishes, defaultRestaurantConfig } from "../data/defaultData";

// ═══════════════════════════════════════════
// نموذج النسخة المستقلة (Stand-alone)
// كل نسخة من المشروع = مطعم واحد فقط
// المطعم الوحيد: rest_001
// مستخدم واحد فقط لكل نسخة
// ═══════════════════════════════════════════

export const RESTAURANT_ID = "rest_001";

const USERS_KEY = "sofra_user";
const RESTAURANT_KEY = "sofra_restaurant";
const CATS_KEY = "sofra_cats";
const DISHES_KEY = "sofra_dishes";
const CONFIG_KEY = "sofra_config";

// ───────────────────────────────────────────
// دوال المستخدم (مستخدم واحد فقط)
// ───────────────────────────────────────────

interface StoredUser {
  id: string;
  email: string;
  passwordHash: string;
}

function hashPassword(password: string): string {
  let hash = 0;
  const str = `sofra_salt_${password}`;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return `hash_${Math.abs(hash).toString(36)}`;
}

function getStoredUser(): StoredUser | null {
  const raw = localStorage.getItem(USERS_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function saveStoredUser(user: StoredUser) {
  localStorage.setItem(USERS_KEY, JSON.stringify(user));
}

export function hasRegisteredUser(): boolean {
  return getStoredUser() !== null;
}

export function registerUser(
  email: string,
  password: string,
  restaurantNameAr: string,
  restaurantNameFr: string,
): AuthUser {
  // في نموذج النسخة المستقلة: مستخدم واحد فقط
  if (getStoredUser()) {
    throw new Error("هذه النسخة مسجلة مسبقاً. لا يمكن تسجيل أكثر من مطعم واحد لكل نسخة.");
  }

  const emailKey = email.toLowerCase().trim();
  const userId = `user_${Date.now()}`;

  const storeUser: StoredUser = {
    id: userId,
    email: emailKey,
    passwordHash: hashPassword(password),
  };

  saveStoredUser(storeUser);

  // إنشاء المطعم الوحيد
  const slug = restaurantNameAr
    .replace(/\s+/g, "-")
    .replace(/[^\u0600-\u06FFA-Za-z0-9-]/g, "")
    .toLowerCase();

  const restaurant: Restaurant = {
    id: RESTAURANT_ID,
    nameAr: restaurantNameAr,
    nameFr: restaurantNameFr,
    slug,
    sloganAr: "أجود الأطباق",
    sloganFr: "Le meilleur de la cuisine",
    logoUrl: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=150&h=150&q=80",
    workingHoursAr: "يومياً من 12:00 ظهراً حتى 11:00 مساءً",
    workingHoursFr: "Tous les jours de 12h00 à 23h00",
    whatsappNumber: "",
    whatsappMessageAr: "مرحباً، أود طلب:\n\n{items}\n\nالمجموع: {total}",
    whatsappMessageFr: "Bonjour, je souhaite commander:\n\n{items}\n\nTotal: {total}",
    primaryColor: "#C8A24D",
    backgroundColor: "dark",
    currencyAr: "درهم",
    currencyFr: "MAD",
  };

  localStorage.setItem(RESTAURANT_KEY, JSON.stringify(restaurant));

  // تهيئة البيانات الافتراضية فوراً
  seedDefaultData(restaurantNameAr, restaurantNameFr);

  // إشعار بوجود مطعم الآن
  dispatchDataChange();

  return { id: userId, email: emailKey, restaurantId: RESTAURANT_ID };
}

export function loginUser(email: string, password: string): AuthUser {
  const user = getStoredUser();
  const emailKey = email.toLowerCase().trim();

  if (!user || user.email !== emailKey) {
    throw new Error("البريد الإلكتروني أو كلمة المرور غير صحيحة");
  }

  if (user.passwordHash !== hashPassword(password)) {
    throw new Error("البريد الإلكتروني أو كلمة المرور غير صحيحة");
  }

  return { id: user.id, email: user.email, restaurantId: RESTAURANT_ID };
}

export function isSuperAdmin(_restaurantId?: string): boolean {
  // في النسخة المستقلة: أي مستخدم مسجل هو المدير الوحيد
  return hasRegisteredUser();
}

// ───────────────────────────────────────────
// المطعم (واحد فقط)
// ───────────────────────────────────────────

export function getRestaurant(): Restaurant | null {
  const raw = localStorage.getItem(RESTAURANT_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function updateRestaurant(updates: Partial<Restaurant>) {
  const existing = getRestaurant();
  if (existing) {
    const updated = { ...existing, ...updates };
    localStorage.setItem(RESTAURANT_KEY, JSON.stringify(updated));
    dispatchDataChange();
  }
}

// ───────────────────────────────────────────
// دوال البيانات (فئات، أطباق، إعدادات)
// ───────────────────────────────────────────

export function seedDefaultData(nameAr?: string, nameFr?: string) {
  const restaurant = getRestaurant();
  const finalNameAr = nameAr || restaurant?.nameAr || defaultRestaurantConfig.nameAr;
  const finalNameFr = nameFr || restaurant?.nameFr || defaultRestaurantConfig.nameFr;

  localStorage.setItem(CATS_KEY, JSON.stringify(defaultCategories));
  localStorage.setItem(DISHES_KEY, JSON.stringify(defaultDishes));
  localStorage.setItem(CONFIG_KEY, JSON.stringify({
    ...defaultRestaurantConfig,
    nameAr: finalNameAr,
    nameFr: finalNameFr,
  }));
  dispatchDataChange();
}

export function getCategories(): Category[] {
  const raw = localStorage.getItem(CATS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveCategories(categories: Category[]) {
  localStorage.setItem(CATS_KEY, JSON.stringify(categories));
  dispatchDataChange();
}

export function getDishes(): Dish[] {
  const raw = localStorage.getItem(DISHES_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveDishes(dishes: Dish[]) {
  localStorage.setItem(DISHES_KEY, JSON.stringify(dishes));
  dispatchDataChange();
}

export function getRestaurantConfig(): RestaurantConfig | null {
  const raw = localStorage.getItem(CONFIG_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveRestaurantConfig(config: RestaurantConfig) {
  localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
  dispatchDataChange();
}

export function resetToDefault() {
  seedDefaultData();
}

// ───────────────────────────────────────────
// حدث مخصص للتزامن الفوري
// ───────────────────────────────────────────

export const DATA_CHANGE_EVENT = "sofra_data_change";

function dispatchDataChange() {
  window.dispatchEvent(new CustomEvent(DATA_CHANGE_EVENT));
}

export function subscribeToDataChanges(callback: () => void): () => void {
  const handler = () => callback();
  window.addEventListener(DATA_CHANGE_EVENT, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(DATA_CHANGE_EVENT, handler);
    window.removeEventListener("storage", handler);
  };
}