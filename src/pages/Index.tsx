import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  getCategories,
  getDishes,
  getRestaurantConfig,
  hasRegisteredUser,
  subscribeToDataChanges,
} from "../utils/storage";
import { Category, Dish, RestaurantConfig } from "../types";
import ClientView from "../components/ClientView";
import { Settings } from "lucide-react";

export default function Index() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [config, setConfig] = useState<RestaurantConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

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

  // توجيه الزائر الجديد إلى صفحة تسجيل المطعم إذا لم يكن هناك مطعم مسجل
  useEffect(() => {
    if (!isLoading && !hasRegisteredUser()) {
      navigate("/register", { replace: true });
    }
  }, [isLoading, navigate]);

  // حالة التحميل
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0D0D0D]">
        <div className="animate-pulse text-[#C8A24D] font-bold text-lg">جاري تحميل القائمة...</div>
      </div>
    );
  }

  // إذا لم يكن هناك مطعم مسجل، لا نعرض شيئاً (سيتم التوجيه لصفحة التسجيل)
  if (!config || !hasRegisteredUser()) {
    return null;
  }

  // عرض قائمة المطعم للزوار
  return (
    <div className="relative min-h-screen">
      <ClientView categories={categories} dishes={dishes} config={config} />

      <footer className="bg-zinc-900 text-zinc-400 py-8 text-center text-xs border-t border-zinc-800">
        <div className="max-w-md mx-auto px-4 space-y-3">
          <p className="text-white/60 font-semibold">{config.nameAr}</p>
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