import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { 
  getCategories, 
  getDishes, 
  getRestaurantConfig, 
  saveCategories, 
  saveDishes, 
  saveRestaurantConfig,
  resetToDefault
} from "../utils/storage";
import { Category, Dish, RestaurantConfig } from "../types";
import AdminView from "../components/AdminView";
import { ArrowLeft, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Admin() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [config, setConfig] = useState<RestaurantConfig | null>(null);

  const loadData = () => {
    setCategories(getCategories());
    setDishes(getDishes());
    setConfig(getRestaurantConfig());
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUpdateCategories = (newCategories: Category[]) => {
    setCategories(newCategories);
    saveCategories(newCategories);
  };

  const handleUpdateDishes = (newDishes: Dish[]) => {
    setDishes(newDishes);
    saveDishes(newDishes);
  };

  const handleUpdateConfig = (newConfig: RestaurantConfig) => {
    setConfig(newConfig);
    saveRestaurantConfig(newConfig);
  };

  const handleReset = () => {
    if (confirm("هل أنت متأكد من إعادة تعيين جميع البيانات إلى القيم الافتراضية؟ سيتم فقدان أي تغييرات قمت بها.")) {
      resetToDefault();
      loadData();
    }
  };

  if (!config) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0D0D0D]">
        <div className="animate-pulse text-[#C8A24D] font-bold text-lg">جاري تحميل لوحة التحكم...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0D0D0D]">
      {/* Top Bar to go back to Client View */}
      <div className="bg-white/[0.03] border-b border-white/[0.06] text-white/70 py-2 px-4 text-xs flex justify-between items-center" dir="rtl">
        <span>أنت في وضع الإدارة والتعديل</span>
        <Link to="/">
          <Button size="sm" variant="ghost" className="text-[#C8A24D] hover:text-[#D4B35D] hover:bg-white/5 h-7 gap-1">
            <Eye className="h-3.5 w-3.5" />
            <span>عرض المنيو كزبون</span>
          </Button>
        </Link>
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