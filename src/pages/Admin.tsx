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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-pulse text-amber-600 font-bold text-lg">جاري تحميل لوحة التحكم...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Bar to go back to Client View */}
      <div className="bg-zinc-900 text-white py-2 px-4 text-xs flex justify-between items-center" dir="rtl">
        <span>أنت في وضع الإدارة والتعديل</span>
        <Link to="/">
          <Button size="sm" variant="ghost" className="text-amber-400 hover:text-amber-300 hover:bg-white/10 h-7 gap-1">
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
