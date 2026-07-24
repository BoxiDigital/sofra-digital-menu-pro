import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  getCategories,
  getDishes,
  getRestaurantConfig,
  getRestaurant,
  hasRegisteredUser,
  subscribeToDataChanges,
} from "../utils/storage";
import { Category, Dish, RestaurantConfig } from "../types";
import ClientView from "../components/ClientView";
import { Settings, Store } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Index() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [config, setConfig] = useState<RestaurantConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = () => {
    const cats = getCategories();
    const dsh = getDishes();
    const cfg = getRestaurantConfig();

    setCategories(cats);
    setDishes(dsh);
    setConfig(cfg);
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
    const unsubscribe = subscribeToDataChanges(loadData);
    return unsubscribe;
  }, []);

  // حالة التحميل
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0D0D0D]">
        <div className="animate-pulse text-[#C8A24D] font-bold text-lg">جاري تحميل القائمة...</div>
      </div>
    );
  }

  // لا يوجد مطعم مسجل بعد → صفحة الترحيب
  if (!config || !hasRegisteredUser()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0D0D0D] px-4" dir="rtl">
        <div className="max-w-md text-center space-y-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-[#C8A24D]/10 border border-[#C8A24D]/20">
            <Store className="h-10 w-10 text-[#C8A24D]" />
          </div>
          <div className="space-y-3">
            <h2 className="text-2xl font-extrabold text-white">مرحباً بك في صفرة</h2>
            <p className="text-white/40 text-sm leading-relaxed">
              منصة رقمية لعرض قائمة مطعمك ومشاركتها مع زبائنك.
              <br />
              سجّل مطعمك الآن وابدأ في إدارة قائمتك الرقمية بسهولة.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <Link to="/register">
              <Button className="w-full py-6 bg-[#C8A24D] hover:bg-[#D4B35D] text-black font-bold rounded-xl text-base shadow-lg shadow-[#C8A24D]/10">
                سجل مطعمك الآن
              </Button>
            </Link>
            <Link to="/login">
              <Button variant="ghost" className="w-full text-white/40 hover:text-white/60 rounded-xl">
                لدي حساب بالفعل
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // عرض قائمة المطعم
  const restaurant = getRestaurant();

  return (
    <div className="relative min-h-screen">
      <ClientView categories={categories} dishes={dishes} config={config} />

      <footer className="bg-zinc-900 text-zinc-400 py-8 text-center text-xs border-t border-zinc-800">
        <div className="max-w-md mx-auto px-4 space-y-3">
          <p className="text-white/60 font-semibold">{restaurant?.nameAr || config.nameAr}</p>
          <p>© {new Date().getFullYear()} {config.nameAr}. جميع الحقوق محفوظة.</p>
          <div className="flex justify-center gap-4">
            <Link
              to="/admin"
              className="inline-flex items-center gap-1 text-amber-500 hover:text-amber-400 font-semibold transition-colors"
            >
              <Settings className="h-3.5 w-3.5" />
              <span>لوحة تحكم المدير</span>
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}