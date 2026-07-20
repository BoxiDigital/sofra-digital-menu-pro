import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft, Store, Trash2, ExternalLink,
  Users, Shield, AlertTriangle,
  Search, Eye, LogOut, Plus, Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  getRestaurants,
  deleteRestaurant,
  getDishes,
  getCategories,
} from "../utils/storage";

interface RestaurantStats {
  id: string;
  nameAr: string;
  nameFr: string;
  slug: string;
  logoUrl: string;
  dishesCount: number;
  categoriesCount: number;
  primaryColor: string;
}

export default function SuperAdmin() {
  const { user, logout, isSuperAdmin } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [restaurants, setRestaurants] = useState<RestaurantStats[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedForDelete, setSelectedForDelete] = useState<string | null>(null);

  useEffect(() => {
    if (!isSuperAdmin) {
      navigate("/admin", { replace: true });
      return;
    }
    loadRestaurants();
  }, [isSuperAdmin]);

  const loadRestaurants = () => {
      const all = getRestaurants();
      const withStats: RestaurantStats[] = all.map((r) => ({
        id: r.id,
        nameAr: r.nameAr,
        nameFr: r.nameFr,
        slug: r.slug,
        logoUrl: r.logoUrl,
        primaryColor: r.primaryColor,
        dishesCount: getDishes(r.id).length,
        categoriesCount: getCategories(r.id).length,
      }));
      setRestaurants(withStats);
    };

  const handleDelete = (id: string) => {
    if (id === "rest_001") {
      toast({ title: "غير مسموح", description: "لا يمكن حذف المطعم الافتراضي", variant: "destructive" });
      setSelectedForDelete(null);
      return;
    }

    deleteRestaurant(id);
    toast({ title: "تم الحذف", description: "تم حذف المطعم وجميع بياناته" });
    setSelectedForDelete(null);
    loadRestaurants();
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  const filtered = restaurants.filter(
    (r) =>
      r.nameAr.includes(searchTerm) ||
      r.nameFr.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.id.includes(searchTerm) ||
      r.slug.includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#0D0D0D] pb-16" dir="rtl">
      {/* الهيدر */}
      <header className="border-b border-white/[0.06] bg-white/[0.02] sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                <Shield className="h-5 w-5 text-red-400" />
              </div>
              <div>
                <h1 className="text-white font-extrabold text-lg leading-tight">لوحة الإدارة العليا</h1>
                <p className="text-white/25 text-xs">Super Admin Dashboard</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/admin">
              <Button variant="ghost" size="sm" className="text-[#C8A24D] hover:text-[#D4B35D] hover:bg-white/5 h-9 gap-1.5">
                <Eye className="h-3.5 w-3.5" />
                <span>لوحة مطعمي</span>
              </Button>
            </Link>
            <Button
              variant="ghost" size="sm"
              className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-9 gap-1.5"
              onClick={handleLogout}
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>خروج</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 mt-8 space-y-8">
        {/* ملخص */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
              <Store className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-extrabold text-white">{restaurants.length}</p>
              <p className="text-white/30 text-xs">مطعم مسجل</p>
            </div>
          </div>
          <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center flex-shrink-0">
              <Users className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-extrabold text-white">
                {restaurants.reduce((sum, r) => sum + r.dishesCount, 0)}
              </p>
              <p className="text-white/30 text-xs">طبق إجمالاً</p>
            </div>
          </div>
          <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center flex-shrink-0">
              <Users className="h-5 w-5 text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-extrabold text-white">{restaurants.length}</p>
              <p className="text-white/30 text-xs">مستخدم نشط</p>
            </div>
          </div>
        </div>

        {/* شريط البحث وإضافة */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[250px]">
            <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-11 pl-4 bg-white/[0.03] border-white/[0.07] text-white placeholder:text-white/20 rounded-xl h-11 text-sm"
              placeholder="بحث عن مطعم..."
            />
          </div>
          <Link to="/register">
            <Button className="bg-emerald-500 hover:bg-emerald-400 text-white font-bold rounded-xl h-11 gap-2 shadow-lg shadow-emerald-500/10">
              <Plus className="h-4 w-4" />
              <span>إضافة مطعم جديد</span>
            </Button>
          </Link>
        </div>

        {/* جدول المطاعم */}
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden">
          {filtered.length === 0 ? (
            <div className="py-16 text-center text-white/25">
              <Search className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">لا توجد مطاعم مطابقة للبحث</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06] text-white/30 text-xs">
                    <th className="text-right py-3.5 px-5 font-medium">المطعم</th>
                    <th className="text-right py-3.5 px-5 font-medium hidden sm:table-cell">المعرّف</th>
                    <th className="text-center py-3.5 px-5 font-medium">الأطباق</th>
                    <th className="text-center py-3.5 px-5 font-medium hidden sm:table-cell">الفئات</th>
                    <th className="text-center py-3.5 px-5 font-medium">إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r) => (
                    <tr
                      key={r.id}
                      className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-extrabold text-xs flex-shrink-0"
                            style={{ backgroundColor: r.primaryColor || "#C8A24D" }}
                          >
                            {r.nameAr.charAt(0)}
                          </div>
                          <div>
                            <p className="text-white/80 font-semibold">{r.nameAr}</p>
                            <p className="text-white/25 text-xs">{r.nameFr}</p>
                          </div>
                          {r.id === "rest_001" && (
                            <span className="text-[9px] bg-[#C8A24D]/15 text-[#C8A24D] px-1.5 py-0.5 rounded font-bold">
                              افتراضي
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-5 hidden sm:table-cell">
                        <code className="text-white/25 text-xs bg-white/[0.03] px-2 py-1 rounded-md font-mono">{r.id}</code>
                      </td>
                      <td className="py-3.5 px-5 text-center">
                        <span className="text-white/60 font-semibold">{r.dishesCount}</span>
                      </td>
                      <td className="py-3.5 px-5 text-center hidden sm:table-cell">
                        <span className="text-white/60 font-semibold">{r.categoriesCount}</span>
                      </td>
                      <td className="py-3.5 px-5">
                                              <div className="flex items-center justify-center gap-1">
                                                <Link to={`/?restaurant=${r.id}`} target="_blank">
                                                  <Button
                                                    variant="ghost" size="sm"
                                                    className="text-white/30 hover:text-white/60 hover:bg-white/5 h-8 w-8 p-0"
                                                    title="عرض المنيو"
                                                  >
                                                    <Eye className="h-3.5 w-3.5" />
                                                  </Button>
                                                </Link>
                                                <Link to={`/admin?as=${r.id}`} target="_blank">
                                                  <Button
                                                    variant="ghost" size="sm"
                                                    className="text-[#C8A24D]/60 hover:text-[#C8A24D] hover:bg-white/5 h-8 w-8 p-0"
                                                    title="فتح لوحة التحكم"
                                                  >
                                                    <Settings className="h-3.5 w-3.5" />
                                                  </Button>
                                                </Link>
                          {selectedForDelete === r.id ? (
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost" size="sm"
                                className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-8 text-xs px-2"
                                onClick={() => handleDelete(r.id)}
                              >
                                تأكيد
                              </Button>
                              <Button
                                variant="ghost" size="sm"
                                className="text-white/30 hover:text-white/60 h-8 text-xs px-2"
                                onClick={() => setSelectedForDelete(null)}
                              >
                                إلغاء
                              </Button>
                            </div>
                          ) : (
                            <Button
                              variant="ghost" size="sm"
                              className={`hover:bg-red-500/10 h-8 w-8 p-0 ${r.id === "rest_001" ? "text-white/10 cursor-not-allowed" : "text-red-400/60 hover:text-red-400"}`}
                              onClick={() => r.id !== "rest_001" && setSelectedForDelete(r.id)}
                              title={r.id === "rest_001" ? "لا يمكن حذف المطعم الافتراضي" : "حذف المطعم"}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* تحذير */}
        <div className="flex items-start gap-2.5 bg-red-500/5 border border-red-500/10 rounded-xl p-4 text-xs text-red-400/70">
          <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-red-400 mb-1">منطقة حساسة</p>
            <p>حذف مطعم يؤدي إلى حذف جميع بياناته (أطباق، فئات، إعدادات) بشكل دائم. لا يمكن التراجع عن هذا الإجراء.</p>
          </div>
        </div>
      </div>
    </div>
  );
}