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
} from "../utils/storage";
import { Category, Dish, RestaurantConfig } from "../types";
import AdminView from "../components/AdminView";
import { Eye, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "../contexts/AuthContext";

export default function Admin() {
  const { user, isLoading: authLoading, logout } = useAuth();
  const navigate = useNavigate();
  const autoInitDone = useRef(false);

  const [categories, setCategories] = useState<Category[]>([]);
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [config, setConfig] = useState<RestaurantConfig | null>(null);
  const [restaurantSlug, setRestaurantSlug] = useState<string>("");
  const [isInitializing, setIsInitializing] = useState(false);
  const [initError, setInitError] = useState(false);

  const loadData = async () => {
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
  };

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  // تهيئة تلقائية عند أول دخول (إذا لم يوجد مطعم)
  useEffect(() => {
    if (authLoading || !user || config || isInitializing || autoInitDone.current) return;
    autoInitDone.current = true;
    setIsInitializing(true);
    setInitError(false);

    seedMyDefaultData()
      .then((result) => {
        setRestaurantSlug(result.slug);
        return loadData();
      })
      .catch((err) => {
        console.error("[Admin] Init failed:", err);
        setInitError(true);
      })
      .finally(() => setIsInitializing(false));
  }, [authLoading, user, config]);

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

  if (!authLoading && !user) {
    return <Navigate to="/login" replace />;
  }

  if (authLoading || isInitializing) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0D0D0D] gap-3">
        <div className="w-8 h-8 border-2 border-[#C8A24D]/30 border-t-[#C8A24D] rounded-full animate-spin" />
        <p className="text-white/50 text-sm">
          {isInitializing ? "جاري تجهيز القائمة الافتراضية لمطعمك..." : "جاري التحميل..."}
        </p>
      </div>
    );
  }

  if (initError || !config) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0D0D0D] px-4">
        <div className="text-center space-y-6">
          <p className="text-4xl">⚠️</p>
          <h2 className="text-2xl font-bold text-white">تعذر تجهيز المطعم</h2>
          <p className="text-white/50">يرجى المحاولة مرة أخرى</p>
          <Button
            onClick={() => {
              autoInitDone.current = false;
              setConfig(null);
              setInitError(false);
            }}
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
      <div
        className="bg-white/[0.03] border-b border-white/[0.06] text-white/70 py-2 px-4 text-xs flex justify-between items-center flex-wrap gap-2"
        dir="rtl"
      >
        <div className="flex items-center gap-3">
          <span>
            {config.nameAr}{" "}
            <span className="text-white/30">• {user?.email}</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          {restaurantSlug && (
            <a href={`/${restaurantSlug}`} target="_blank" rel="noopener noreferrer">
              <Button size="sm" variant="ghost" className="text-[#C8A24D] hover:text-[#D4B35D] hover:bg-white/5 h-7 gap-1">
                <Eye className="h-3.5 w-3.5" />
                <span>عرض المنيو</span>
              </Button>
            </a>
          )}
          <Button
            size="sm"
            variant="ghost"
            className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-7 gap-1"
            onClick={async () => {
              await logout();
              navigate("/login", { replace: true });
            }}
          >
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