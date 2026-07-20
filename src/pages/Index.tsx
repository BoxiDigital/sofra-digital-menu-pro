import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  getCategories,
  getDishes,
  getRestaurantConfig,
  subscribeToDataChanges,
} from "../utils/storage";
import { Category, Dish, RestaurantConfig } from "../types";
import ClientView from "../components/ClientView";
import { Settings } from "lucide-react";

export default function Index() {
  const [searchParams] = useSearchParams();
  // استخدم rest_001 كافتراضي، وليس undefined (هذا هو الإصلاح الأساسي)
  const restaurantId = searchParams.get("restaurant") || "rest_001";

  const [categories, setCategories] = useState<Category[]>([]);
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [config, setConfig] = useState<RestaurantConfig | null>(null);

  useEffect(() => {
    // دالة إعادة التحميل
    const loadData = () => {
      setCategories(getCategories(restaurantId));
      setDishes(getDishes(restaurantId));
      setConfig(getRestaurantConfig(restaurantId));
    };

    // تحميل أولي
    loadData();

    // اشتراك في حدث التزامن (يغطي: نفس التاب + تاب آخر + متصفح آخر)
    const unsubscribe = subscribeToDataChanges(loadData);
    return unsubscribe;
  }, [restaurantId]);

  if (!config) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0D0D0D]">
        <div className="animate-pulse text-[#C8A24D] font-bold text-lg">جاري تحميل القائمة...</div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      {/* Client View */}
      <ClientView categories={categories} dishes={dishes} config={config} />

      {/* Footer with Admin Link */}
      <footer className="bg-zinc-900 text-zinc-400 py-8 text-center text-xs border-t border-zinc-800">
        <div className="max-w-md mx-auto px-4 space-y-3">
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
