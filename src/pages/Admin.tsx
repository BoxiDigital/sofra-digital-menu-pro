import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  getCategories,
  getDishes,
  getRestaurantConfig,
  saveCategories,
  saveDishes,
  saveRestaurantConfig,
  resetToDefault,
  getRestaurantById,
} from "../utils/storage";
import { Category, Dish, RestaurantConfig } from "../types";
import AdminView from "../components/AdminView";
import { Eye, LogOut, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "../contexts/AuthContext";

export default function Admin() {
  const { user, logout, isSuperAdmin } = useAuth();
  const navigate = useNavigate();

  const [categories, setCategories] = useState<Category[]>([]);
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [config, setConfig] = useState<RestaurantConfig | null>(null);

  const restaurantId = user?.restaurantId || "rest_001";
  const restaurant = restaurantId ? getRestaurantById(restaurantId) : undefined;

  const loadData = () => {
    setCategories(getCategories(restaurantId));
    setDishes(getDishes(restaurantId));
    setConfig(getRestaurantConfig(restaurantId));
  };

  useEffect(() => {
    loadData();
  }, [restaurantId]);

  const handleUpdateCategories = (newCategories: Category[]) => {
    setCategories(newCategories);
    saveCategories(restaurantId, newCategories);
  };

  const handleUpdateDishes = (newDishes: Dish[]) => {
    setDishes(newDishes);
    saveDishes(restaurantId, newDishes);
  };

  const handleUpdateConfig = (newConfig: RestaurantConfig) => {
    setConfig(newConfig);
    saveRestaurantConfig(restaurantId, newConfig);
  };

  const handleReset = () => {
    if (
      confirm(
        "هل أنت متأكد من إعادة تعيين جميع البيانات إلى القيم الافتراضية؟ سيتم فقدان أي تغييرات قمت بها."
      )
    ) {
      resetToDefault(restaurantId);
      loadData();
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  if (!config) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0D0D0D]">
        <div className="animate-pulse text-[#C8A24D] font-bold text-lg">
          جاري تحميل لوحة التحكم...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0D0D0D]">
      {/* شريط علوي */}
      <div
        className="bg-white/[0.03] border-b border-white/[0.06] text-white/70 py-2 px-4 text-xs flex justify-between items-center"
        dir="rtl"
      >
        <div className="flex items-center gap-3">
          <span>
            {restaurant?.nameAr || "المطعم"}{" "}
            <span className="text-white/30">• {user?.email} • {restaurantId}</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Link to={`/?restaurant=${restaurantId}`} target="_blank">
            <Button
              size="sm"
              variant="ghost"
              className="text-[#C8A24D] hover:text-[#D4B35D] hover:bg-white/5 h-7 gap-1"
            >
              <Eye className="h-3.5 w-3.5" />
              <span>عرض المنيو</span>
            </Button>
          </Link>
          {isSuperAdmin && (
            <Link to="/super-admin">
              <Button
                size="sm"
                variant="ghost"
                className="text-red-400/80 hover:text-red-300 hover:bg-red-500/10 h-7 gap-1"
              >
                <Shield className="h-3.5 w-3.5" />
                <span>إدارة المطاعم</span>
              </Button>
            </Link>
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
              restaurantId={restaurantId}
              onUpdateCategories={handleUpdateCategories}
              onUpdateDishes={handleUpdateDishes}
              onUpdateConfig={handleUpdateConfig}
              onReset={handleReset}
            />
    </div>
  );
}
