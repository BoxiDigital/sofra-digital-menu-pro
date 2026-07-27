import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Dish, Category, RestaurantConfig } from "../types";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff, 
  Download, 
  QrCode, 
  Lock, 
  LogOut, 
  Settings, 
  PlusCircle, 
  Save, 
  RefreshCw, 
  Check, 
  X, 
  Upload, 
  Image as ImageIcon,
  Sparkles,
  Utensils,
  Beef,
  Sandwich,
  Cake,
  Coffee,
  AlertCircle,
  Ban,
  RefreshCcw,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const iconMap: Record<string, React.ComponentType<any>> = {
  Sparkles,
  Utensils,
  Beef,
  Sandwich,
  Cake,
  Coffee,
};

interface AdminViewProps {
  categories: Category[];
  dishes: Dish[];
  config: RestaurantConfig;
  restaurantSlug: string;
  onUpdateCategories: (categories: Category[]) => void;
  onUpdateDishes: (dishes: Dish[]) => void;
  onUpdateConfig: (config: RestaurantConfig) => void;
  onReset: () => void;
}

/** Lighten a hex color by mixing it with white */
function lightenColor(hex: string, amount: number): string {
  hex = hex.replace("#", "");
  if (hex.length === 3) hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  const r = Math.min(255, Math.round(parseInt(hex.substring(0, 2), 16) + (255 - parseInt(hex.substring(0, 2), 16)) * amount));
  const g = Math.min(255, Math.round(parseInt(hex.substring(2, 4), 16) + (255 - parseInt(hex.substring(2, 4), 16)) * amount));
  const b = Math.min(255, Math.round(parseInt(hex.substring(4, 6), 16) + (255 - parseInt(hex.substring(4, 6), 16)) * amount));
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

export default function AdminView({
  categories,
  dishes,
  config,
  restaurantSlug,
  onUpdateCategories,
  onUpdateDishes,
  onUpdateConfig,
  onReset,
}: AdminViewProps) {
  const { toast } = useToast();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Sync primaryColor to CSS variables so admin UI reflects the selected theme
  React.useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--primary", config.primaryColor);
    root.style.setProperty("--primary-hover", lightenColor(config.primaryColor, 0.15));
  }, [config.primaryColor]);

  const handleLogout = () => {
      logout();
      navigate("/login", { replace: true });
    };
  
    const [isSaving, setIsSaving] = useState(false);
    
      // ── حالة تغيير كلمة المرور ──
      const [currentPassword, setCurrentPassword] = useState("");
      const [newPassword, setNewPassword] = useState("");
      const [confirmNewPassword, setConfirmNewPassword] = useState("");
      const [showCurrentPassword, setShowCurrentPassword] = useState(false);
      const [showNewPassword, setShowNewPassword] = useState(false);
      const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
      const [isChangingPassword, setIsChangingPassword] = useState(false);
      const [passwordError, setPasswordError] = useState("");
      const [passwordSuccess, setPasswordSuccess] = useState("");
    
      const handleChangePassword = async () => {
        setPasswordError("");
        setPasswordSuccess("");
    
        if (!currentPassword) {
          setPasswordError("يرجى إدخال كلمة المرور الحالية");
          return;
        }
        if (!newPassword) {
          setPasswordError("يرجى إدخال كلمة المرور الجديدة");
          return;
        }
        if (newPassword.length < 6) {
          setPasswordError("كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل");
          return;
        }
        if (newPassword !== confirmNewPassword) {
          setPasswordError("كلمة المرور الجديدة غير متطابقة");
          return;
        }
    
        setIsChangingPassword(true);
        try {
          // إعادة المصادقة بكلمة المرور الحالية
          const { error: authError } = await supabase.auth.signInWithPassword({
            email: user?.email || "",
            password: currentPassword,
          });
          if (authError) {
            setPasswordError("كلمة المرور الحالية غير صحيحة");
            setIsChangingPassword(false);
            return;
          }
    
          // تحديث كلمة المرور
          const { error: updateError } = await supabase.auth.updateUser({
            password: newPassword,
          });
          if (updateError) {
            setPasswordError(updateError.message);
            setIsChangingPassword(false);
            return;
          }
    
          setPasswordSuccess("تم تغيير كلمة المرور بنجاح");
          setCurrentPassword("");
          setNewPassword("");
          setConfirmNewPassword("");
        } catch (err: any) {
          setPasswordError(err?.message || "حدث خطأ أثناء تغيير كلمة المرور");
        } finally {
          setIsChangingPassword(false);
        }
      };
    
      const handleSaveError = (err: any) => {
      console.error("[AdminView] Save error:", err);
      toast({ title: "خطأ في الحفظ", description: err?.message || "حدث خطأ أثناء حفظ البيانات، يرجى المحاولة مرة أخرى", variant: "destructive" });
    };
  
    const handleUpdateDishesSafe = async (updatedDishes: Dish[]) => {
      if (isSaving) return;
      setIsSaving(true);
      try {
        await onUpdateDishes(updatedDishes);
      } catch (err) {
        handleSaveError(err);
      } finally {
        setIsSaving(false);
      }
    };
  
    const handleUpdateCategoriesSafe = async (updatedCategories: Category[]) => {
      if (isSaving) return;
      setIsSaving(true);
      try {
        await onUpdateCategories(updatedCategories);
      } catch (err) {
        handleSaveError(err);
      } finally {
        setIsSaving(false);
      }
    };
  
    const handleUpdateConfigSafe = async (cfg: RestaurantConfig) => {
      if (isSaving) return;
      setIsSaving(true);
      try {
        await onUpdateConfig(cfg);
      } catch (err) {
        handleSaveError(err);
      } finally {
        setIsSaving(false);
      }
    };
  
    const [editingDish, setEditingDish] = useState<Dish | null>(null);
  const [dishForm, setDishForm] = useState<Partial<Dish>>({});
  const [isDishDialogOpen, setIsDishDialogOpen] = useState(false);

  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryForm, setCategoryForm] = useState<Partial<Category>>({});
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);

  const [configForm, setConfigForm] = useState<RestaurantConfig>({ ...config });
  
    // Keep CSS variables in sync so the admin dashboard reflects the selected theme
    useEffect(() => {
      const root = document.documentElement;
      root.style.setProperty("--primary", configForm.primaryColor);
      root.style.setProperty("--primary-hover", lightenColor(configForm.primaryColor, 0.15));
    }, [configForm.primaryColor]);

  const availableDishes = dishes.filter((d) => d.isAvailable);
  const unavailableDishes = dishes.filter((d) => !d.isAvailable);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, type: "dish" | "logo" | "cover") => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      if (type === "dish") setDishForm((prev) => ({ ...prev, image: base64String }));
      else if (type === "cover") setConfigForm((prev) => ({ ...prev, coverUrl: base64String }));
      else setConfigForm((prev) => ({ ...prev, logoUrl: base64String }));
      toast({ title: "تم رفع الصورة بنجاح", description: "تم تحويل الصورة وحفظها محلياً" });
    };
    reader.readAsDataURL(file);
  };

  const openAddDish = () => {
    setEditingDish(null);
    setDishForm({
      nameAr: "", nameFr: "", descriptionAr: "", descriptionFr: "", price: 0,
      category: categories[0]?.id || "",
      image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80",
      isAvailable: true, isNew: false, isBestSeller: false, isVegetarian: false, isHalal: true, isGlutenFree: false,
    });
    setIsDishDialogOpen(true);
  };

  const openEditDish = (dish: Dish) => { setEditingDish(dish); setDishForm({ ...dish }); setIsDishDialogOpen(true); };

  const saveDish = async () => {
      if (!dishForm.nameAr || !dishForm.nameFr || !dishForm.price) {
        toast({ title: "تنبيه", description: "يرجى ملء جميع الحقول المطلوبة", variant: "destructive" });
        return;
      }
      let updatedDishes: Dish[];
      if (editingDish) {
        updatedDishes = dishes.map((d) => (d.id === editingDish.id ? (dishForm as Dish) : d));
      } else {
        const newDish: Dish = { ...(dishForm as Dish), id: `dish_${Date.now()}` };
        updatedDishes = [...dishes, newDish];
      }
      await handleUpdateDishesSafe(updatedDishes);
      setIsDishDialogOpen(false);
      if (editingDish) {
        toast({ title: "تم التعديل", description: "تم تعديل الطبق بنجاح" });
      } else {
        toast({ title: "تم الإضافة", description: "تم إضافة الطبق الجديد بنجاح" });
      }
    };
  
    const deleteDish = async (id: string) => {
      if (confirm("هل أنت متأكد من حذف هذا الطبق؟")) {
        await handleUpdateDishesSafe(dishes.filter((d) => d.id !== id));
        toast({ title: "تم الحذف", description: "تم حذف الطبق بنجاح" });
      }
    };
  
    const toggleDishAvailability = async (id: string, currentStatus: boolean) => {
      const updated = dishes.map((d) => d.id === id ? { ...d, isAvailable: !currentStatus } : d);
      await handleUpdateDishesSafe(updated);
      toast({ title: !currentStatus ? "تم تفعيل الطبق" : "تم تعطيل الطبق", description: !currentStatus ? "الطبق متوفر الآن للزبائن" : "الطبق غير متوفر حالياً (مخفي عن الزبائن)" });
    };
  
    const reactivateDish = async (id: string) => {
      await handleUpdateDishesSafe(dishes.map((d) => d.id === id ? { ...d, isAvailable: true } : d));
      toast({ title: "تم إعادة تفعيل الطبق", description: "عاد الطبق للظهور في قائمة الزبائن" });
    };

  const openAddCategory = () => {
    setEditingCategory(null);
    setCategoryForm({ nameAr: "", nameFr: "", icon: "Utensils" });
    setIsCategoryDialogOpen(true);
  };

  const openEditCategory = (category: Category) => { setEditingCategory(category); setCategoryForm({ ...category }); setIsCategoryDialogOpen(true); };

  const saveCategory = async () => {
      if (!categoryForm.nameAr || !categoryForm.nameFr) {
        toast({ title: "تنبيه", description: "يرجى ملء جميع الحقول المطلوبة", variant: "destructive" });
        return;
      }
      let updatedCategories: Category[];
      if (editingCategory) {
        updatedCategories = categories.map((c) => (c.id === editingCategory.id ? (categoryForm as Category) : c));
      } else {
        const newCategory: Category = { ...(categoryForm as Category), id: `cat_${Date.now()}` };
        updatedCategories = [...categories, newCategory];
      }
      await handleUpdateCategoriesSafe(updatedCategories);
      setIsCategoryDialogOpen(false);
      if (editingCategory) {
        toast({ title: "تم التعديل", description: "تم تعديل الفئة بنجاح" });
      } else {
        toast({ title: "تم الإضافة", description: "تم إضافة الفئة الجديدة بنجاح" });
      }
        };
      
        const deleteCategory = async (id: string) => {
          const hasDishes = dishes.some((d) => d.category === id);
          if (hasDishes) {
            toast({ title: "لا يمكن الحذف", description: "هذه الفئة تحتوي على أطباق نشطة. يرجى نقل الأطباق أو حذفها أولاً.", variant: "destructive" });
            return;
          }
          if (confirm("هل أنت متأكد من حذف هذه الفئة؟")) {
            await handleUpdateCategoriesSafe(categories.filter((c) => c.id !== id));
            toast({ title: "تم الحذف", description: "تم حذف الفئة بنجاح" });
          }
        };
      
        const saveConfig = async () => {
                  await handleUpdateConfigSafe(configForm);
                  toast({
                    title: "✅ تم حفظ الإعدادات بنجاح",
                    description: "تم تحديث معلومات المطعم والألوان بنجاح",
                    duration: 3000,
                  });
            };
        
            const PRESET_THEMES = [
              { id: "gold",   label: "ذهبي كلاسيكي", primaryColor: "#C8A24D", backgroundColor: "dark" as const },
              { id: "blue",   label: "أزرق عصري",     primaryColor: "#3B82F6", backgroundColor: "dark" as const },
              { id: "green",  label: "أخضر هادئ",     primaryColor: "#10B981", backgroundColor: "cream" as const },
              { id: "red",    label: "أحمر دافئ",     primaryColor: "#EF4444", backgroundColor: "dark" as const },
              { id: "purple", label: "بنفسجي فاخر",   primaryColor: "#8B5CF6", backgroundColor: "dark" as const },
            ];
        
            const applyTheme = async (theme: typeof PRESET_THEMES[number]) => {
              const updatedConfig = {
                ...configForm,
                primaryColor: theme.primaryColor,
                backgroundColor: theme.backgroundColor,
              };
              setConfigForm(updatedConfig);
              await handleUpdateConfigSafe(updatedConfig);
              toast({
                title: "✅ تم تطبيق الثيم",
                description: `تم تطبيق ثيم "${theme.label}" وحفظه بنجاح`,
                duration: 2500,
              });
            };
        
          const menuUrl = `${window.location.origin}/${restaurantSlug}`;
  
    const downloadQRCode = async () => {
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(menuUrl)}`;
      try {
        const response = await fetch(qrUrl);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url; link.download = `${config.nameAr}-QR.png`;
        document.body.appendChild(link); link.click(); document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        toast({ title: "تم تحميل رمز QR", description: "تم حفظ رمز QR الخاص بقائمتك بنجاح" });
      } catch {
        window.open(qrUrl, "_blank");
      }
    };

  return (
    <div className="min-h-screen bg-[#0D0D0D] pb-12" dir="rtl">
      <header className="bg-white/[0.02] border-b border-white/[0.06] sticky top-0 z-40 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-[var(--primary)]/15 flex items-center justify-center text-[var(--primary)] border border-[var(--primary)]/20">
              <Settings className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-base font-bold text-white">لوحة إدارة شِي نُو</h1>
              <p className="text-xs text-white/35">تعديل فوري لقائمة الطعام والمظهر</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-white/30 hidden sm:block">مرحباً، مدير المطعم</span>
                        <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl" onClick={handleLogout}>
                          <LogOut className="h-4 w-4 ml-1.5" /><span>خروج</span>
                        </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <Tabs defaultValue="dishes" className="space-y-6">
          <TabsList className="bg-white/[0.03] border border-white/[0.06] p-1 rounded-2xl w-full max-w-lg flex">
            <TabsTrigger value="dishes" className="flex-1 py-2.5 rounded-xl font-bold text-sm data-[state=active]:bg-[var(--primary)] data-[state=active]:text-black data-[state=inactive]:text-white/40 data-[state=inactive]:hover:text-white/70 transition-all">الأطباق</TabsTrigger>
                        <TabsTrigger value="categories" className="flex-1 py-2.5 rounded-xl font-bold text-sm data-[state=active]:bg-[var(--primary)] data-[state=active]:text-black data-[state=inactive]:text-white/40 data-[state=inactive]:hover:text-white/70 transition-all">الفئات</TabsTrigger>
                        <TabsTrigger value="settings" className="flex-1 py-2.5 rounded-xl font-bold text-sm data-[state=active]:bg-[var(--primary)] data-[state=active]:text-black data-[state=inactive]:text-white/40 data-[state=inactive]:hover:text-white/70 transition-all">الإعدادات</TabsTrigger>
                                    <TabsTrigger value="account" className="flex-1 py-2.5 rounded-xl font-bold text-sm data-[state=active]:bg-[var(--primary)] data-[state=active]:text-black data-[state=inactive]:text-white/40 data-[state=inactive]:hover:text-white/70 transition-all">الحساب</TabsTrigger>
                      </TabsList>

          {/* DISHES TAB */}
          <TabsContent value="dishes" className="space-y-5">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-white">إدارة الأطباق</h2>
                <p className="text-xs text-white/35 mt-0.5">{dishes.length} طبق في القائمة ({availableDishes.length} متوفر، {unavailableDishes.length} مخفي)</p>
              </div>
              <Button onClick={openAddDish} className="bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-black font-bold rounded-xl h-10 px-4">
                <Plus className="h-4 w-4 ml-1.5" /><span>إضافة طبق</span>
              </Button>
            </div>

            {/* Available dishes */}
            <div className="space-y-1.5">
              {availableDishes.map((dish) => {
                const cat = categories.find((c) => c.id === dish.category);
                return (
                  <div key={dish.id} className="bg-white/[0.03] p-3 rounded-2xl border border-white/[0.06] flex items-center justify-between hover:border-white/[0.10] transition-all gap-3">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="h-12 w-12 rounded-xl overflow-hidden flex-shrink-0 border border-white/10">
                        <img src={dish.image} alt={dish.nameAr} className="w-full h-full object-cover" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold text-white text-sm truncate">{dish.nameAr}</h3>
                          {dish.isPromo && <Badge className="bg-[var(--primary)]/20 text-[var(--primary)] border-0 text-[10px] font-bold px-1.5 py-0 rounded-full">عرض</Badge>}
                          {cat && <span className="text-[10px] text-white/35">({cat.nameAr})</span>}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[var(--primary)] font-bold text-sm">{dish.price} {config.currencyAr}</span>
                          <span className="text-emerald-400/70 text-[10px] font-medium">متوفر</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Switch checked={dish.isAvailable} onCheckedChange={() => toggleDishAvailability(dish.id, dish.isAvailable)} className="data-[state=checked]:bg-[var(--primary)]" />
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-[var(--primary)] hover:text-[var(--primary-hover)] hover:bg-white/5 rounded-lg" onClick={() => openEditDish(dish)}><Edit className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg" onClick={() => deleteDish(dish.id)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Unavailable dishes */}
            {unavailableDishes.length > 0 && (
              <div className="pt-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Ban className="h-4 w-4 text-red-400/50" />
                  <h3 className="text-sm font-bold text-red-400/60">أطباق مخفية عن الزبائن ({unavailableDishes.length})</h3>
                </div>
                <div className="space-y-1.5">
                  {unavailableDishes.map((dish) => {
                    const cat = categories.find((c) => c.id === dish.category);
                    return (
                      <div key={dish.id} className="bg-white/[0.01] p-3 rounded-2xl border border-red-500/10 flex items-center justify-between opacity-60 hover:opacity-80 transition-all gap-3">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="h-12 w-12 rounded-xl overflow-hidden flex-shrink-0 border border-white/5 relative">
                            <img src={dish.image} alt={dish.nameAr} className="w-full h-full object-cover grayscale" />
                            <div className="absolute inset-0 bg-black/30" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-bold text-white/40 text-sm truncate line-through decoration-red-400/30">{dish.nameAr}</h3>
                              {cat && <span className="text-[10px] text-white/20">({cat.nameAr})</span>}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[var(--primary)]/40 font-bold text-sm">{dish.price} {config.currencyAr}</span>
                              <Badge className="bg-red-500/15 text-red-400/70 border-0 text-[10px] font-bold px-1.5 py-0 rounded-full">مخفي</Badge>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Button size="sm" variant="ghost" className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 rounded-lg h-7 gap-1 text-xs" onClick={() => reactivateDish(dish.id)}>
                            <RefreshCcw className="h-3 w-3" /><span>تفعيل</span>
                          </Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-[var(--primary)]/50 hover:text-[var(--primary-hover)] hover:bg-white/5 rounded-lg" onClick={() => openEditDish(dish)}><Edit className="h-4 w-4" /></Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-red-400/50 hover:text-red-300 hover:bg-red-500/10 rounded-lg" onClick={() => deleteDish(dish.id)}><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </TabsContent>

          {/* CATEGORIES TAB */}
          <TabsContent value="categories" className="space-y-5">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-white">إدارة الفئات</h2>
                <p className="text-xs text-white/35 mt-0.5">{categories.length} فئة</p>
              </div>
              <Button onClick={openAddCategory} className="bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-black font-bold rounded-xl h-10 px-4">
                <Plus className="h-4 w-4 ml-1.5" /><span>إضافة فئة</span>
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories.map((cat) => {
                const IconComponent = iconMap[cat.icon] || Utensils;
                const dishCount = dishes.filter((d) => d.category === cat.id).length;
                return (
                  <div key={cat.id} className="bg-white/[0.03] p-4 rounded-2xl border border-white/[0.06] flex items-center justify-between hover:border-white/[0.10] transition-all">
                    <div className="flex items-center gap-3">
                      <div className="h-11 w-11 rounded-xl bg-[var(--primary)]/10 flex items-center justify-center text-[var(--primary)] border border-[var(--primary)]/20">
                        <IconComponent className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-white text-sm">{cat.nameAr}</h3>
                        <p className="text-xs text-white/35">{cat.nameFr} • {dishCount} أطباق</p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-[var(--primary)] hover:text-[var(--primary-hover)] hover:bg-white/5 rounded-lg" onClick={() => openEditCategory(cat)}><Edit className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg" onClick={() => deleteCategory(cat.id)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </TabsContent>

          {/* SETTINGS TAB */}
          <TabsContent value="settings" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white/[0.03] p-6 rounded-2xl border border-white/[0.06] space-y-6">
              <div className="border-b border-white/[0.06] pb-4">
                <h2 className="text-lg font-bold text-white">تخصيص معلومات ومظهر المطعم</h2>
                <p className="text-xs text-white/35 mt-1">قم بتعديل الاسم، الألوان، ومعلومات الاتصال</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-white/60 text-xs">اسم المطعم (بالعربية)</Label>
                  <Input value={configForm.nameAr} onChange={(e) => setConfigForm({ ...configForm, nameAr: e.target.value })} className="mt-1.5 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/20 rounded-xl h-10 text-sm" />
                </div>
                <div>
                  <Label className="text-white/60 text-xs">اسم المطعم (بالفرنسية)</Label>
                  <Input value={configForm.nameFr} onChange={(e) => setConfigForm({ ...configForm, nameFr: e.target.value })} className="mt-1.5 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/20 rounded-xl h-10 text-sm" />
                </div>
                <div>
                  <Label className="text-white/60 text-xs">الشعار (بالعربية)</Label>
                  <Input value={configForm.sloganAr} onChange={(e) => setConfigForm({ ...configForm, sloganAr: e.target.value })} className="mt-1.5 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/20 rounded-xl h-10 text-sm" />
                </div>
                <div>
                  <Label className="text-white/60 text-xs">الشعار (بالفرنسية)</Label>
                  <Input value={configForm.sloganFr} onChange={(e) => setConfigForm({ ...configForm, sloganFr: e.target.value })} className="mt-1.5 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/20 rounded-xl h-10 text-sm" />
                </div>
                <div>
                  <Label className="text-white/60 text-xs">ساعات العمل (بالعربية)</Label>
                  <Input value={configForm.workingHoursAr} onChange={(e) => setConfigForm({ ...configForm, workingHoursAr: e.target.value })} className="mt-1.5 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/20 rounded-xl h-10 text-sm" />
                </div>
                <div>
                  <Label className="text-white/60 text-xs">ساعات العمل (بالفرنسية)</Label>
                  <Input value={configForm.workingHoursFr} onChange={(e) => setConfigForm({ ...configForm, workingHoursFr: e.target.value })} className="mt-1.5 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/20 rounded-xl h-10 text-sm" />
                </div>
                <div>
                  <Label className="text-white/60 text-xs">رقم واتساب (مع رمز الدولة)</Label>
                  <Input value={configForm.whatsappNumber} onChange={(e) => setConfigForm({ ...configForm, whatsappNumber: e.target.value })} className="mt-1.5 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/20 rounded-xl h-10 text-sm" placeholder="212600000000" />
                </div>
                <div>
                  <Label className="text-white/60 text-xs">العملة</Label>
                  <div className="grid grid-cols-2 gap-2 mt-1.5">
                    <Input value={configForm.currencyAr} onChange={(e) => setConfigForm({ ...configForm, currencyAr: e.target.value })} className="bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/20 rounded-xl h-10 text-sm" placeholder="درهم" />
                    <Input value={configForm.currencyFr} onChange={(e) => setConfigForm({ ...configForm, currencyFr: e.target.value })} className="bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/20 rounded-xl h-10 text-sm" placeholder="MAD" />
                  </div>
                </div>
              </div>

              {/* Preset Themes */}
                            <div className="pt-4 border-t border-white/[0.06]">
                              <Label className="text-white/60 text-xs">الثيم الجاهز</Label>
                              <p className="text-white/25 text-[10px] mt-0.5 mb-3">اختر ثيمًا جاهزًا لتطبيق ألوان متناسقة فوراً</p>
                              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                                {PRESET_THEMES.map((theme) => {
                                  const isActive = configForm.primaryColor === theme.primaryColor && configForm.backgroundColor === theme.backgroundColor;
                                  return (
                                    <button
                                      key={theme.id}
                                      onClick={() => applyTheme(theme)}
                                      disabled={isSaving}
                                      className={`relative flex flex-col items-center gap-2 p-3 rounded-xl border transition-all duration-200 ${
                                        isActive
                                          ? "border-[var(--primary)] ring-1 ring-[var(--primary)]/40 bg-white/[0.06]"
                                          : "border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/[0.15]"
                                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                                    >
                                      <div className="flex gap-1.5">
                                        <span
                                          className="w-6 h-6 rounded-full border-2 border-white/20"
                                          style={{ backgroundColor: theme.primaryColor }}
                                        />
                                        <span
                                          className={`w-6 h-6 rounded-full border-2 border-white/20 ${
                                            theme.backgroundColor === "dark"
                                              ? "bg-[#0D0D0D]"
                                              : theme.backgroundColor === "cream"
                                              ? "bg-[#FDF6EE]"
                                              : "bg-white"
                                          }`}
                                        />
                                      </div>
                                      <span className="text-xs font-medium text-white/70">{theme.label}</span>
                                      {isActive && (
                                        <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-[var(--primary)] rounded-full flex items-center justify-center">
                                          <Check className="h-3 w-3 text-black" />
                                        </span>
                                      )}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>

              {/* Logo Upload */}
              <div className="space-y-2 pt-4 border-t border-white/[0.06]">
                <Label className="text-white/60 text-xs">شعار المطعم (صورة)</Label>
                <div className="flex items-center gap-4 mt-1">
                  <div className="h-16 w-16 rounded-2xl border border-white/[0.08] overflow-hidden bg-white/[0.02] flex items-center justify-center flex-shrink-0 relative group">
                    {configForm.logoUrl ? (
                      <>
                        <img src={configForm.logoUrl} alt="Logo Preview" className="w-full h-full object-cover" />
                        <button onClick={() => setConfigForm({ ...configForm, logoUrl: "" })} className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-red-500/80 hover:bg-red-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <X className="h-3 w-3 text-white" />
                        </button>
                      </>
                    ) : (
                      <ImageIcon className="h-6 w-6 text-white/15" />
                    )}
                  </div>
                  <div className="flex-1">
                    <Input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, "logo")} className="hidden" id="logo-upload" />
                    <Label htmlFor="logo-upload" className="cursor-pointer inline-flex items-center gap-2 bg-white/[0.04] hover:bg-white/[0.07] px-4 py-2.5 rounded-xl border border-white/[0.08] text-sm font-semibold text-white/70 hover:text-white transition-all">
                      <Upload className="h-4 w-4" /><span>رفع شعار جديد</span>
                    </Label>
                    <p className="text-xs text-white/25 mt-1.5">يمكنك رفع صورة مباشرة من جهازك وحفظها محلياً</p>
                  </div>
                </div>
              </div>

              {/* Cover Upload */}
              <div className="space-y-2 pt-4 border-t border-white/[0.06]">
                <Label className="text-white/60 text-xs">غلاف المطعم (صورة عريضة)</Label>
                <div className="space-y-3 mt-1">
                  {configForm.coverUrl && (
                    <div className="h-28 w-full rounded-xl border border-white/[0.08] overflow-hidden bg-white/[0.02] relative group">
                      <img src={configForm.coverUrl} alt="Cover Preview" className="w-full h-full object-cover" />
                      <button onClick={() => setConfigForm({ ...configForm, coverUrl: "" })} className="absolute top-2 right-2 w-6 h-6 rounded-full bg-red-500/80 hover:bg-red-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <X className="h-3.5 w-3.5 text-white" />
                      </button>
                    </div>
                  )}
                  <div>
                    <Input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, "cover")} className="hidden" id="cover-upload" />
                    <Label htmlFor="cover-upload" className="cursor-pointer inline-flex items-center gap-2 bg-white/[0.04] hover:bg-white/[0.07] px-4 py-2.5 rounded-xl border border-white/[0.08] text-sm font-semibold text-white/70 hover:text-white transition-all">
                      <Upload className="h-4 w-4" /><span>رفع غلاف جديد</span>
                    </Label>
                    <p className="text-xs text-white/25 mt-1.5">صورة عريضة تظهر كخلفية لأعلى واجهة الزبون</p>
                  </div>
                </div>
              </div>

              {/* WhatsApp Messages */}
              <div className="space-y-4 pt-4 border-t border-white/[0.06]">
                <Label className="text-white/60 text-xs">رسالة واتساب الافتراضية</Label>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <Label className="text-white/40 text-[10px]">بالعربية</Label>
                    <Textarea value={configForm.whatsappMessageAr} onChange={(e) => setConfigForm({ ...configForm, whatsappMessageAr: e.target.value })} className="mt-1 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/20 rounded-xl text-xs min-h-[80px]" />
                  </div>
                  <div>
                    <Label className="text-white/40 text-[10px]">بالفرنسية</Label>
                    <Textarea value={configForm.whatsappMessageFr} onChange={(e) => setConfigForm({ ...configForm, whatsappMessageFr: e.target.value })} className="mt-1 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/20 rounded-xl text-xs min-h-[80px]" />
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-4 border-t border-white/[0.06]">
                <Button
                  onClick={saveConfig}
                  disabled={isSaving}
                  className="bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-black font-bold px-6 h-11 rounded-xl disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 ml-1.5 animate-spin" />
                      <span>جارٍ الحفظ...</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 ml-1.5" />
                      <span>حفظ جميع التغييرات</span>
                    </>
                  )}
                </Button>
                <Button variant="ghost" onClick={onReset} className="text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl">
                  <RefreshCw className="h-4 w-4 ml-1.5" /><span>إعادة تعيين البيانات الافتراضية</span>
                </Button>
              </div>
            </div>

            {/* QR Code Sidebar */}
            <div className="bg-white/[0.03] p-6 rounded-2xl border border-white/[0.06] space-y-4 h-fit">
              <h3 className="text-lg font-bold text-white">مشاركة القائمة</h3>
              <p className="text-xs text-white/35">حمّل رمز QR واطبعه ليتمكن زبائنك من الوصول للقائمة مباشرة</p>
              <div className="bg-white rounded-2xl p-3">
                <img src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(menuUrl)}`} alt="QR Code" className="w-full rounded-xl" />
              </div>
              <Button onClick={downloadQRCode} className="w-full bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-black font-bold rounded-xl h-11">
                <Download className="h-4 w-4 ml-1.5" /><span>تحميل رمز QR</span>
              </Button>
            </div>
          </TabsContent>
          
                    {/* ACCOUNT TAB */}
                    <TabsContent value="account" className="space-y-6">
                      <div>
                        <h2 className="text-xl font-bold text-white">إعدادات الحساب</h2>
                        <p className="text-xs text-white/35 mt-0.5">تغيير كلمة المرور الخاصة بحسابك</p>
                      </div>
          
                      <div className="bg-white/[0.03] p-6 rounded-2xl border border-white/[0.06] space-y-5 max-w-md">
                        {/* Current Password */}
                        <div className="space-y-2">
                          <Label className="text-white/60 text-xs">كلمة المرور الحالية</Label>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20" />
                            <Input
                              type={showCurrentPassword ? "text" : "password"}
                              value={currentPassword}
                              onChange={(e) => { setCurrentPassword(e.target.value); setPasswordError(""); setPasswordSuccess(""); }}
                              className="pl-10 pr-12 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/20 rounded-xl h-11 text-sm"
                              placeholder="أدخل كلمة المرور الحالية"
                              dir="ltr"
                            />
                            <button
                              type="button"
                              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/50 transition-colors"
                              tabIndex={-1}
                            >
                              {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                        </div>
          
                        {/* New Password */}
                        <div className="space-y-2">
                          <Label className="text-white/60 text-xs">كلمة المرور الجديدة</Label>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20" />
                            <Input
                              type={showNewPassword ? "text" : "password"}
                              value={newPassword}
                              onChange={(e) => { setNewPassword(e.target.value); setPasswordError(""); setPasswordSuccess(""); }}
                              className="pl-10 pr-12 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/20 rounded-xl h-11 text-sm"
                              placeholder="أدخل كلمة المرور الجديدة"
                              dir="ltr"
                            />
                            <button
                              type="button"
                              onClick={() => setShowNewPassword(!showNewPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/50 transition-colors"
                              tabIndex={-1}
                            >
                              {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                        </div>
          
                        {/* Confirm New Password */}
                        <div className="space-y-2">
                          <Label className="text-white/60 text-xs">تأكيد كلمة المرور الجديدة</Label>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20" />
                            <Input
                              type={showConfirmNewPassword ? "text" : "password"}
                              value={confirmNewPassword}
                              onChange={(e) => { setConfirmNewPassword(e.target.value); setPasswordError(""); setPasswordSuccess(""); }}
                              className="pl-10 pr-12 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/20 rounded-xl h-11 text-sm"
                              placeholder="أعد كتابة كلمة المرور الجديدة"
                              dir="ltr"
                            />
                            <button
                              type="button"
                              onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/50 transition-colors"
                              tabIndex={-1}
                            >
                              {showConfirmNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                        </div>
          
                        {/* Error Message */}
                        {passwordError && (
                          <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-sm text-red-400">
                            <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                            <span>{passwordError}</span>
                          </div>
                        )}
          
                        {/* Success Message */}
                        {passwordSuccess && (
                          <div className="flex items-start gap-3 bg-green-500/10 border border-green-500/20 rounded-xl p-4 text-sm text-green-400">
                            <Check className="h-4 w-4 flex-shrink-0 mt-0.5" />
                            <span>{passwordSuccess}</span>
                          </div>
                        )}
          
                        <Button
                          onClick={handleChangePassword}
                          disabled={isChangingPassword}
                          className="w-full bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-black font-bold rounded-xl h-11 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
                        >
                          {isChangingPassword ? (
                            <span className="flex items-center gap-2">
                              <span className="w-4 h-4 border-2 border-black/30 border-t-black/80 rounded-full animate-spin" />
                              جاري تغيير كلمة المرور...
                            </span>
                          ) : (
                            <span className="flex items-center gap-1.5">
                              <Lock className="h-4 w-4" />
                              تغيير كلمة المرور
                            </span>
                          )}
                        </Button>
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
          
                {/* Dish Dialog */}
      <Dialog open={isDishDialogOpen} onOpenChange={setIsDishDialogOpen}>
        <DialogContent className="bg-[#1A1A1A] border-white/[0.08] text-white max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">{editingDish ? "تعديل طبق" : "إضافة طبق جديد"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-white/60 text-xs">الاسم (عربي)</Label>
                <Input value={dishForm.nameAr || ""} onChange={(e) => setDishForm({ ...dishForm, nameAr: e.target.value })} className="mt-1 bg-white/[0.04] border-white/[0.08] text-white rounded-xl h-10 text-sm" />
              </div>
              <div>
                <Label className="text-white/60 text-xs">الاسم (فرنسي)</Label>
                <Input value={dishForm.nameFr || ""} onChange={(e) => setDishForm({ ...dishForm, nameFr: e.target.value })} className="mt-1 bg-white/[0.04] border-white/[0.08] text-white rounded-xl h-10 text-sm" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-white/60 text-xs">الوصف (عربي)</Label>
                <Textarea value={dishForm.descriptionAr || ""} onChange={(e) => setDishForm({ ...dishForm, descriptionAr: e.target.value })} className="mt-1 bg-white/[0.04] border-white/[0.08] text-white rounded-xl text-xs min-h-[60px]" />
              </div>
              <div>
                <Label className="text-white/60 text-xs">الوصف (فرنسي)</Label>
                <Textarea value={dishForm.descriptionFr || ""} onChange={(e) => setDishForm({ ...dishForm, descriptionFr: e.target.value })} className="mt-1 bg-white/[0.04] border-white/[0.08] text-white rounded-xl text-xs min-h-[60px]" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-white/60 text-xs">السعر</Label>
                <Input type="number" value={dishForm.price || 0} onChange={(e) => setDishForm({ ...dishForm, price: Number(e.target.value) })} className="mt-1 bg-white/[0.04] border-white/[0.08] text-white rounded-xl h-10 text-sm" />
              </div>
              <div>
                <Label className="text-white/60 text-xs">الفئة</Label>
                <Select value={dishForm.category} onValueChange={(val) => setDishForm({ ...dishForm, category: val })}>
                  <SelectTrigger className="mt-1 bg-white/[0.04] border-white/[0.08] text-white rounded-xl h-10 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1A1A1A] border-white/[0.08] text-white">
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id} className="focus:bg-white/[0.06] focus:text-white">{c.nameAr}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-white/60 text-xs">صورة الطبق</Label>
              <div className="flex items-center gap-3 mt-1">
                <div className="h-14 w-14 rounded-xl overflow-hidden border border-white/10 flex-shrink-0">
                  <img src={dishForm.image || ""} alt="Preview" className="w-full h-full object-cover" />
                </div>
                <div>
                  <Input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, "dish")} className="hidden" id="dish-image-upload" />
                  <Label htmlFor="dish-image-upload" className="cursor-pointer inline-flex items-center gap-1.5 bg-white/[0.04] hover:bg-white/[0.07] px-3 py-2 rounded-xl border border-white/[0.08] text-xs font-semibold text-white/70 hover:text-white transition-all">
                    <Upload className="h-3.5 w-3.5" /><span>رفع صورة</span>
                  </Label>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center justify-between">
                <Label className="text-white/60 text-xs">متوفر</Label>
                <Switch checked={dishForm.isAvailable} onCheckedChange={(v) => setDishForm({ ...dishForm, isAvailable: v })} className="data-[state=checked]:bg-[var(--primary)]" />
                              </div>
                              <div className="flex items-center justify-between">
                                <Label className="text-white/60 text-xs">جديد</Label>
                                <Switch checked={dishForm.isNew} onCheckedChange={(v) => setDishForm({ ...dishForm, isNew: v })} className="data-[state=checked]:bg-[var(--primary)]" />
                              </div>
                              <div className="flex items-center justify-between">
                                <Label className="text-white/60 text-xs">الأكثر طلباً</Label>
                                <Switch checked={dishForm.isBestSeller} onCheckedChange={(v) => setDishForm({ ...dishForm, isBestSeller: v })} className="data-[state=checked]:bg-[var(--primary)]" />
                              </div>
                              <div className="flex items-center justify-between">
                                <Label className="text-white/60 text-xs">نباتي</Label>
                                <Switch checked={dishForm.isVegetarian} onCheckedChange={(v) => setDishForm({ ...dishForm, isVegetarian: v })} className="data-[state=checked]:bg-[var(--primary)]" />
                              </div>
                              <div className="flex items-center justify-between">
                                <Label className="text-white/60 text-xs">حلال</Label>
                                <Switch checked={dishForm.isHalal} onCheckedChange={(v) => setDishForm({ ...dishForm, isHalal: v })} className="data-[state=checked]:bg-[var(--primary)]" />
                              </div>
                              <div className="flex items-center justify-between">
                                <Label className="text-white/60 text-xs">خالي من الغلوتين</Label>
                                <Switch checked={dishForm.isGlutenFree} onCheckedChange={(v) => setDishForm({ ...dishForm, isGlutenFree: v })} className="data-[state=checked]:bg-[var(--primary)]" />
                              </div>
                            </div>
                            <div className="flex items-center justify-between pt-2 border-t border-white/[0.06]">
                              <Label className="text-white/60 text-xs">عرض ترويجي</Label>
                              <Switch checked={dishForm.isPromo} onCheckedChange={(v) => setDishForm({ ...dishForm, isPromo: v })} className="data-[state=checked]:bg-[var(--primary)]" />
            </div>
            {dishForm.isPromo && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-white/60 text-xs">وسم العرض (عربي)</Label>
                  <Input value={dishForm.promoLabelAr || ""} onChange={(e) => setDishForm({ ...dishForm, promoLabelAr: e.target.value })} className="mt-1 bg-white/[0.04] border-white/[0.08] text-white rounded-xl h-10 text-sm" />
                </div>
                <div>
                  <Label className="text-white/60 text-xs">وسم العرض (فرنسي)</Label>
                  <Input value={dishForm.promoLabelFr || ""} onChange={(e) => setDishForm({ ...dishForm, promoLabelFr: e.target.value })} className="mt-1 bg-white/[0.04] border-white/[0.08] text-white rounded-xl h-10 text-sm" />
                </div>
                <div>
                  <Label className="text-white/60 text-xs">نص العرض (عربي)</Label>
                  <Input value={dishForm.promoTextAr || ""} onChange={(e) => setDishForm({ ...dishForm, promoTextAr: e.target.value })} className="mt-1 bg-white/[0.04] border-white/[0.08] text-white rounded-xl h-10 text-sm" />
                </div>
                <div>
                  <Label className="text-white/60 text-xs">نص العرض (فرنسي)</Label>
                  <Input value={dishForm.promoTextFr || ""} onChange={(e) => setDishForm({ ...dishForm, promoTextFr: e.target.value })} className="mt-1 bg-white/[0.04] border-white/[0.08] text-white rounded-xl h-10 text-sm" />
                </div>
              </div>
            )}
            <div className="flex gap-2 justify-end pt-2">
              <Button variant="ghost" onClick={() => setIsDishDialogOpen(false)} className="text-white/50 rounded-xl">إلغاء</Button>
              <Button onClick={saveDish} className="bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-black font-bold rounded-xl px-6">
                <Save className="h-4 w-4 ml-1.5" /><span>حفظ</span>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Category Dialog */}
      <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
        <DialogContent className="bg-[#1A1A1A] border-white/[0.08] text-white max-w-md rounded-2xl" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">{editingCategory ? "تعديل فئة" : "إضافة فئة جديدة"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label className="text-white/60 text-xs">الاسم (عربي)</Label>
              <Input value={categoryForm.nameAr || ""} onChange={(e) => setCategoryForm({ ...categoryForm, nameAr: e.target.value })} className="mt-1 bg-white/[0.04] border-white/[0.08] text-white rounded-xl h-10 text-sm" />
            </div>
            <div>
              <Label className="text-white/60 text-xs">الاسم (فرنسي)</Label>
              <Input value={categoryForm.nameFr || ""} onChange={(e) => setCategoryForm({ ...categoryForm, nameFr: e.target.value })} className="mt-1 bg-white/[0.04] border-white/[0.08] text-white rounded-xl h-10 text-sm" />
            </div>
            <div>
              <Label className="text-white/60 text-xs">الأيقونة</Label>
              <Select value={categoryForm.icon} onValueChange={(val) => setCategoryForm({ ...categoryForm, icon: val })}>
                <SelectTrigger className="mt-1 bg-white/[0.04] border-white/[0.08] text-white rounded-xl h-10 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1A1A1A] border-white/[0.08] text-white">
                  <SelectItem value="Utensils" className="focus:bg-white/[0.06] focus:text-white">🍽️ أدوات مائدة</SelectItem>
                  <SelectItem value="Beef" className="focus:bg-white/[0.06] focus:text-white">🥩 لحم</SelectItem>
                  <SelectItem value="Sandwich" className="focus:bg-white/[0.06] focus:text-white">🥪 ساندويتش</SelectItem>
                  <SelectItem value="Cake" className="focus:bg-white/[0.06] focus:text-white">🎂 حلويات</SelectItem>
                  <SelectItem value="Coffee" className="focus:bg-white/[0.06] focus:text-white">☕ مشروبات</SelectItem>
                  <SelectItem value="Sparkles" className="focus:bg-white/[0.06] focus:text-white">✨ مميز</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <Button variant="ghost" onClick={() => setIsCategoryDialogOpen(false)} className="text-white/50 rounded-xl">إلغاء</Button>
              <Button onClick={saveCategory} className="bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-black font-bold rounded-xl px-6">
                <Save className="h-4 w-4 ml-1.5" /><span>حفظ</span>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}