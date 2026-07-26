import { useState, useEffect } from "react";
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
import { Eye, LogOut, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "../contexts/AuthContext";

export default function Admin() {
  const { user, isLoading: authLoading, logout } = useAuth();
  const navigate = useNavigate();

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
      } else {
        setConfig(null);
      }

      setCategories(cats);
      setDishes(dsh);
    } catch (err) {
      console.error("[Admin] Error loading data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

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
    if (confirm("هل أنت متأكد من إعادة تعيين جميع البيانات إلى القيم الافتراضية؟ سيتم فقدان أي تغييرات قمت بها.")) {
      await resetMyToDefault();
      await loadData();
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  const handleInitDefault = async () => {
    if (!user) return;
    setIsInitializing(true);
    try {
      const result = await seedMyDefaultData();
      setRestaurantSlug(result.slug);
      await loadData();
    } catch (err) {
      console.error("[Admin] Init error:", err);
    }
    setIsInitializing(false);
  };

  // حماية: التوجيه لتسجيل الدخول
  if (!authLoading && !user) {
    return <Navigate to="/login" replace />;
  }

  // حالة التحميل
  if (authLoading || isInitializing || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0D0D0D]">
        <div className="animate-pulse text-[#C8A24D] font-bold text-lg">
          {isInitializing ? "جاري تهيئة بيانات المطعم..." : "جاري تحميل لوحة التحكم..."}
        </div>
      </div>
    );
  }

  // إذا لم توجد بيانات، اعرض زر التهيئة
  if (!config) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0D0D0D] px-4">
        <div className="text-center space-y-6">
          <Building2 className="h-16 w-16 text-[#C8A24D] mx-auto" />
          <h2 className="text-2xl font-bold text-white">لا توجد بيانات للمطعم</h2>
          <p className="text-white/50">يبدو أنك بحاجة لتهيئة بيانات المطعم الافتراضية</p>
          <Button
            onClick={handleInitDefault}
            className="bg-[#C8A24D] hover:bg-[#D4B35D] text-black font-bold"
          >
            تهيئة البيانات الافتراضية
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
              <Button
                size="sm"
                variant="ghost"
                className="text-[#C8A24D] hover:text-[#D4B35D] hover:bg-white/5 h-7 gap-1"
              >
                <Eye className="h-3.5 w-3.5" />
                <span>عرض المنيو</span>
              </Button>
            </a>
          )}
          <Button
            size="sm"
            variant="ghost"
            className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-7 gap-1"
            onClick={handleLogout}
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