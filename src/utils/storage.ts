import { Category, Dish, RestaurantConfig, Restaurant, AuthUser } from "../types";
import { defaultCategories, defaultDishes, defaultRestaurantConfig } from "../data/defaultData";

// ═══════════════════════════════════════════
// محاكاة Supabase متعددة المستأجرين
// هيكلية التخزين:
//   sofra_users          → { [email]: AuthUser & { passwordHash: string } }
//   sofra_restaurants    → { [id]: Restaurant }
//   sofra__<id>__cats    → Category[]
//   sofra__<id>__dishes  → Dish[]
//   sofra__<id>__config  → RestaurantConfig
// ═══════════════════════════════════════════

const USERS_KEY = "sofra_users";
const RESTAURANTS_KEY = "sofra_restaurants";

function catsKey(restaurantId: string) { return `sofra__${restaurantId}__cats`; }
function dishesKey(restaurantId: string) { return `sofra__${restaurantId}__dishes`; }
function configKey(restaurantId: string) { return `sofra__${restaurantId}__config`; }

// ───────────────────────────────────────────
// دوال المستخدمين
// ───────────────────────────────────────────

interface StoredUser {
  id: string;
  email: string;
  restaurantId: string;
  passwordHash: string;
}

function hashPassword(password: string): string {
  // محاكاة بسيطة للتشفير (تُستبدل بـ bcrypt عند تفعيل Supabase)
  let hash = 0;
  const str = `sofra_salt_${password}`;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return `hash_${Math.abs(hash).toString(36)}`;
}

function getUsers(): Record<string, StoredUser> {
  const raw = localStorage.getItem(USERS_KEY);
  return raw ? JSON.parse(raw) : {};
}

