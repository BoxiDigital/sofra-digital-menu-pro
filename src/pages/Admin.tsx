import { useState, useEffect, useRef } from "react";
import { useNavigate, Navigate, Link } from "react-router-dom";
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
  const [isLoading, setIsLoading] = useState(true);

  // Apply primaryColor as CSS variable for admin UI theming
  useEffect(() => {
    if (config?.primaryColor) {
      const root = document.documentElement;
      root.style.setProperty("--primary", config.primaryColor);
    }
  }, [config?.primaryColor]);

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
    if (user) {
      loadData();
    }
  }, [user]);

  // Auto-initialize when no restaurant exists
  useEffect(() => {
    if (!authLoading && user && !isLoading && !config && !isInitializing && !autoInitDone.current) {
      autoInitDone.current = true;
      setIsInitializing(true);
      seedMyDefaultData()
        .then((result) => {
          setRestaurantSlug(result.slug);
          return loadData();
        })
        .catch(async (err) => {
          console.error("[Admin] Auto-init error:", err);
          if (err?.code === "23503" || err?.message?.includes("users")) {
            await logout();
            navigate("/login", { replace: true });
          }
        })
        .finally(() => {
          setIsInitializing(false);
        });
    }
  }, [authLoading, user, isLoading, config, isInitializing]);

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

  // Auth guard
  if (!authLoading && !user) {
    return <Navigate to="/login" replace />;
  }

  // Loading / initializing state
  if (authLoading || isInitializing || isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#060606] gap-6 relative overflow-hidden">
        {/* Atmospheric glow */}
        <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full opacity-[0.04] pointer-events-none"
          style={{ background: "radial-gradient(circle, rgb(200,162,77) 0%, transparent 70%)" }} />
        <div className="absolute bottom-[-15%] left-[-10%] w-[40%] h-[40%] rounded-full opacity-[0.03] pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(100,140,255,0.4) 0%, transparent 70%)" }} />

        <div className="relative z-10 flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-2xl border border-[var(--primary)]/20 bg-[var(--primary)]/5 flex items-center justify-center shadow-[0_0_30px_rgba(200,162,77,0.15)]">
            <div className="w-5 h-5 border-2 border-[var(--primary)]/30 border-t-[var(--primary)] rounded-full animate-spin" />
          </div>
          <p className="text-white/40 text-sm tracking-wide">
            {isInitializing ? "جاري تجهيز القائمة الافتراضية لمطعمك..." : "جاري تحميل لوحة التحكم..."}
          </p>
        </div>
      </div>
    );
  }

  // Fallback: if initialization failed
  if (!config) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#060606] px-4 relative overflow-hidden">
        <div className="absolute top-[-15%] right-[-10%] w-[50%] h-[50%] rounded-full opacity-[0.04] pointer-events-none"
          style={{ background: "radial-gradient(circle, rgb(200,162,77) 0%, transparent 70%)" }} />
        <div className="text-center space-y-6 relative z-10">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-white/[0.02] border border-white/[0.04] backdrop-blur-xl flex items-center justify-center shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
            <span className="text-2xl">⚠️</span>
          </div>
          <h2 className="text-2xl font-bold text-white">تعذر تحميل البيانات</h2>
          <p className="text-white/40 max-w-sm">حدث خطأ أثناء تجهيز بيانات المطعم. يرجى تسجيل الخروج ثم تسجيل الدخول مجدداً.</p>
          <div className="flex flex-col gap-3">
            <Button
              onClick={() => {
                autoInitDone.current = false;
                setConfig(null);
                setIsLoading(true);
                loadData();
              }}
              className="bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-black font-bold rounded-xl h-11 shadow-[0_4px_20px_rgba(200,162,77,0.2)]"
            >
              إعادة المحاولة
            </Button>
            <Button
              variant="outline"
              onClick={async () => {
                await logout();
                navigate("/login", { replace: true });
              }}
              className="border-red-500/20 text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-xl"
            >
              <LogOut className="h-4 w-4 ml-1.5" />
              تسجيل الخروج
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#060606] relative">
      {/* Atmospheric Lighting */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-25%] right-[-15%] w-[70%] h-[70%] rounded-full opacity-[0.025]"
          style={{ background: `radial-gradient(circle, ${config.primaryColor} 0%, transparent 70%)` }} />
        <div className="absolute bottom-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full opacity-[0.015]"
          style={{ background: 'radial-gradient(circle, rgba(100,140,255,0.5) 0%, transparent 70%)' }} />
      </div>

      {/* Top bar */}
      <div
        className="relative z-10 bg-[#060606]/80 backdrop-blur-xl border-b border-white/[0.04] text-white/60 py-2.5 px-4 text-xs flex justify-between items-center flex-wrap gap-2 shadow-[0_1px_0_rgba(255,255,255,0.02)]"
        dir="rtl"
      >
        <div className="flex items-center gap-3">
          <span className="text-white/80 font-medium">{config.nameAr}</span>
          <span className="text-white/20">•</span>
          <span className="text-white/30 text-[11px]">{user?.email}</span>
        </div>
        <div className="flex items-center gap-1">
          {restaurantSlug && (
            <Link to={`/${restaurantSlug}`}>
              <Button
                size="sm"
                variant="ghost"
                className="text-[var(--primary)]/80 hover:text-[var(--primary)] hover:bg-[var(--primary)]/5 h-7 gap-1 rounded-lg text-xs transition-all duration-300"
              >
                <Eye className="h-3.5 w-3.5" />
                <span>عرض المنيو</span>
              </Button>
            </Link>
          )}
          <Button
            size="sm"
            variant="ghost"
            className="text-red-400/70 hover:text-red-300 hover:bg-red-500/8 h-7 gap-1 rounded-lg text-xs transition-all duration-300"
            onClick={handleLogout}
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>خروج</span>
          </Button>
        </div>
      </div>

      <div className="relative z-10">
        <AdminView
          categories={categories}
          dishes={dishes}
          config={config}
          restaurantSlug={restaurantSlug}
          onUpdateCategories={handleUpdateCategories}
          onUpdateDishes={handleUpdateDishes}
          onUpdateConfig={handleUpdateConfig}
          onReset={handleReset}
        />
      </div>
    </div>
  );
}
