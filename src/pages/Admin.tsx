import { useState, useEffect, useRef } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import {
  getMyCategories,
  getMyDishes,
  getMyRestaurant,
  saveMyCategories,
  saveMyDishes,
  saveMyConfig,
  seedMyDefaultData,
  resetMyToDefault,
  getMyRestaurantId,
} from "../utils/storage";
import { defaultCategories, defaultDishes } from "../data/defaultData";
import { Category, Dish, RestaurantConfig } from "../types";
import AdminView from "../components/AdminView";
import { Eye, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export default function Admin() {
  const { user, isLoading: authLoading, logout } = useAuth();
  const navigate = useNavigate();
  const autoInitDone = useRef(false);

  const [categories, setCategories] = useState<Category[]>([]);
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [config, setConfig] = useState<RestaurantConfig | null>(null);
  const [restaurantSlug, setRestaurantSlug] = useState<string>("");
  const [isInitializing, setIsInitializing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    try {
      const [restaurant, cats, dsh] = await Promise.all([
        getMyRestaurant(),
        getMyCategories(),
        getMyDishes(),
      ]);

      if (restaurant) {
        const { id, slug, ...cfg } = restaurant as any;
        setConfig(cfg);
        setRestaurantSlug(slug || "");
        setCategories(cats);
        setDishes(dsh);
      } else {
        setConfig(null);
        setCategories([]);
        setDishes([]);
      }
    } catch (err) {
      console.error("[Admin] Error loading data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  // تهيئة تلقائية:
  // إذا لا يوجد مطعم ← أنشئه مع كل البيانات الافتراضية
  // إذا وجد المطعم لكن الأطباق فارغة ← املأها من القالب
  useEffect(() => {
    if (authLoading || !user || isLoading || isInitializing || autoInitDone.current) return;

    const needsRestaurant = !config;
    const needsData = config && categories.length === 0 && dishes.length === 0;

    if (!needsRestaurant && !needsData) return;

    autoInitDone.current = true;
    setIsInitializing(true);

    (async () => {
      try {
        if (needsRestaurant) {
          // لا يوجد مطعم: أنشئه + املأ البيانات الافتراضية
          const result = await seedMyDefaultData();
          setRestaurantSlug(result.slug);
        } else if (needsData) {
          // المطعم موجود لكن الأطباق فارغة: املأها من القالب
          const restaurantId = await getMyRestaurantId();
          if (restaurantId) {
            const catRows = defaultCategories.map((cat) => ({
              id: cat.id,
              name_ar: cat.nameAr,
              name_fr: cat.nameFr,
              icon: cat.icon,
              restaurant_id: restaurantId,
            }));
            const dishRows = defaultDishes.map((dish) => ({
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
            }));
            await Promise.all([
              supabase.from("categories").insert(catRows),
              supabase.from("dishes").insert(dishRows),
            ]);
          }
        }
        await loadData();
      } catch (err) {
        console.error("[Admin] Auto-init error:", err);
      } finally {
        setIsInitializing(false);
      }
    })();
  }, [authLoading, user, isLoading, config, categories, dishes, isInitializing]);

  const handleUpdateCategories = async (newCategories: Category[]) => {
    setCategories(newCategories);
    await saveMyCategories(newCategories);
  };

  const handleUpdateDishes = async (newDishes: Dish[]) => {
    setDishes(newDishes);
    await saveMyDishes(newDishes);
  };

  const handleUpdateConfig = async (newConfig: RestaurantConfig) => {
    setConfig(newConfig);
    await saveMyConfig(newConfig);
  };

  const handleReset = async () => {
    if (confirm("هل أنت متأكد من إعادة تعيين جميع البيانات إلى القيم الافتراضية؟")) {
      await resetMyToDefault();
      await loadData();
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  if (!authLoading && !user) return <Navigate to="/login" replace />;

  if (authLoading || isInitializing || isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0D0D0D] gap-3">
        <div className="w-8 h-8 border-2 border-[#C8A24D]/30 border-t-[#C8A24D] rounded-full animate-spin" />
        <p className="text-white/50 text-sm">
          {isInitializing ? "جاري تجهيز القائمة الافتراضية..." : "جاري التحميل..."}
        </p>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0D0D0D] px-4">
        <div className="text-center space-y-6">
          <p className="text-4xl">⚠️</p>
          <h2 className="text-2xl font-bold text-white">تعذر تحميل البيانات</h2>
          <Button
            onClick={() => { autoInitDone.current = false; setIsLoading(true); loadData(); }}
            className="bg-[#C8A24D] hover:bg-[#D4B35D] text-black font-bold"
          >
            إعادة المحاولة
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0D0D0D]">
      <div className="bg-white/[0.03] border-b border-white/[0.06] text-white/70 py-2 px-4 text-xs flex justify-between items-center flex-wrap gap-2" dir="rtl">
        <span>{config.nameAr} <span className="text-white/30">• {user?.email}</span></span>
        <div className="flex items-center gap-2">
          {restaurantSlug && (
            <a href={`/${restaurantSlug}`} target="_blank" rel="noopener noreferrer">
              <Button size="sm" variant="ghost" className="text-[#C8A24D] hover:text-[#D4B35D] hover:bg-white/5 h-7 gap-1">
                <Eye className="h-3.5 w-3.5" />
                <span>عرض المنيو</span>
              </Button>
            </a>
          )}
          <Button size="sm" variant="ghost" className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-7 gap-1" onClick={handleLogout}>
            <LogOut className="h-3.5 w-3.5" />
            <span>خروج</span>
          </Button>
        </div>
      </div>

      <AdminView
        categories={categories}
        dishes={dishes}
        config={config}
        onUpdateCategories={handleUpdateCategories}
        onUpdateDishes={handleUpdateDishes}
        onUpdateConfig={handleUpdateConfig}
        onReset={handleReset}
      />
    </div>
  );
}