function saveUsers(users: Record<string, StoredUser>) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function registerUser(
  email: string,
  password: string,
  restaurantNameAr: string,
  restaurantNameFr: string,
): AuthUser {
  const users = getUsers();
  const emailKey = email.toLowerCase().trim();

  if (users[emailKey]) {
    throw new Error("هذا البريد الإلكتروني مسجل مسبقاً");
  }

  // إنشاء restaurantId تلقائي
  const allRestaurants = getRestaurantsMap();
  const existingIds = Object.keys(allRestaurants);
  let nextNum = 1;
  let newId = "rest_001";
  while (existingIds.includes(newId)) {
    nextNum++;
    newId = `rest_${String(nextNum).padStart(3, "0")}`;
  }

  const slug = restaurantNameAr
    .replace(/\s+/g, "-")
    .replace(/[^\u0600-\u06FFA-Za-z0-9-]/g, "")
    .toLowerCase();

  const userId = `user_${Date.now()}`;

  const storeUser: StoredUser = {
    id: userId,
    email: emailKey,
    restaurantId: newId,
    passwordHash: hashPassword(password),
  };

  users[emailKey] = storeUser;
  saveUsers(users);

  // إنشاء المطعم
  const newRestaurant: Restaurant = {
    id: newId,
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

  saveRestaurant(newId, newRestaurant);

  seedDefaultData(newId, restaurantNameAr, restaurantNameFr);

  return { id: userId, email: emailKey, restaurantId: newId };
}

export function seedDefaultData(
  restaurantId: string,
  nameAr?: string,
  nameFr?: string,
) {
  const r = getRestaurantById(restaurantId);
  const finalNameAr = nameAr || r?.nameAr || defaultRestaurantConfig.nameAr;
  const finalNameFr = nameFr || r?.nameFr || defaultRestaurantConfig.nameFr;

  localStorage.setItem(catsKey(restaurantId), JSON.stringify(
    defaultCategories,
  ));
  localStorage.setItem(dishesKey(restaurantId), JSON.stringify(
    defaultDishes,
  ));
  localStorage.setItem(configKey(restaurantId), JSON.stringify({
    ...defaultRestaurantConfig,
    nameAr: finalNameAr,
    nameFr: finalNameFr,
  }));
  dispatchDataChange(restaurantId);
}

export function loginUser(email: string, password: string): AuthUser {
  const users = getUsers();
  const emailKey = email.toLowerCase().trim();
  const user = users[emailKey];

  if (!user) {
    throw new Error("البريد الإلكتروني أو كلمة المرور غير صحيحة");
  }

  if (user.passwordHash !== hashPassword(password)) {
    throw new Error("البريد الإلكتروني أو كلمة المرور غير صحيحة");
  }

  return { id: user.id, email: user.email, restaurantId: user.restaurantId };
}

// المدير العام هو مالك أول مطعم مسجل (rest_001)
export function isSuperAdmin(restaurantId: string): boolean {
  return restaurantId === "rest_001";
}

// ───────────────────────────────────────────
// دوال المطاعم (للإدارة العامة)
// ───────────────────────────────────────────

function getRestaurantsMap(): Record<string, Restaurant> {
  const raw = localStorage.getItem(RESTAURANTS_KEY);
  return raw ? JSON.parse(raw) : {};
}

function saveRestaurant(id: string, restaurant: Restaurant) {
  const map = getRestaurantsMap();
  map[id] = restaurant;
  localStorage.setItem(RESTAURANTS_KEY, JSON.stringify(map));
}

export function getRestaurants(): Restaurant[] {
  return Object.values(getRestaurantsMap());
}

export function getRestaurantById(id: string): Restaurant | undefined {
  return getRestaurantsMap()[id];
}

export function deleteRestaurant(id: string) {
  const map = getRestaurantsMap();
  delete map[id];
  localStorage.setItem(RESTAURANTS_KEY, JSON.stringify(map));

  // حذف بيانات المطعم
  localStorage.removeItem(catsKey(id));
  localStorage.removeItem(dishesKey(id));
  localStorage.removeItem(configKey(id));

  // حذف المستخدم المرتبط
  const users = getUsers();
  for (const [email, u] of Object.entries(users)) {
    if (u.restaurantId === id) {
      delete users[email];
      break;
    }
  }
  saveUsers(users);
}

export function restaurantExists(id: string): boolean {
  return !!getRestaurantsMap()[id];
}

export function updateRestaurant(id: string, updates: Partial<Restaurant>) {
  const map = getRestaurantsMap();
  if (map[id]) {
    map[id] = { ...map[id], ...updates };
    localStorage.setItem(RESTAURANTS_KEY, JSON.stringify(map));
  }
}

// ───────────────────────────────────────────
// دوال البيانات الخاصة بكل مطعم
// ───────────────────────────────────────────

export function getCategories(restaurantId: string): Category[] {
  const raw = localStorage.getItem(catsKey(restaurantId));
  if (!raw) return [];
  return JSON.parse(raw);
}

export function saveCategories(restaurantId: string, categories: Category[]) {
  localStorage.setItem(catsKey(restaurantId), JSON.stringify(categories));
  dispatchDataChange(restaurantId);
}

export function getDishes(restaurantId: string): Dish[] {
  const raw = localStorage.getItem(dishesKey(restaurantId));
  if (!raw) return [];
  return JSON.parse(raw);
}

export function saveDishes(restaurantId: string, dishes: Dish[]) {
  localStorage.setItem(dishesKey(restaurantId), JSON.stringify(dishes));
  dispatchDataChange(restaurantId);
}

export function getRestaurantConfig(restaurantId: string): RestaurantConfig | null {
  const raw = localStorage.getItem(configKey(restaurantId));
  if (!raw) return null;
  return JSON.parse(raw);
}

export function saveRestaurantConfig(restaurantId: string, config: RestaurantConfig) {
  localStorage.setItem(configKey(restaurantId), JSON.stringify(config));
  dispatchDataChange(restaurantId);
}

export function seedDefaultData(
  restaurantId: string,
  nameAr?: string,
  nameFr?: string,
) {
  const r = getRestaurantById(restaurantId);
  const finalNameAr = nameAr || r?.nameAr || defaultRestaurantConfig.nameAr;
  const finalNameFr = nameFr || r?.nameFr || defaultRestaurantConfig.nameFr;

  localStorage.setItem(catsKey(restaurantId), JSON.stringify(
    defaultCategories.map((c) => ({ ...c, restaurantId })),
  ));
  localStorage.setItem(dishesKey(restaurantId), JSON.stringify(
    defaultDishes.map((d) => ({ ...d, restaurantId })),
  ));
  localStorage.setItem(configKey(restaurantId), JSON.stringify({
    ...defaultRestaurantConfig,
    nameAr: finalNameAr,
    nameFr: finalNameFr,
  }));
  dispatchDataChange(restaurantId);
}

export function resetToDefault(restaurantId: string) {
  seedDefaultData(restaurantId);
}

// ───────────────────────────────────────────
// حدث مخصص للتزامن الفوري (حتى داخل نفس التاب)
// ───────────────────────────────────────────

export const DATA_CHANGE_EVENT = "sofra_data_change";

function dispatchDataChange(restaurantId: string) {
  window.dispatchEvent(
    new CustomEvent(DATA_CHANGE_EVENT, { detail: { restaurantId } })
  );
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