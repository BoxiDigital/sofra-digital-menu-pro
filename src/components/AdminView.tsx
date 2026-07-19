import React, { useState } from "react";
import { Dish, Category, RestaurantConfig } from "../types";
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
  AlertCircle
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
  onUpdateCategories: (categories: Category[]) => void;
  onUpdateDishes: (dishes: Dish[]) => void;
  onUpdateConfig: (config: RestaurantConfig) => void;
  onReset: () => void;
}

export default function AdminView({
  categories,
  dishes,
  config,
  onUpdateCategories,
  onUpdateDishes,
  onUpdateConfig,
  onReset,
}: AdminViewProps) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [email, setEmail] = useState("admin@sofra.com");
  const [password, setPassword] = useState("admin123");
  const { toast } = useToast();

  const [editingDish, setEditingDish] = useState<Dish | null>(null);
  const [dishForm, setDishForm] = useState<Partial<Dish>>({});
  const [isDishDialogOpen, setIsDishDialogOpen] = useState(false);

  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryForm, setCategoryForm] = useState<Partial<Category>>({});
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);

  const [configForm, setConfigForm] = useState<RestaurantConfig>({ ...config });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (email === "admin@sofra.com" && password === "admin123") {
      setIsLoggedIn(true);
      toast({
        title: "تم تسجيل الدخول بنجاح",
        description: "مرحباً بك في لوحة تحكم مطعم شِي نُو",
      });
    } else {
      toast({
        title: "خطأ في تسجيل الدخول",
        description: "البريد الإلكتروني أو كلمة المرور غير صحيحة",
        variant: "destructive",
      });
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, type: "dish" | "logo") => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      if (type === "dish") {
        setDishForm((prev) => ({ ...prev, image: base64String }));
      } else {
        setConfigForm((prev) => ({ ...prev, logoUrl: base64String }));
      }
      toast({
        title: "تم رفع الصورة بنجاح",
        description: "تم تحويل الصورة وحفظها محلياً",
      });
    };
    reader.readAsDataURL(file);
  };

  const openAddDish = () => {
    setEditingDish(null);
    setDishForm({
      nameAr: "",
      nameFr: "",
      descriptionAr: "",
      descriptionFr: "",
      price: 0,
      category: categories[0]?.id || "",
      image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80",
      isAvailable: true,
      isNew: false,
      isBestSeller: false,
      isVegetarian: false,
      isHalal: true,
      isGlutenFree: false,
    });
    setIsDishDialogOpen(true);
  };

  const openEditDish = (dish: Dish) => {
    setEditingDish(dish);
    setDishForm({ ...dish });
    setIsDishDialogOpen(true);
  };

  const saveDish = () => {
    if (!dishForm.nameAr || !dishForm.nameFr || !dishForm.price) {
      toast({
        title: "تنبيه",
        description: "يرجى ملء جميع الحقول المطلوبة",
        variant: "destructive",
      });
      return;
    }

    let updatedDishes: Dish[];
    if (editingDish) {
      updatedDishes = dishes.map((d) => (d.id === editingDish.id ? (dishForm as Dish) : d));
      toast({ title: "تم التعديل", description: "تم تعديل الطبق بنجاح" });
    } else {
      const newDish: Dish = {
        ...(dishForm as Dish),
        id: `dish_${Date.now()}`,
      };
      updatedDishes = [...dishes, newDish];
      toast({ title: "تم الإضافة", description: "تم إضافة الطبق الجديد بنجاح" });
    }

    onUpdateDishes(updatedDishes);
    setIsDishDialogOpen(false);
  };

  const deleteDish = (id: string) => {
    if (confirm("هل أنت متأكد من حذف هذا الطبق؟")) {
      const updated = dishes.filter((d) => d.id !== id);
      onUpdateDishes(updated);
      toast({ title: "تم الحذف", description: "تم حذف الطبق بنجاح" });
    }
  };

  const toggleDishAvailability = (id: string, currentStatus: boolean) => {
    const updated = dishes.map((d) => d.id === id ? { ...d, isAvailable: !currentStatus } : d);
    onUpdateDishes(updated);
    toast({
      title: !currentStatus ? "تم تفعيل الطبق" : "تم تعطيل الطبق",
      description: !currentStatus ? "الطبق متوفر الآن للزبائن" : "الطبق غير متوفر حالياً (نفدت الكمية)",
    });
  };

  const updateDishPrice = (id: string, price: number) => {
    const updated = dishes.map((d) => d.id === id ? { ...d, price } : d);
    onUpdateDishes(updated);
  };

  const openAddCategory = () => {
    setEditingCategory(null);
    setCategoryForm({
      nameAr: "",
      nameFr: "",
      icon: "Utensils",
    });
    setIsCategoryDialogOpen(true);
  };

  const openEditCategory = (category: Category) => {
    setEditingCategory(category);
    setCategoryForm({ ...category });
    setIsCategoryDialogOpen(true);
  };

  const saveCategory = () => {
    if (!categoryForm.nameAr || !categoryForm.nameFr) {
      toast({
        title: "تنبيه",
        description: "يرجى ملء جميع الحقول المطلوبة",
        variant: "destructive",
      });
      return;
    }

    let updatedCategories: Category[];
    if (editingCategory) {
      updatedCategories = categories.map((c) => (c.id === editingCategory.id ? (categoryForm as Category) : c));
      toast({ title: "تم التعديل", description: "تم تعديل الفئة بنجاح" });
    } else {
      const newCategory: Category = {
        ...(categoryForm as Category),
        id: `cat_${Date.now()}`,
      };
      updatedCategories = [...categories, newCategory];
      toast({ title: "تم الإضافة", description: "تم إضافة الفئة الجديدة بنجاح" });
    }

    onUpdateCategories(updatedCategories);
    setIsCategoryDialogOpen(false);
  };

  const deleteCategory = (id: string) => {
    const hasDishes = dishes.some((d) => d.category === id);
    if (hasDishes) {
      toast({
        title: "لا يمكن الحذف",
        description: "هذه الفئة تحتوي على أطباق نشطة. يرجى نقل الأطباق أو حذفها أولاً.",
        variant: "destructive",
      });
      return;
    }

    if (confirm("هل أنت متأكد من حذف هذه الفئة؟")) {
      const updated = categories.filter((c) => c.id !== id);
      onUpdateCategories(updated);
      toast({ title: "تم الحذف", description: "تم حذف الفئة بنجاح" });
    }
  };

  const saveConfig = () => {
    onUpdateConfig(configForm);
    toast({
      title: "تم حفظ الإعدادات",
      description: "تم تحديث معلومات المطعم والألوان بنجاح",
    });
  };

  const downloadQRCode = async () => {
    const currentUrl = window.location.origin;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(currentUrl)}`;
    
    try {
      const response = await fetch(qrUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${config.nameAr}-QR.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast({
        title: "تم تحميل رمز QR",
        description: "تم حفظ رمز QR الخاص بقائمتك بنجاح",
      });
    } catch (error) {
      window.open(qrUrl, "_blank");
    }
  };

  // ─── LOGIN SCREEN ───
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0D0D0D] px-4 py-12" dir="rtl">
        <div className="max-w-md w-full space-y-8 bg-white/[0.03] p-8 rounded-2xl border border-white/[0.06] backdrop-blur-sm">
          <div className="text-center">
            <div className="mx-auto h-14 w-14 rounded-2xl bg-[#C8A24D]/15 flex items-center justify-center text-[#C8A24D] mb-5 border border-[#C8A24D]/20">
              <Lock className="h-7 w-7" />
            </div>
            <h2 className="text-2xl font-extrabold text-white">لوحة تحكم المدير</h2>
            <p className="mt-2 text-sm text-white/40">
              سجل الدخول لإدارة قائمة الطعام وتخصيص المظهر
            </p>
          </div>

          <form className="mt-8 space-y-5" onSubmit={handleLogin}>
            <div className="space-y-4">
              <div>
                <Label className="text-white/70 text-sm">البريد الإلكتروني</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1.5 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/25 rounded-xl h-11"
                  placeholder="admin@sofra.com"
                />
              </div>
              <div>
                <Label className="text-white/70 text-sm">كلمة المرور</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1.5 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/25 rounded-xl h-11"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="bg-[#C8A24D]/10 border border-[#C8A24D]/20 rounded-xl p-3.5 text-xs text-[#C8A24D] flex items-start gap-2.5">
              <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">بيانات الدخول التجريبية:</span>
                <br />
                البريد: <code className="font-mono text-white/60">admin@sofra.com</code>
                <br />
                الرمز: <code className="font-mono text-white/60">admin123</code>
              </div>
            </div>

            <Button type="submit" className="w-full py-6 bg-[#C8A24D] hover:bg-[#D4B35D] text-black font-bold rounded-xl text-base">
              تسجيل الدخول
            </Button>
          </form>
        </div>
      </div>
    );
  }

  // ─── MAIN ADMIN PANEL ───
  return (
    <div className="min-h-screen bg-[#0D0D0D] pb-12" dir="rtl">
      {/* Header */}
      <header className="bg-white/[0.02] border-b border-white/[0.06] sticky top-0 z-40 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-[#C8A24D]/15 flex items-center justify-center text-[#C8A24D] border border-[#C8A24D]/20">
              <Settings className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-base font-bold text-white">لوحة إدارة شِي نُو</h1>
              <p className="text-xs text-white/35">تعديل فوري لقائمة الطعام والمظهر</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-white/30 hidden sm:block">مرحباً، مدير المطعم</span>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl"
              onClick={() => setIsLoggedIn(false)}
            >
              <LogOut className="h-4 w-4 ml-1.5" />
              <span>خروج</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <Tabs defaultValue="dishes" className="space-y-6">
          <TabsList className="bg-white/[0.03] border border-white/[0.06] p-1 rounded-2xl w-full max-w-lg flex">
            <TabsTrigger 
              value="dishes" 
              className="flex-1 py-2.5 rounded-xl font-bold text-sm data-[state=active]:bg-[#C8A24D] data-[state=active]:text-black data-[state=inactive]:text-white/40 data-[state=inactive]:hover:text-white/70 transition-all"
            >
              الأطباق
            </TabsTrigger>
            <TabsTrigger 
              value="categories" 
              className="flex-1 py-2.5 rounded-xl font-bold text-sm data-[state=active]:bg-[#C8A24D] data-[state=active]:text-black data-[state=inactive]:text-white/40 data-[state=inactive]:hover:text-white/70 transition-all"
            >
              الفئات
            </TabsTrigger>
            <TabsTrigger 
              value="settings" 
              className="flex-1 py-2.5 rounded-xl font-bold text-sm data-[state=active]:bg-[#C8A24D] data-[state=active]:text-black data-[state=inactive]:text-white/40 data-[state=inactive]:hover:text-white/70 transition-all"
            >
              الإعدادات
            </TabsTrigger>
          </TabsList>

          {/* ═══════ DISHES TAB ═══════ */}
          <TabsContent value="dishes" className="space-y-5">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-white">إدارة الأطباق</h2>
                <p className="text-xs text-white/35 mt-0.5">{dishes.length} طبق في القائمة</p>
              </div>
              <Button onClick={openAddDish} className="bg-[#C8A24D] hover:bg-[#D4B35D] text-black font-bold rounded-xl h-10 px-4">
                <Plus className="h-4 w-4 ml-1.5" />
                <span>إضافة طبق</span>
              </Button>
            </div>

            <div className="space-y-1.5">
              {dishes.map((dish) => {
                const cat = categories.find((c) => c.id === dish.category);
                return (
                  <div key={dish.id} className="bg-white/[0.03] p-3 rounded-2xl border border-white/[0.06] flex items-center justify-between hover:border-white/[0.10] transition-all gap-3">
                    {/* Right: Thumbnail + Info */}
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="h-12 w-12 rounded-xl overflow-hidden flex-shrink-0 border border-white/10">
                        <img src={dish.image} alt={dish.nameAr} className="w-full h-full object-cover" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold text-white text-sm truncate">{dish.nameAr}</h3>
                          {dish.isPromo && (
                            <Badge className="bg-[#C8A24D]/20 text-[#C8A24D] border-0 text-[10px] font-bold px-1.5 py-0 rounded-full">
                              عرض
                            </Badge>
                          )}
                          {cat && (
                            <span className="text-[10px] text-white/35">({cat.nameAr})</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[#C8A24D] font-bold text-sm">{dish.price} {config.currencyAr}</span>
                          <span className={`text-[10px] font-medium ${dish.isAvailable ? "text-emerald-400/70" : "text-red-400/70"}`}>
                            {dish.isAvailable ? "متوفر" : "غير متوفر"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Left: Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Switch
                        checked={dish.isAvailable}
                        onCheckedChange={() => toggleDishAvailability(dish.id, dish.isAvailable)}
                        className="data-[state=checked]:bg-[#C8A24D]"
                      />
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-[#C8A24D] hover:text-[#D4B35D] hover:bg-white/5 rounded-lg" onClick={() => openEditDish(dish)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg" onClick={() => deleteDish(dish.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </TabsContent>

          {/* ═══════ CATEGORIES TAB ═══════ */}
          <TabsContent value="categories" className="space-y-5">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-white">إدارة الفئات</h2>
                <p className="text-xs text-white/35 mt-0.5">{categories.length} فئة</p>
              </div>
              <Button onClick={openAddCategory} className="bg-[#C8A24D] hover:bg-[#D4B35D] text-black font-bold rounded-xl h-10 px-4">
                <Plus className="h-4 w-4 ml-1.5" />
                <span>إضافة فئة</span>
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories.map((cat) => {
                const IconComponent = iconMap[cat.icon] || Utensils;
                const dishCount = dishes.filter((d) => d.category === cat.id).length;
                return (
                  <div key={cat.id} className="bg-white/[0.03] p-4 rounded-2xl border border-white/[0.06] flex items-center justify-between hover:border-white/[0.10] transition-all">
                    <div className="flex items-center gap-3">
                      <div className="h-11 w-11 rounded-xl bg-[#C8A24D]/10 flex items-center justify-center text-[#C8A24D] border border-[#C8A24D]/20">
                        <IconComponent className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-white text-sm">{cat.nameAr}</h3>
                        <p className="text-xs text-white/35">{cat.nameFr} • {dishCount} أطباق</p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-[#C8A24D] hover:text-[#D4B35D] hover:bg-white/5 rounded-lg" onClick={() => openEditCategory(cat)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg" onClick={() => deleteCategory(cat.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </TabsContent>

          {/* ═══════ SETTINGS TAB ═══════ */}
          <TabsContent value="settings" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Config Form */}
            <div className="lg:col-span-2 bg-white/[0.03] p-6 rounded-2xl border border-white/[0.06] space-y-6">
              <div className="border-b border-white/[0.06] pb-4">
                <h2 className="text-lg font-bold text-white">تخصيص معلومات ومظهر المطعم</h2>
                <p className="text-xs text-white/35 mt-1">قم بتعديل الاسم، الألوان، ومعلومات الاتصال</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-white/60 text-xs">اسم المطعم (بالعربية)</Label>
                  <Input
                    value={configForm.nameAr}
                    onChange={(e) => setConfigForm({ ...configForm, nameAr: e.target.value })}
                    className="mt-1.5 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/20 rounded-xl h-10 text-sm"
                  />
                </div>
                <div>
                  <Label className="text-white/60 text-xs">اسم المطعم (بالفرنسية)</Label>
                  <Input
                    value={configForm.nameFr}
                    onChange={(e) => setConfigForm({ ...configForm, nameFr: e.target.value })}
                    className="mt-1.5 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/20 rounded-xl h-10 text-sm"
                  />
                </div>
                <div>
                  <Label className="text-white/60 text-xs">الشعار (بالعربية)</Label>
                  <Input
                    value={configForm.sloganAr}
                    onChange={(e) => setConfigForm({ ...configForm, sloganAr: e.target.value })}
                    className="mt-1.5 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/20 rounded-xl h-10 text-sm"
                  />
                </div>
                <div>
                  <Label className="text-white/60 text-xs">الشعار (بالفرنسية)</Label>
                  <Input
                    value={configForm.sloganFr}
                    onChange={(e) => setConfigForm({ ...configForm, sloganFr: e.target.value })}
                    className="mt-1.5 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/20 rounded-xl h-10 text-sm"
                  />
                </div>
                <div>
                  <Label className="text-white/60 text-xs">ساعات العمل (بالعربية)</Label>
                  <Input
                    value={configForm.workingHoursAr}
                    onChange={(e) => setConfigForm({ ...configForm, workingHoursAr: e.target.value })}
                    className="mt-1.5 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/20 rounded-xl h-10 text-sm"
                  />
                </div>
                <div>
                  <Label className="text-white/60 text-xs">ساعات العمل (بالفرنسية)</Label>
                  <Input
                    value={configForm.workingHoursFr}
                    onChange={(e) => setConfigForm({ ...configForm, workingHoursFr: e.target.value })}
                    className="mt-1.5 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/20 rounded-xl h-10 text-sm"
                  />
                </div>
                <div>
                  <Label className="text-white/60 text-xs">رقم واتساب (مع رمز الدولة)</Label>
                  <Input
                    value={configForm.whatsappNumber}
                    onChange={(e) => setConfigForm({ ...configForm, whatsappNumber: e.target.value })}
                    className="mt-1.5 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/20 rounded-xl h-10 text-sm"
                    placeholder="212600000000"
                  />
                </div>
                <div>
                  <Label className="text-white/60 text-xs">العملة</Label>
                  <div className="grid grid-cols-2 gap-2 mt-1.5">
                    <Input
                      value={configForm.currencyAr}
                      onChange={(e) => setConfigForm({ ...configForm, currencyAr: e.target.value })}
                      className="bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/20 rounded-xl h-10 text-sm"
                      placeholder="درهم"
                    />
                    <Input
                      value={configForm.currencyFr}
                      onChange={(e) => setConfigForm({ ...configForm, currencyFr: e.target.value })}
                      className="bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/20 rounded-xl h-10 text-sm"
                      placeholder="MAD"
                    />
                  </div>
                </div>
              </div>

              {/* Color & Background */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-4 border-t border-white/[0.06]">
                <div>
                  <Label className="text-white/60 text-xs">اللون الرئيسي</Label>
                  <div className="flex gap-3 items-center mt-2">
                    <Input
                      type="color"
                      value={configForm.primaryColor}
                      onChange={(e) => setConfigForm({ ...configForm, primaryColor: e.target.value })}
                      className="w-12 h-10 p-1 rounded-xl cursor-pointer border-white/10 bg-transparent"
                    />
                    <Input
                      type="text"
                      value={configForm.primaryColor}
                      onChange={(e) => setConfigForm({ ...configForm, primaryColor: e.target.value })}
                      className="font-mono bg-white/[0.04] border-white/[0.08] text-white rounded-xl h-10 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-white/60 text-xs">نمط الخلفية</Label>
                  <Select
                    value={configForm.backgroundColor}
                    onValueChange={(val: any) => setConfigForm({ ...configForm, backgroundColor: val })}
                  >
                    <SelectTrigger className="mt-2 bg-white/[0.04] border-white/[0.08] text-white rounded-xl h-10 text-sm">
                      <SelectValue placeholder="اختر نمط الخلفية" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1A1A1A] border-white/[0.08] text-white">
                      <SelectItem value="dark" className="focus:bg-white/[0.06] focus:text-white">مظلم وعصري (موصى به)</SelectItem>
                      <SelectItem value="cream" className="focus:bg-white/[0.06] focus:text-white">كريمي دافئ</SelectItem>
                      <SelectItem value="white" className="focus:bg-white/[0.06] focus:text-white">أبيض ناصع</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Logo Upload */}
              <div className="space-y-2 pt-4 border-t border-white/[0.06]">
                <Label className="text-white/60 text-xs">شعار المطعم (صورة)</Label>
                <div className="flex items-center gap-4 mt-1">
                  <div className="h-16 w-16 rounded-2xl border border-white/[0.08] overflow-hidden bg-white/[0.02] flex items-center justify-center flex-shrink-0">
                    <img src={configForm.logoUrl} alt="Logo Preview" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, "logo")}
                      className="hidden"
                      id="logo-upload"
                    />
                    <Label htmlFor="logo-upload" className="cursor-pointer inline-flex items-center gap-2 bg-white/[0.04] hover:bg-white/[0.07] px-4 py-2.5 rounded-xl border border-white/[0.08] text-sm font-semibold text-white/70 hover:text-white transition-all">
                      <Upload className="h-4 w-4" />
                      <span>رفع شعار جديد</span>
                    </Label>
                    <p className="text-xs text-white/25 mt-1.5">يمكنك رفع صورة مباشرة من جهازك وحفظها محلياً</p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-4 border-t border-white/[0.06]">
                <Button onClick={saveConfig} className="bg-[#C8A24D] hover:bg-[#D4B35D] text-black font-bold px-6 h-11 rounded-xl">
                  <Save className="h-4 w-4 ml-1.5" />
                  <span>حفظ جميع التغييرات</span>
                </Button>
                <Button variant="ghost" onClick={onReset} className="text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl">
                  <RefreshCw className="h-4 w-4 ml-1.5" />
                  <span>إعادة تعيين البيانات الافتراضية</span>
                </Button>
              </div>
            </div>

            {/* QR Code Card */}
            <div className="bg-white/[0.03] p-6 rounded-2xl border border-white/[0.06] flex flex-col items-center text-center h-fit space-y-6">
              <div>
                <div className="mx-auto h-12 w-12 rounded-xl bg-[#C8A24D]/10 flex items-center justify-center text-[#C8A24D] mb-4 border border-[#C8A24D]/20">
                  <QrCode className="h-6 w-6" />
                </div>
                <h3 className="text-base font-bold text-white">رمز QR للقائمة</h3>
                <p className="text-xs text-white/35 mt-1.5 leading-relaxed">
                  اطبع هذا الرمز وضعه على طاولات المطعم ليتمكن الزبائن من مسحه وفتح المنيو
                </p>
              </div>

              <div className="bg-white/[0.02] p-4 rounded-2xl border border-dashed border-white/[0.08]">
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(window.location.origin)}&color=C8A24D&bgcolor=0D0D0D`} 
                  alt="QR Code" 
                  className="w-44 h-44 mx-auto"
                />
              </div>

              <Button onClick={downloadQRCode} className="w-full py-5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-900/20">
                <Download className="h-4 w-4 ml-1.5" />
                <span>تنزيل رمز QR</span>
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* ═══════ DISH DIALOG ═══════ */}
      <Dialog open={isDishDialogOpen} onOpenChange={setIsDishDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto bg-[#141414] border-white/[0.08] text-white rounded-2xl" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-white">
              {editingDish ? "تعديل طبق" : "إضافة طبق جديد"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-white/60 text-xs">الاسم (بالعربية) *</Label>
                <Input
                  value={dishForm.nameAr || ""}
                  onChange={(e) => setDishForm({ ...dishForm, nameAr: e.target.value })}
                  className="mt-1.5 bg-white/[0.04] border-white/[0.08] text-white rounded-xl h-10 text-sm"
                />
              </div>
              <div>
                <Label className="text-white/60 text-xs">الاسم (بالفرنسية) *</Label>
                <Input
                  value={dishForm.nameFr || ""}
                  onChange={(e) => setDishForm({ ...dishForm, nameFr: e.target.value })}
                  className="mt-1.5 bg-white/[0.04] border-white/[0.08] text-white rounded-xl h-10 text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-white/60 text-xs">السعر *</Label>
                <Input
                  type="number"
                  value={dishForm.price || ""}
                  onChange={(e) => setDishForm({ ...dishForm, price: parseFloat(e.target.value) || 0 })}
                  className="mt-1.5 bg-white/[0.04] border-white/[0.08] text-white rounded-xl h-10 text-sm"
                />
              </div>
              <div>
                <Label className="text-white/60 text-xs">الفئة *</Label>
                <Select
                  value={dishForm.category}
                  onValueChange={(val) => setDishForm({ ...dishForm, category: val })}
                >
                  <SelectTrigger className="mt-1.5 bg-white/[0.04] border-white/[0.08] text-white rounded-xl h-10 text-sm">
                    <SelectValue placeholder="اختر الفئة" />
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
              <Label className="text-white/60 text-xs">الوصف (بالعربية)</Label>
              <Textarea
                value={dishForm.descriptionAr || ""}
                onChange={(e) => setDishForm({ ...dishForm, descriptionAr: e.target.value })}
                className="mt-1.5 bg-white/[0.04] border-white/[0.08] text-white rounded-xl text-sm"
                rows={3}
              />
            </div>

            <div>
              <Label className="text-white/60 text-xs">الوصف (بالفرنسية)</Label>
              <Textarea
                value={dishForm.descriptionFr || ""}
                onChange={(e) => setDishForm({ ...dishForm, descriptionFr: e.target.value })}
                className="mt-1.5 bg-white/[0.04] border-white/[0.08] text-white rounded-xl text-sm"
                rows={3}
              />
            </div>

            <div>
              <Label className="text-white/60 text-xs">صورة الطبق</Label>
              <div className="flex items-center gap-4 mt-1.5">
                <div className="h-16 w-24 rounded-xl border border-white/[0.08] overflow-hidden bg-white/[0.02] flex items-center justify-center flex-shrink-0">
                  <img src={dishForm.image} alt="Dish Preview" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 space-y-2">
                  <Input
                    type="text"
                    value={dishForm.image || ""}
                    onChange={(e) => setDishForm({ ...dishForm, image: e.target.value })}
                    placeholder="رابط الصورة (URL)"
                    className="bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/25 rounded-xl h-9 text-xs"
                  />
                  <div className="flex items-center gap-2">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, "dish")}
                      className="hidden"
                      id="dish-image-upload"
                    />
                    <Label htmlFor="dish-image-upload" className="cursor-pointer inline-flex items-center gap-1.5 bg-white/[0.04] hover:bg-white/[0.07] px-3 py-1.5 rounded-lg border border-white/[0.08] text-xs font-semibold text-white/60 hover:text-white transition-all">
                      <Upload className="h-3.5 w-3.5" />
                      <span>رفع من الجهاز</span>
                    </Label>
                  </div>
                </div>
              </div>
            </div>

            {/* Badges + Promo */}
            <div className="border-t border-white/[0.06] pt-4 space-y-3">
              <Label className="text-white/60 text-xs font-bold block">الشارات (اختياري)</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={dishForm.isNew || false}
                    onCheckedChange={(checked) => setDishForm({ ...dishForm, isNew: checked })}
                    className="data-[state=checked]:bg-[#C8A24D]"
                  />
                  <span className="text-xs text-white/60">جديد</span>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={dishForm.isBestSeller || false}
                    onCheckedChange={(checked) => setDishForm({ ...dishForm, isBestSeller: checked })}
                    className="data-[state=checked]:bg-[#C8A24D]"
                  />
                  <span className="text-xs text-white/60">الأكثر طلباً</span>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={dishForm.isVegetarian || false}
                    onCheckedChange={(checked) => setDishForm({ ...dishForm, isVegetarian: checked })}
                    className="data-[state=checked]:bg-[#C8A24D]"
                  />
                  <span className="text-xs text-white/60">نباتي</span>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={dishForm.isHalal || false}
                    onCheckedChange={(checked) => setDishForm({ ...dishForm, isHalal: checked })}
                    className="data-[state=checked]:bg-[#C8A24D]"
                  />
                  <span className="text-xs text-white/60">حلال</span>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={dishForm.isGlutenFree || false}
                    onCheckedChange={(checked) => setDishForm({ ...dishForm, isGlutenFree: checked })}
                    className="data-[state=checked]:bg-[#C8A24D]"
                  />
                  <span className="text-xs text-white/60">خالي من الغلوتين</span>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={dishForm.isPromo || false}
                    onCheckedChange={(checked) => setDishForm({ ...dishForm, isPromo: checked })}
                    className="data-[state=checked]:bg-[#C8A24D]"
                  />
                  <span className="text-xs text-[#C8A24D] font-bold">عرض ترويجي</span>
                </div>
              </div>
            </div>

            {/* Promo fields */}
            {dishForm.isPromo && (
              <div className="border-t border-[#C8A24D]/20 pt-4 space-y-3 bg-[#C8A24D]/5 -mx-0 px-3 py-3 rounded-xl">
                <Label className="text-[#C8A24D] text-xs font-bold">تفاصيل العرض الترويجي</Label>
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    value={dishForm.promoLabelAr || ""}
                    onChange={(e) => setDishForm({ ...dishForm, promoLabelAr: e.target.value })}
                    placeholder="الشارة (بالعربية)"
                    className="bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/25 rounded-xl h-9 text-xs"
                  />
                  <Input
                    value={dishForm.promoLabelFr || ""}
                    onChange={(e) => setDishForm({ ...dishForm, promoLabelFr: e.target.value })}
                    placeholder="الشارة (بالفرنسية)"
                    className="bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/25 rounded-xl h-9 text-xs"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    value={dishForm.promoTextAr || ""}
                    onChange={(e) => setDishForm({ ...dishForm, promoTextAr: e.target.value })}
                    placeholder="نص العرض (بالعربية)"
                    className="bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/25 rounded-xl h-9 text-xs"
                  />
                  <Input
                    value={dishForm.promoTextFr || ""}
                    onChange={(e) => setDishForm({ ...dishForm, promoTextFr: e.target.value })}
                    placeholder="نص العرض (بالفرنسية)"
                    className="bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/25 rounded-xl h-9 text-xs"
                  />
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t border-white/[0.06]">
              <Button variant="ghost" onClick={() => setIsDishDialogOpen(false)} className="text-white/50 hover:text-white hover:bg-white/5 rounded-xl">إلغاء</Button>
              <Button onClick={saveDish} className="bg-[#C8A24D] hover:bg-[#D4B35D] text-black font-bold rounded-xl px-5">حفظ الطبق</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ═══════ CATEGORY DIALOG ═══════ */}
      <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
        <DialogContent className="max-w-md bg-[#141414] border-white/[0.08] text-white rounded-2xl" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-white">
              {editingCategory ? "تعديل الفئة" : "إضافة فئة جديدة"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label className="text-white/60 text-xs">اسم الفئة (بالعربية) *</Label>
              <Input
                value={categoryForm.nameAr || ""}
                onChange={(e) => setCategoryForm({ ...categoryForm, nameAr: e.target.value })}
                className="mt-1.5 bg-white/[0.04] border-white/[0.08] text-white rounded-xl h-10 text-sm"
              />
            </div>

            <div>
              <Label className="text-white/60 text-xs">اسم الفئة (بالفرنسية) *</Label>
              <Input
                value={categoryForm.nameFr || ""}
                onChange={(e) => setCategoryForm({ ...categoryForm, nameFr: e.target.value })}
                className="mt-1.5 bg-white/[0.04] border-white/[0.08] text-white rounded-xl h-10 text-sm"
              />
            </div>

            <div>
              <Label className="text-white/60 text-xs">أيقونة الفئة</Label>
              <Select
                value={categoryForm.icon}
                onValueChange={(val) => setCategoryForm({ ...categoryForm, icon: val })}
              >
                <SelectTrigger className="mt-1.5 bg-white/[0.04] border-white/[0.08] text-white rounded-xl h-10 text-sm">
                  <SelectValue placeholder="اختر الأيقونة" />
                </SelectTrigger>
                <SelectContent className="bg-[#1A1A1A] border-white/[0.08] text-white">
                  <SelectItem value="Sparkles" className="focus:bg-white/[0.06] focus:text-white">أطباق اليوم (نجوم)</SelectItem>
                  <SelectItem value="Utensils" className="focus:bg-white/[0.06] focus:text-white">مقبلات (شوكة وسكين)</SelectItem>
                  <SelectItem value="Beef" className="focus:bg-white/[0.06] focus:text-white">أطباق رئيسية (لحم)</SelectItem>
                  <SelectItem value="Sandwich" className="focus:bg-white/[0.06] focus:text-white">وجبات خفيفة (ساندويتش)</SelectItem>
                  <SelectItem value="Cake" className="focus:bg-white/[0.06] focus:text-white">حلويات (كعكة)</SelectItem>
                  <SelectItem value="Coffee" className="focus:bg-white/[0.06] focus:text-white">مشروبات (كوب قهوة)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-white/[0.06]">
              <Button variant="ghost" onClick={() => setIsCategoryDialogOpen(false)} className="text-white/50 hover:text-white hover:bg-white/5 rounded-xl">إلغاء</Button>
              <Button onClick={saveCategory} className="bg-[#C8A24D] hover:bg-[#D4B35D] text-black font-bold rounded-xl px-5">حفظ الفئة</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}