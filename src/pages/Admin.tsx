import { useState, useEffect } from "react";
import { Link, useNavigate, Navigate } from "react-router-dom";
import {
  getCategories,
  getDishes,
  getRestaurantConfig,
  getRestaurant,
  saveCategories,
  saveDishes,
  saveRestaurantConfig,
  resetToDefault,
  RESTAURANT_ID,
} from "../utils/storage";
import { Category, Dish, RestaurantConfig } from "../types";
import AdminView from "../components/AdminView";
import { Eye, LogOut, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "../contexts/AuthContext";

export default function Admin() {
  const { user, isLoading: authLoading, logout } = useAuth();
  const navigate = useNavigate();

  const [categories, setCategories] = useState<Category[]>([]);
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [config, setConfig] = useState<RestaurantConfig | null>(null);
  const [isEmpty, setIsEmpty] = useState(false);

  const restaurant = getRestaurant();

  const loadData = () => {
    const cats = getCategories();
    const dsh = getDishes();
    const cfg = getRestaurantConfig();

    setCategories(cats);
    setDishes(dsh);
    setConfig(cfg);
    setIsEmpty(!cfg && cats.length === 0 && dsh.length === 0);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUpdateCategories = (newCategories: Category[]) => {
    setCategories(newCategories);
    saveCategories(newCategories);
    setIsEmpty(false);
  };

  const handleUpdateDishes = (newDishes: Dish[]) => {
    setDishes(newDishes);
    saveDishes(newDishes);
    setIsEmpty(false);
  };

  const handleUpdateConfig = (newConfig: RestaurantConfig) => {
    setConfig(newConfig);
    saveRestaurantConfig(newConfig);
    setIsEmpty(false);
  };

  const handleReset = () => {
    if (confirm("هل أنت متأكد من إعادة تعيين جميع البيانات إلى القيم الافتراضية؟ سيتم فقدان أي تغييرات قمت بها.")) {
      resetToDefault();
      loadData();
    }
  };

  const handleInitRestaurant = () => {
    resetToDefault();
    loadData();
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  // حماية: التوجيه لتسجيل الدخول إذا لم يكن هناك مستخدم
  if (!authLoading && !user) {
    return <Navigate to="/login" replace />;
  }

  // حالة: تحميل
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0D0D0D]">
        <div className="animate-pulse text-[#C8A24D] font-bold text-lg">جاري تحميل لوحة التحكم...</div>
      </div>
    );
  }

  // حالة: المطعم غير مهيأ بعد
  if (isEmpty && !config) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0D0D0D] px-4" dir="rtl">
        <div className="max-w-md text-center space-y-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#C8A24D]/10 border border-[#C8A24D]/20">
            <Store className="h-8 w-8 text-[#C8A24D]" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-white mb-2">مطعم غير مهيأ</h2>
            <p className="text-white/35 text-sm leading-relaxed">
              بيانات مطعمك فارغة. اضغط الزر أدناه لتهيئتها ببيانات افتراضية.
            </p>
          </div>
          <Button
            onClick={handleInitRestaurant}
            className="bg-[#C8A24D] hover:bg-[#D4B35D] text-black font-bold rounded-xl px-8 py-5"
          >
            تهيئة المطعم ببيانات افتراضية
          </Button>
        </div>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0D0D0D]">
        <div className="animate-pulse text-[#C8A24D] font-bold text-lg">جاري تحميل لوحة التحكم...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0D0D0D]">
      {/* شريط علوي */}
      <div
        className="bg-white/[0.03] border-b border-white/[0.06] text-white/70 py-2 px-4 text-xs flex justify-between items-center flex-wrap gap-2"
        dir="rtl"
      >
        <div className="flex items-center gap-3">
          <span>
            {restaurant?.nameAr || config.nameAr}{" "}
            <span className="text-white/30">• {user?.email}</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          {/* رابط عرض المنيو: يفتح نفس الرابط الرئيسي مباشرة */}
          <a href="/" target="_blank" rel="noopener noreferrer">
            <Button
              size="sm"
              variant="ghost"
              className="text-[#C8A24D] hover:text-[#D4B35D] hover:bg-white/5 h-7 gap-1"
            >
              <Eye className="h-3.5 w-3.5" />
              <span>عرض المنيو</span>
            </Button>
          </a>
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