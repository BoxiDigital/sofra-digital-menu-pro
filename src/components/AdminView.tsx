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

// Map icon names to Lucide components
const iconMap: Record<string, React.ComponentType<any>> = {
  Sparkles: Sparkles,
  Utensils: Utensils,
  Beef: Beef,
  Cake: Cake,
  Coffee: Coffee,
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

  // Form states for Dish
  const [editingDish, setEditingDish] = useState<Dish | null>(null);
  const [dishForm, setDishForm] = useState<Partial<Dish>>({});
  const [isDishDialogOpen, setIsDishDialogOpen] = useState(false);

  // Form states for Category
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryForm, setCategoryForm] = useState<Partial<Category>>({});
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);

  // Config form state
  const [configForm, setConfigForm] = useState<RestaurantConfig>({ ...config });

  // Handle Login
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (email === "admin@sofra.com" && password === "admin123") {
      setIsLoggedIn(true);
      toast({
        title: "تم تسجيل الدخول بنجاح",
        description: "مرحباً بك في لوحة تحكم مطعم سفرة",
      });
    } else {
      toast({
        title: "خطأ في تسجيل الدخول",
        description: "البريد الإلكتروني أو كلمة المرور غير صحيحة",
        variant: "destructive",
      });
    }
  };

  // Handle Image Upload (Base64)
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

  // Dish CRUD
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

  // Category CRUD
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
    // Check if category has dishes
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

  // Save Config
  const saveConfig = () => {
    onUpdateConfig(configForm);
    toast({
      title: "تم حفظ الإعدادات",
      description: "تم تحديث معلومات المطعم والألوان بنجاح",
    });
  };

  // Download QR Code
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
      // Fallback: open in new tab
      window.open(qrUrl, "_blank");
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12" dir="rtl">
        <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 mb-4">
              <Lock className="h-6 w-6" />
            </div>
            <h2 className="text-3xl font-extrabold text-gray-900">لوحة تحكم المدير</h2>
            <p className="mt-2 text-sm text-gray-600">
              سجل الدخول لإدارة قائمة الطعام وتخصيص المظهر
            </p>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleLogin}>
            <div className="rounded-md shadow-sm space-y-4">
              <div>
                <Label htmlFor="email">البريد الإلكتروني</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1"
                  placeholder="admin@sofra.com"
                />
              </div>
              <div>
                <Label htmlFor="password">كلمة المرور</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">بيانات الدخول التجريبية:</span>
                <br />
                البريد: <code className="font-mono">admin@sofra.com</code>
                <br />
                الرمز: <code className="font-mono">admin123</code>
              </div>
            </div>

            <div>
              <Button type="submit" className="w-full py-6 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-md">
                تسجيل الدخول
              </Button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-12" dir="rtl">
      {/* Admin Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
              <Settings className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">لوحة إدارة سفرة</h1>
              <p className="text-xs text-gray-500">تعديل فوري لقائمة الطعام والمظهر</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="text-red-600 border-red-200 hover:bg-red-50"
              onClick={() => setIsLoggedIn(false)}
            >
              <LogOut className="h-4 w-4 ml-1" />
              <span>خروج</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <Tabs defaultValue="dishes" className="space-y-6">
          <TabsList className="bg-white border border-gray-200 p-1 rounded-xl w-full max-w-md flex">
            <TabsTrigger value="dishes" className="flex-1 py-2.5 rounded-lg font-bold">الأطباق</TabsTrigger>
            <TabsTrigger value="categories" className="flex-1 py-2.5 rounded-lg font-bold">الفئات</TabsTrigger>
            <TabsTrigger value="settings" className="flex-1 py-2.5 rounded-lg font-bold">الإعدادات والمظهر</TabsTrigger>
          </TabsList>

          {/* DISHES TAB */}
          <TabsContent value="dishes" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">إدارة الأطباق ({dishes.length})</h2>
              <Button onClick={openAddDish} className="bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl">
                <Plus className="h-4 w-4 ml-1" />
                <span>إضافة طبق جديد</span>
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {dishes.map((dish) => {
                const cat = categories.find((c) => c.id === dish.category);
                return (
                  <div key={dish.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs flex flex-col justify-between">
                    <div>
                      <div className="relative h-48 bg-gray-100">
                        <img src={dish.image} alt={dish.nameAr} className="w-full h-full object-cover" />
                        <div className="absolute top-3 right-3 flex gap-1">
                          <Badge className={dish.isAvailable ? "bg-green-600" : "bg-red-600"}>
                            {dish.isAvailable ? "متوفر" : "غير متوفر"}
                          </Badge>
                          {cat && (
                            <Badge variant="outline" className="bg-white/90 text-gray-800 border-gray-200">
                              {cat.nameAr}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="p-4 space-y-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-bold text-lg text-gray-900">{dish.nameAr}</h3>
                            <p className="text-xs text-gray-500 font-mono">{dish.nameFr}</p>
                          </div>
                          <div className="flex items-center gap-1">
                            <Input
                              type="number"
                              value={dish.price}
                              onChange={(e) => updateDishPrice(dish.id, parseFloat(e.target.value) || 0)}
                              className="w-20 text-center font-bold h-8 px-1"
                            />
                            <span className="text-xs font-bold text-gray-500">{config.currencyAr}</span>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 line-clamp-2">{dish.descriptionAr}</p>
                      </div>
                    </div>

                    <div className="p-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-gray-500">حالة التوفر:</span>
                        <Switch
                          checked={dish.isAvailable}
                          onCheckedChange={() => toggleDishAvailability(dish.id, dish.isAvailable)}
                        />
                      </div>
                      <div className="flex gap-1">
                        <Button size="icon" variant="outline" className="h-8 w-8 text-blue-600" onClick={() => openEditDish(dish)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="outline" className="h-8 w-8 text-red-600" onClick={() => deleteDish(dish.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </TabsContent>

          {/* CATEGORIES TAB */}
          <TabsContent value="categories" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">إدارة الفئات ({categories.length})</h2>
              <Button onClick={openAddCategory} className="bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl">
                <Plus className="h-4 w-4 ml-1" />
                <span>إضافة فئة جديدة</span>
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories.map((cat) => {
                const IconComponent = iconMap[cat.icon] || Utensils;
                const dishCount = dishes.filter((d) => d.category === cat.id).length;
                return (
                  <div key={cat.id} className="bg-white p-4 rounded-2xl border border-gray-200 flex items-center justify-between shadow-xs">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
                        <IconComponent className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900">{cat.nameAr}</h3>
                        <p className="text-xs text-gray-500">{cat.nameFr} • {dishCount} أطباق</p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-blue-600" onClick={() => openEditCategory(cat)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-red-600" onClick={() => deleteCategory(cat.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </TabsContent>

          {/* SETTINGS TAB */}
          <TabsContent value="settings" className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Config Form */}
            <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-6">
              <h2 className="text-xl font-bold text-gray-900 border-b pb-3">تخصيص معلومات ومظهر المطعم</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>اسم المطعم (بالعربية)</Label>
                  <Input
                    value={configForm.nameAr}
                    onChange={(e) => setConfigForm({ ...configForm, nameAr: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>اسم المطعم (بالفرنسية)</Label>
                  <Input
                    value={configForm.nameFr}
                    onChange={(e) => setConfigForm({ ...configForm, nameFr: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>شعار المطعم (بالعربية)</Label>
                  <Input
                    value={configForm.sloganAr}
                    onChange={(e) => setConfigForm({ ...configForm, sloganAr: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>شعار المطعم (بالفرنسية)</Label>
                  <Input
                    value={configForm.sloganFr}
                    onChange={(e) => setConfigForm({ ...configForm, sloganFr: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>ساعات العمل (بالعربية)</Label>
                  <Input
                    value={configForm.workingHoursAr}
                    onChange={(e) => setConfigForm({ ...configForm, workingHoursAr: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>ساعات العمل (بالفرنسية)</Label>
                  <Input
                    value={configForm.workingHoursFr}
                    onChange={(e) => setConfigForm({ ...configForm, workingHoursFr: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>رقم واتساب للطلبات (مع رمز الدولة بدون +)</Label>
                  <Input
                    value={configForm.whatsappNumber}
                    onChange={(e) => setConfigForm({ ...configForm, whatsappNumber: e.target.value })}
                    className="mt-1"
                    placeholder="966500000000"
                  />
                </div>
                <div>
                  <Label>العملة (مثال: ر.س أو €)</Label>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <Input
                      value={configForm.currencyAr}
                      onChange={(e) => setConfigForm({ ...configForm, currencyAr: e.target.value })}
                      placeholder="ر.س"
                    />
                    <Input
                      value={configForm.currencyFr}
                      onChange={(e) => setConfigForm({ ...configForm, currencyFr: e.target.value })}
                      placeholder="SAR"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
                <div>
                  <Label>اللون الرئيسي للمنيو</Label>
                  <div className="flex gap-3 items-center mt-2">
                    <Input
                      type="color"
                      value={configForm.primaryColor}
                      onChange={(e) => setConfigForm({ ...configForm, primaryColor: e.target.value })}
                      className="w-16 h-10 p-1 rounded-lg cursor-pointer"
                    />
                    <Input
                      type="text"
                      value={configForm.primaryColor}
                      onChange={(e) => setConfigForm({ ...configForm, primaryColor: e.target.value })}
                      className="font-mono"
                    />
                  </div>
                </div>

                <div>
                  <Label>نمط الخلفية</Label>
                  <Select
                    value={configForm.backgroundColor}
                    onValueChange={(val: any) => setConfigForm({ ...configForm, backgroundColor: val })}
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="اختر نمط الخلفية" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cream">كريمي دافئ (موصى به)</SelectItem>
                      <SelectItem value="white">أبيض ناصع</SelectItem>
                      <SelectItem value="dark">مظلم وعصري</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2 pt-4 border-t">
                <Label>شعار المطعم (صورة)</Label>
                <div className="flex items-center gap-4 mt-1">
                  <div className="h-16 w-16 rounded-full border overflow-hidden bg-gray-50 flex items-center justify-center">
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
                    <Label htmlFor="logo-upload" className="cursor-pointer inline-flex items-center gap-2 bg-gray-100 hover:bg-gray-200 px-4 py-2.5 rounded-xl border text-sm font-semibold">
                      <Upload className="h-4 w-4" />
                      <span>رفع شعار جديد</span>
                    </Label>
                    <p className="text-xs text-gray-500 mt-1">يمكنك رفع صورة مباشرة من جهازك وسيتم حفظها محلياً</p>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center pt-6 border-t">
                <Button onClick={saveConfig} className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-6 py-5 rounded-xl">
                  <Save className="h-4 w-4 ml-1" />
                  <span>حفظ التغييرات</span>
                </Button>
                <Button variant="ghost" onClick={onReset} className="text-red-600 hover:bg-red-50">
                  <RefreshCw className="h-4 w-4 ml-1" />
                  <span>إعادة تعيين البيانات الافتراضية</span>
                </Button>
              </div>
            </div>

            {/* QR Code Generator Card */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs flex flex-col items-center text-center justify-between h-fit space-y-6">
              <div>
                <div className="mx-auto h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 mb-4">
                  <QrCode className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">رمز QR الخاص بقائمتك</h3>
                <p className="text-xs text-gray-500 mt-1">
                  اطبع هذا الرمز وضعه على طاولات المطعم ليتمكن الزبائن من مسحه وفتح المنيو مباشرة
                </p>
              </div>

              <div className="bg-gray-50 p-4 rounded-2xl border border-dashed border-gray-200">
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(window.location.origin)}`} 
                  alt="QR Code" 
                  className="w-48 h-48 mx-auto"
                />
              </div>

              <Button onClick={downloadQRCode} className="w-full py-6 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md">
                <Download className="h-4 w-4 ml-1" />
                <span>تنزيل رمز QR الخاص بي</span>
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* DISH DIALOG */}
      <Dialog open={isDishDialogOpen} onOpenChange={setIsDishDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              {editingDish ? "تعديل طبق" : "إضافة طبق جديد"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>الاسم (بالعربية) *</Label>
                <Input
                  value={dishForm.nameAr || ""}
                  onChange={(e) => setDishForm({ ...dishForm, nameAr: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>الاسم (بالفرنسية) *</Label>
                <Input
                  value={dishForm.nameFr || ""}
                  onChange={(e) => setDishForm({ ...dishForm, nameFr: e.target.value })}
                  className="mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>السعر *</Label>
                <Input
                  type="number"
                  value={dishForm.price || ""}
                  onChange={(e) => setDishForm({ ...dishForm, price: parseFloat(e.target.value) || 0 })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>الفئة *</Label>
                <Select
                  value={dishForm.category}
                  onValueChange={(val) => setDishForm({ ...dishForm, category: val })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="اختر الفئة" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.nameAr}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>الوصف (بالعربية)</Label>
              <Textarea
                value={dishForm.descriptionAr || ""}
                onChange={(e) => setDishForm({ ...dishForm, descriptionAr: e.target.value })}
                className="mt-1"
                rows={3}
              />
            </div>

            <div>
              <Label>الوصف (بالفرنسية)</Label>
              <Textarea
                value={dishForm.descriptionFr || ""}
                onChange={(e) => setDishForm({ ...dishForm, descriptionFr: e.target.value })}
                className="mt-1"
                rows={3}
              />
            </div>

            <div>
              <Label>صورة الطبق</Label>
              <div className="flex items-center gap-4 mt-1">
                <div className="h-16 w-24 rounded-lg border overflow-hidden bg-gray-50 flex items-center justify-center">
                  <img src={dishForm.image} alt="Dish Preview" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 space-y-2">
                  <Input
                    type="text"
                    value={dishForm.image || ""}
                    onChange={(e) => setDishForm({ ...dishForm, image: e.target.value })}
                    placeholder="رابط الصورة (URL)"
                    className="text-xs"
                  />
                  <div className="flex items-center gap-2">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, "dish")}
                      className="hidden"
                      id="dish-image-upload"
                    />
                    <Label htmlFor="dish-image-upload" className="cursor-pointer inline-flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg border text-xs font-semibold">
                      <Upload className="h-3.5 w-3.5" />
                      <span>رفع صورة من الجهاز</span>
                    </Label>
                  </div>
                </div>
              </div>
            </div>

            {/* Badges Toggles */}
            <div className="border-t pt-4 space-y-3">
              <Label className="text-sm font-bold block mb-2">شارات الطبق (اختياري)</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={dishForm.isNew || false}
                    onCheckedChange={(checked) => setDishForm({ ...dishForm, isNew: checked })}
                  />
                  <span className="text-xs font-medium">جديد</span>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={dishForm.isBestSeller || false}
                    onCheckedChange={(checked) => setDishForm({ ...dishForm, isBestSeller: checked })}
                  />
                  <span className="text-xs font-medium">الأكثر طلباً</span>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={dishForm.isVegetarian || false}
                    onCheckedChange={(checked) => setDishForm({ ...dishForm, isVegetarian: checked })}
                  />
                  <span className="text-xs font-medium">نباتي</span>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={dishForm.isHalal || false}
                    onCheckedChange={(checked) => setDishForm({ ...dishForm, isHalal: checked })}
                  />
                  <span className="text-xs font-medium">حلال</span>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={dishForm.isGlutenFree || false}
                    onCheckedChange={(checked) => setDishForm({ ...dishForm, isGlutenFree: checked })}
                  />
                  <span className="text-xs font-medium">خالي من الغلوتين</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setIsDishDialogOpen(false)}>إلغاء</Button>
              <Button onClick={saveDish} className="bg-amber-600 hover:bg-amber-700 text-white">حفظ الطبق</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* CATEGORY DIALOG */}
      <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              {editingCategory ? "تعديل الفئة" : "إضافة فئة جديدة"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>اسم الفئة (بالعربية) *</Label>
              <Input
                value={categoryForm.nameAr || ""}
                onChange={(e) => setCategoryForm({ ...categoryForm, nameAr: e.target.value })}
                className="mt-1"
              />
            </div>

            <div>
              <Label>اسم الفئة (بالفرنسية) *</Label>
              <Input
                value={categoryForm.nameFr || ""}
                onChange={(e) => setCategoryForm({ ...categoryForm, nameFr: e.target.value })}
                className="mt-1"
              />
            </div>

            <div>
              <Label>أيقونة الفئة</Label>
              <Select
                value={categoryForm.icon}
                onValueChange={(val) => setCategoryForm({ ...categoryForm, icon: val })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="اختر الأيقونة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Sparkles">أطباق اليوم (نجوم)</SelectItem>
                  <SelectItem value="Utensils">مقبلات (شوكة وسكين)</SelectItem>
                  <SelectItem value="Beef">أطباق رئيسية (لحم)</SelectItem>
                  <SelectItem value="Cake">حلويات (كعكة)</SelectItem>
                  <SelectItem value="Coffee">مشروبات (كوب قهوة)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setIsCategoryDialogOpen(false)}>إلغاء</Button>
              <Button onClick={saveCategory} className="bg-amber-600 hover:bg-amber-700 text-white">حفظ الفئة</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
