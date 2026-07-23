import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  getCategories,
  getDishes,
  getRestaurantConfig,
  getRestaurantById,
  getRestaurants,
  subscribeToDataChanges,
} from "../utils/storage";
import { Category, Dish, RestaurantConfig } from "../types";
import ClientView from "../components/ClientView";
import { Settings, Store, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Index() {
  const [searchParams] = useSearchParams();
  const restaurantId = searchParams.get("restaurant") || "";

  const [categories, setCategories] = useState<Category[]>([]);
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [config, setConfig] = useState<RestaurantConfig | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    // إذا لم يُحدد مطعم، اعرض أول مطعم متاح
    if (!restaurantId) {
      const allRestaurants = getRestaurants();
      if (allRestaurants.length > 0) {
        const firstId = allRestaurants[0].id;
        window.history.replaceState(null, "", `/?restaurant=${firstId}`);
        // إعادة التحميل بالمعرّف الصحيح
        window.dispatchEvent(new Event("popstate"));
      } else {
        setConfig(null);
        setNotFound(false);
      }
      return;
    }

    const loadData = () => {
      const cats = getCategories(restaurantId);
      const dsh = getDishes(restaurantId);
      const cfg = getRestaurantConfig(restaurantId);

      if (!cfg && cats.length === 0 && dsh.length === 0) {
        // المطعم غير موجود أو بياناته فارغة
        const exists = !!getRestaurantById(restaurantId);
        if (!exists) {
          setNotFound(true);
          return;
        }
      }

      setCategories(cats);
      setDishes(dsh);
      setConfig(cfg);
      setNotFound(false);
    };

    loadData();

    const unsubscribe = subscribeToDataChanges(loadData);
    return unsubscribe;
  }, [restaurantId]);

  const allRestaurants = getRestaurants();

  // حالة: لا توجد مطاعم مسجلة على الإطلاق
  if (!restaurantId && allRestaurants.length === 0) {
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
              لا توجد مطاعم مسجلة بعد — كن أول من يسجل!
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

  // حالة: المطعم المطلوب غير موجود
  if (notFound) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0D0D0D] px-4" dir="rtl">
        <div className="max-w-md text-center space-y-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20">
            <AlertTriangle className="h-8 w-8 text-red-400" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-white mb-2">المطعم غير موجود</h2>
            <p className="text-white/35 text-sm">
              المطعم بالمعرّف <code className="bg-white/[0.05] px-2 py-0.5 rounded text-[#C8A24D] font-mono">{restaurantId}</code> غير مسجل في النظام
            </p>
          </div>
          <div className="flex gap-3 justify-center">
            <Link to="/">
              <Button variant="ghost" className="text-white/50 hover:text-white/70 border border-white/[0.08] rounded-xl">
                الصفحة الرئيسية
              </Button>
            </Link>
            <Link to="/register">
              <Button className="bg-[#C8A24D] hover:bg-[#D4B35D] text-black font-bold rounded-xl">
                سجل مطعمك
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // حالة: بيانات المطعم فارغة
  if (!config) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0D0D0D]">
        <div className="animate-pulse text-[#C8A24D] font-bold text-lg">جاري تحميل القائمة...</div>
      </div>
    );
  }

  const restaurant = getRestaurantById(restaurantId);

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