import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  getCategories,
  getDishes,
  getRestaurantConfig,
  saveCategories,
  saveDishes,
  saveRestaurantConfig,
  resetToDefault,
  seedDefaultData,
  getRestaurantById,
  getRestaurants,
} from "../utils/storage";
import { Category, Dish, RestaurantConfig } from "../types";
import AdminView from "../components/AdminView";
import { Eye, LogOut, Shield, Store, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "../contexts/AuthContext";

export default function Admin() {
  const { user, logout, isSuperAdmin } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // يسمح للـ super admin بتبديل المطعم عبر ?as=rest_XXX
  const effectiveRestaurantId = isSuperAdmin
    ? searchParams.get("as") || user?.restaurantId || "rest_001"
    : user?.restaurantId || "rest_001";

  const restaurant = getRestaurantById(effectiveRestaurantId);
  const allRestaurants = isSuperAdmin ? getRestaurants() : [];

  const [categories, setCategories] = useState<Category[]>([]);
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [config, setConfig] = useState<RestaurantConfig | null>(null);

  const loadData = () => {
    setCategories(getCategories(effectiveRestaurantId));
    setDishes(getDishes(effectiveRestaurantId));
    setConfig(getRestaurantConfig(effectiveRestaurantId));
  };

  useEffect(() => {
      loadData();
    }, [effectiveRestaurantId]);
  
    // تهيئة تلقائية للمطعم الجديد إذا لم تكن بياناته موجودة بعد
    useEffect(() => {
      if (config === null && restaurant) {
        const seeded = seedDefaultData(effectiveRestaurantId);
        if (seeded) {
          loadData();
        }
      }
    }, [config, restaurant, effectiveRestaurantId]);

  const handleUpdateCategories = (newCategories: Category[]) => {
    setCategories(newCategories);
    saveCategories(effectiveRestaurantId, newCategories);
  };

  const handleUpdateDishes = (newDishes: Dish[]) => {
    setDishes(newDishes);
    saveDishes(effectiveRestaurantId, newDishes);
  };

  const handleUpdateConfig = (newConfig: RestaurantConfig) => {
    setConfig(newConfig);
    saveRestaurantConfig(effectiveRestaurantId, newConfig);
  };

  const handleReset = () => {
    if (
      confirm(
        "هل أنت متأكد من إعادة تعيين جميع البيانات إلى القيم الافتراضية؟ سيتم فقدان أي تغييرات قمت بها."
      )
    ) {
      resetToDefault(effectiveRestaurantId);
      loadData();
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  const switchRestaurant = (id: string) => {
    setSearchParams({ as: id });
  };

  if (!restaurant) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#0D0D0D]">
          <div className="text-center space-y-4">
            <div className="text-[#C8A24D] font-bold text-lg">
              المطعم غير موجود
            </div>
            <p className="text-white/25 text-sm">
              المطعم <code className="bg-white/[0.05] px-2 py-0.5 rounded">{effectiveRestaurantId}</code> غير مسجل في النظام
            </p>
          </div>
        </div>
      );
    }
  
    if (!config) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#0D0D0D]">
          <div className="text-center space-y-4">
            <div className="animate-pulse text-[#C8A24D] font-bold text-lg">
              جاري تهيئة المطعم...
            </div>
          </div>
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
          {/* مبدّل المطاعم للـ Super Admin */}
          {isSuperAdmin && allRestaurants.length > 0 && (
            <div className="relative flex items-center gap-2">
              <Store className="h-3.5 w-3.5 text-[#C8A24D]" />
              <select
                value={effectiveRestaurantId}
                onChange={(e) => switchRestaurant(e.target.value)}
                className="bg-white/[0.05] border border-white/[0.1] text-white/80 rounded-lg px-2.5 py-1 text-xs font-semibold cursor-pointer hover:border-[#C8A24D]/40 focus:outline-none focus:border-[#C8A24D] transition-colors appearance-none pr-6"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%23C8A24D' viewBox='0 0 16 16'%3E%3Cpath d='M8 11L3 6h10z'/%3E%3C/svg%3E")`,
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "left 6px center",
                }}
              >
                {allRestaurants.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.nameAr} ({r.id})
                  </option>
                ))}
              </select>
            </div>
          )}

          <span>
            {restaurant?.nameAr || "المطعم"}{" "}
            <span className="text-white/30">• {user?.email} • {effectiveRestaurantId}</span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Link to={`/?restaurant=${effectiveRestaurantId}`} target="_blank">
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
        restaurantId={effectiveRestaurantId}
        onUpdateCategories={handleUpdateCategories}
        onUpdateDishes={handleUpdateDishes}
        onUpdateConfig={handleUpdateConfig}
        onReset={handleReset}
      />
    </div>
  );
}