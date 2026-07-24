import { Category, Dish, RestaurantConfig, Restaurant, AuthUser } from "../types";
import { defaultCategories, defaultDishes, defaultRestaurantConfig } from "../data/defaultData";

export const RESTAURANT_ID = "rest_001";

const CATS_KEY = "sofra_cats";
const DISHES_KEY = "sofra_dishes";
const CONFIG_KEY = "sofra_config";

// ───────────────────────────────────────────
// دوال المستخدم (نسخة 60: مستخدم واحد)
// ───────────────────────────────────────────

const USERS_KEY = "sofra_user";
const AUTH_USER_KEY = "sofra_auth_user";

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

// التحقق: هل يوجد مطعم مسجل (مستخدم + بيانات)؟
export function hasRegisteredUser(): boolean {
  const user = getStoredUser();
  const cfg = localStorage.getItem(CONFIG_KEY);
  return !!user && !!cfg;
}

// تسجيل مستخدم جديد (مطعم جديد) - مستخدم واحد فقط لكل نسخة
export function registerUser(
  email: string,
  password: string,
): AuthUser {
  const existingUser = getStoredUser();
  if (existingUser) {
    throw new Error("هذه النسخة مسجلة مسبقاً. لا يمكن تسجيل أكثر من مطعم واحد لكل نسخة.");
  }

  const emailKey = email.toLowerCase().trim();
  const userId = `user_${Date.now()}`;

  const storedUser: StoredUser = {
    id: userId,
    email: emailKey,
    passwordHash: hashPassword(password),
  };

  saveStoredUser(storedUser);

  return { id: userId, email: emailKey, restaurantId: RESTAURANT_ID };
}

// تسجيل الدخول
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

// ───────────────────────────────────────────
// دوال البيانات (فئات، أطباق، إعدادات)
// ───────────────────────────────────────────

export function seedDefaultData(nameAr?: string, nameFr?: string) {
  const email = getStoredUser()?.email || "";
  const restaurantNameFromEmail = email.includes("@")
    ? email.split("@")[0].replace(/[._-]/g, " ")
    : "";

  const finalNameAr = nameAr || `مطعم ${restaurantNameFromEmail}` || defaultRestaurantConfig.nameAr;
  const finalNameFr = nameFr || `Restaurant ${restaurantNameFromEmail}` || defaultRestaurantConfig.nameFr;

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
// أحداث التزامن
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