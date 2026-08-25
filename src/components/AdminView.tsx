import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Dish, Category, RestaurantConfig, Review } from "../types";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { getMyReviews, getAnalytics, resetAnalytics, getMyRestaurant } from "../utils/storage";
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
  Star,
  MessageCircle,
  ThumbsUp,
  MapPin,
  Link2,
  BarChart3,
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

function lightenColor(hex: string, amount: number): string {
  hex = hex.replace("#", "");
  if (hex.length === 3) hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  const r = Math.min(255, Math.round(parseInt(hex.substring(0, 2), 16) + (255 - parseInt(hex.substring(0, 2), 16)) * amount));
  const g = Math.min(255, Math.round(parseInt(hex.substring(2, 4), 16) + (255 - parseInt(hex.substring(2, 4), 16)) * amount));
  const b = Math.min(255, Math.round(parseInt(hex.substring(4, 6), 16) + (255 - parseInt(hex.substring(4, 6), 16)) * amount));
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

const PRESET_THEMES = [
  { id: "gold",   label: "ذهبي كلاسيكي", primaryColor: "#C8A24D", backgroundColor: "dark" as const },
  { id: "blue",   label: "أزرق عصري",     primaryColor: "#3B82F6", backgroundColor: "dark" as const },
  { id: "green",  label: "أخضر هادئ",     primaryColor: "#10B981", backgroundColor: "cream" as const },
  { id: "red",    label: "أحمر دافئ",     primaryColor: "#EF4444", backgroundColor: "dark" as const },
  { id: "purple", label: "بنفسجي فاخر",   primaryColor: "#8B5CF6", backgroundColor: "dark" as const },
];

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
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [deletingReviewId, setDeletingReviewId] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState({ scanViews: 0, whatsappClicks: 0, totalEvents: 0 });
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [resettingAnalytics, setResettingAnalytics] = useState(false);

  const loadReviews = async () => {
    setReviewsLoading(true);
    try {
      const data = await getMyReviews();
      setReviews(data);
    } catch (err) {
      console.error("[AdminView] loadReviews error:", err);
    } finally {
      setReviewsLoading(false);
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!confirm("هل أنت متأكد من حذف هذه الشكوى؟ لن تتمكن من استعادتها لاحقاً.")) return;
    setDeletingReviewId(reviewId);
    try {
      const { error } = await supabase
        .from("reviews")
        .delete()
        .eq("id", reviewId);
      if (error) throw error;
      setReviews((prev) => prev.filter((r) => r.id !== reviewId));
      toast({ title: "تم الحذف", description: "تم حذف الشكوى بنجاح" });
    } catch (err: any) {
      console.error("[AdminView] deleteReview error:", err);
      toast({ title: "خطأ في الحذف", description: err?.message || "حدث خطأ أثناء حذف الشكوى", variant: "destructive" });
    } finally {
      setDeletingReviewId(null);
    }
  };

  const loadAnalytics = async () => {
    setAnalyticsLoading(true);
    try {
      const restaurant = await getMyRestaurant();
      if (restaurant?.id) {
        const stats = await getAnalytics(restaurant.id);
        setAnalytics(stats);
      }
    } catch (err) {
      console.error("[AdminView] loadAnalytics error:", err);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const handleResetAnalytics = async () => {
    if (!confirm("هل أنت متأكد من تصفير جميع الإحصائيات؟ لا يمكن التراجع عن هذا الإجراء.")) return;
    setResettingAnalytics(true);
    try {
      const restaurant = await getMyRestaurant();
      if (restaurant?.id) {
        await resetAnalytics(restaurant.id);
        setAnalytics({ scanViews: 0, whatsappClicks: 0, totalEvents: 0 });
        toast({ title: "تم التصفير", description: "تم تصفير جميع الإحصائيات بنجاح" });
      }
    } catch (err: any) {
      toast({ title: "خطأ", description: err?.message || "حدث خطأ أثناء تصفير الإحصائيات", variant: "destructive" });
    } finally {
      setResettingAnalytics(false);
    }
  };

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

    if (!currentPassword) { setPasswordError("يرجى إدخال كلمة المرور الحالية"); return; }
    if (!newPassword) { setPasswordError("يرجى إدخال كلمة المرور الجديدة"); return; }
    if (newPassword.length < 6) { setPasswordError("كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل"); return; }
    if (newPassword !== confirmNewPassword) { setPasswordError("كلمة المرور الجديدة غير متطابقة"); return; }

    setIsChangingPassword(true);
    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: user?.email || "",
        password: currentPassword,
      });
      if (authError) { setPasswordError("كلمة المرور الحالية غير صحيحة"); setIsChangingPassword(false); return; }

      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
      if (updateError) { setPasswordError(updateError.message); setIsChangingPassword(false); return; }

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

  // Wrapped save functions that properly handle errors and loading state
  const handleUpdateDishesSafe = async (updatedDishes: Dish[]) => {
    if (isSaving) throw new Error("عملية حفظ جارية");
    setIsSaving(true);
    try {
      await onUpdateDishes(updatedDishes);
    } catch (err) {
      handleSaveError(err);
      throw err; // rethrow so caller can handle
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateCategoriesSafe = async (updatedCategories: Category[]) => {
    if (isSaving) throw new Error("عملية حفظ جارية");
    setIsSaving(true);
    try {
      await onUpdateCategories(updatedCategories);
    } catch (err) {
      handleSaveError(err);
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateConfigSafe = async (cfg: RestaurantConfig) => {
    if (isSaving) throw new Error("عملية حفظ جارية");
    setIsSaving(true);
    try {
      await onUpdateConfig(cfg);
    } catch (err) {
      handleSaveError(err);
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  const [editingDish, setEditingDish] = useState<Dish | null>(null);
  const [dishForm, setDishForm] = useState<Partial<Dish>>({});
  const [isDishDialogOpen, setIsDishDialogOpen] = useState(false);
  const [dishErrors, setDishErrors] = useState<{ nameAr?: string; price?: string; category?: string }>({});

  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryForm, setCategoryForm] = useState<Partial<Category>>({});
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);

  const [configForm, setConfigForm] = useState<RestaurantConfig>({ ...config });

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--primary", configForm.primaryColor);
    root.style.setProperty("--primary-hover", lightenColor(configForm.primaryColor, 0.15));
  }, [configForm.primaryColor]);

  const availableDishes = dishes.filter((d) => d.isAvailable);
  const unavailableDishes = dishes.filter((d) => !d.isAvailable);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: "dish" | "logo" | "cover") => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const fileExt = file.name.split('.').pop();
    const fileName = `${type}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
    
    try {
      const { data, error } = await supabase.storage
        .from('restaurant-images')
        .upload(fileName, file);
      
      if (error) throw error;
      
      const { data: { publicUrl } } = supabase.storage
        .from('restaurant-images')
        .getPublicUrl(fileName);
      
      if (type === "dish") setDishForm((prev) => ({ ...prev, image: publicUrl }));
      else if (type === "cover") setConfigForm((prev) => ({ ...prev, coverUrl: publicUrl }));
      else setConfigForm((prev) => ({ ...prev, logoUrl: publicUrl }));
      
      toast({ title: "تم رفع الصورة بنجاح", description: "تم حفظ الصورة في التخزين السحابي Supabase" });
    } catch (err: any) {
      console.error("Upload error:", err);
      toast({ title: "خطأ في رفع الصورة", description: err?.message || "حدث خطأ أثناء رفع الصورة", variant: "destructive" });
      // Fallback to Base64 if storage upload fails
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        if (type === "dish") setDishForm((prev) => ({ ...prev, image: base64String }));
        else if (type === "cover") setConfigForm((prev) => ({ ...prev, coverUrl: base64String }));
        else setConfigForm((prev) => ({ ...prev, logoUrl: base64String }));
      };
      reader.readAsDataURL(file);
    }
  };

  const openAddDish = () => {
    setEditingDish(null);
    setDishErrors({});
    setDishForm({
      nameAr: "", nameFr: "", nameEn: "", nameEs: "", descriptionAr: "", descriptionFr: "", descriptionEn: "", descriptionEs: "", price: 0,
      category: categories[0]?.id || "",
      image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80",
      isAvailable: true, isNew: false, isBestSeller: false, isVegetarian: false, isHalal: true, isGlutenFree: false,
      upsellIds: [],
    });
    setIsDishDialogOpen(true);
  };

  const openEditDish = (dish: Dish) => { setEditingDish(dish); setDishErrors({}); setDishForm({ ...dish }); setIsDishDialogOpen(true); };

  const saveDish = async () => {
    // Only nameAr + price > 0 + category are mandatory
    const errors: { nameAr?: string; price?: string; category?: string } = {};
    if (!(dishForm.nameAr || "").trim()) errors.nameAr = "\u0627\u0644\u0627\u0633\u0645 \u0628\u0627\u0644\u0639\u0631\u0628\u064a\u0629 \u0645\u0637\u0644\u0648\u0628";
    if (!dishForm.price || dishForm.price <= 0) errors.price = "\u064a\u062c\u0628 \u0625\u062f\u062e\u0627\u0644 \u0633\u0639\u0631 \u0623\u0643\u0628\u0631 \u0645\u0646 \u0635\u0641\u0631";
    if (!dishForm.category || !dishForm.category.trim()) errors.category = "\u064a\u062c\u0628 \u0627\u062e\u062a\u064a\u0627\u0631 \u0641\u0626\u0629";
    setDishErrors(errors);
    if (Object.keys(errors).length > 0) return;
    // Auto-fallback: empty langs get Arabic
    const ar = (dishForm.nameAr || "").trim();
    const descAr = (dishForm.descriptionAr || "").trim();
    const filledDish = {
      ...dishForm,
      nameAr: ar, nameFr: (dishForm.nameFr || "").trim() || ar, nameEn: (dishForm.nameEn || "").trim() || ar, nameEs: (dishForm.nameEs || "").trim() || ar,
      descriptionAr: descAr, descriptionFr: (dishForm.descriptionFr || "").trim() || descAr, descriptionEn: (dishForm.descriptionEn || "").trim() || descAr, descriptionEs: (dishForm.descriptionEs || "").trim() || descAr,
    };
    let updatedDishes: Dish[];
    if (editingDish) { updatedDishes = dishes.map((d) => (d.id === editingDish.id ? (filledDish as Dish) : d)); }
    else { updatedDishes = [...dishes, { ...(filledDish as Dish), id: `dish_${Date.now()}` }]; }
    try {
      await handleUpdateDishesSafe(updatedDishes);
      setIsDishDialogOpen(false); setDishErrors({});
      toast({ title: editingDish ? "\u2705 \u062a\u0645 \u0627\u0644\u062a\u0639\u062f\u064a\u0644" : "\u2705 \u062a\u0645 \u0627\u0644\u0625\u0636\u0627\u0641\u0629", description: editingDish ? "\u062a\u0645 \u062a\u0639\u062f\u064a\u0644 \u0627\u0644\u0637\u0628\u0642 \u0628\u0646\u062c\u0627\u062d" : "\u062a\u0645 \u0625\u0636\u0627\u0641\u0629 \u0627\u0644\u0637\u0628\u0642 \u0627\u0644\u062c\u062f\u064a\u062f \u0628\u0646\u062c\u0627\u062d", variant: "success" });
    } catch (err: any) {
      console.error("[AdminView] saveDish error:", err);
      toast({ title: "\u274c \u0641\u0634\u0644 \u0627\u0644\u062d\u0641\u0638", description: err?.message || "\u062d\u062f\u062b \u062e\u0637\u0623 \u0623\u062b\u0646\u0627\u0621 \u0627\u0644\u062d\u0641\u0638 \u0641\u064a Supabase", variant: "destructive" });
    }
  };

  const deleteDish = async (id: string) => {
    if (confirm("هل أنت متأكد من حذف هذا الطبق؟")) {
      try {
        await handleUpdateDishesSafe(dishes.filter((d) => d.id !== id));
        toast({ title: "تم الحذف", description: "تم حذف الطبق بنجاح" });
      } catch (err) {}
    }
  };

  const toggleDishAvailability = async (id: string, currentStatus: boolean) => {
    const updated = dishes.map((d) => d.id === id ? { ...d, isAvailable: !currentStatus } : d);
    try {
      await handleUpdateDishesSafe(updated);
      toast({ title: !currentStatus ? "تم تفعيل الطبق" : "تم تعطيل الطبق", description: !currentStatus ? "الطبق متوفر الآن للزبائن" : "الطبق غير متوفر حالياً (مخفي عن الزبائن)" });
    } catch (err) {}
  };

  const reactivateDish = async (id: string) => {
    try {
      await handleUpdateDishesSafe(dishes.map((d) => d.id === id ? { ...d, isAvailable: true } : d));
      toast({ title: "تم إعادة تفعيل الطبق", description: "عاد الطبق للظهور في قائمة الزبائن" });
    } catch (err) {}
  };

  const openAddCategory = () => {
    setEditingCategory(null);
    setCategoryForm({ nameAr: "", nameFr: "", nameEn: "", nameEs: "", icon: "Utensils" });
    setIsCategoryDialogOpen(true);
  };

  const openEditCategory = (category: Category) => { setEditingCategory(category); setCategoryForm({ ...category }); setIsCategoryDialogOpen(true); };

  const saveCategory = async () => {
    const ar = (categoryForm.nameAr || "").trim();
    if (!ar) {
      toast({ title: "تنبيه", description: "الاسم بالعربية مطلوب", variant: "destructive" });
      return;
    }
    const filled = { ...categoryForm, nameAr: ar, nameFr: (categoryForm.nameFr || "").trim() || ar, nameEn: (categoryForm.nameEn || "").trim() || ar, nameEs: (categoryForm.nameEs || "").trim() || ar };
    let updatedCategories: Category[];
    if (editingCategory) { updatedCategories = categories.map((c) => (c.id === editingCategory.id ? (filled as Category) : c)); }
    else { updatedCategories = [...categories, { ...(filled as Category), id: `cat_${Date.now()}` }]; }
    try {
      await handleUpdateCategoriesSafe(updatedCategories);
      setIsCategoryDialogOpen(false);
      toast({ title: editingCategory ? "\u2705 \u062a\u0645 \u0627\u0644\u062a\u0639\u062f\u064a\u0644" : "\u2705 \u062a\u0645 \u0627\u0644\u0625\u0636\u0627\u0641\u0629", description: editingCategory ? "\u062a\u0645 \u062a\u0639\u062f\u064a\u0644 \u0627\u0644\u0641\u0626\u0629 \u0628\u0646\u062c\u0627\u062d" : "\u062a\u0645 \u0625\u0636\u0627\u0641\u0629 \u0627\u0644\u0641\u0626\u0629 \u0627\u0644\u062c\u062f\u064a\u062f\u0629 \u0628\u0646\u062c\u0627\u062d", variant: "success" });
    } catch (err: any) {
      console.error("[AdminView] saveCategory error:", err);
      toast({ title: "\u274c \u0641\u0634\u0644 \u0627\u0644\u062d\u0641\u0638", description: err?.message || "\u062d\u062f\u062b \u062e\u0637\u0623 \u0623\u062b\u0646\u0627\u0621 \u0627\u0644\u062d\u0641\u0638 \u0641\u064a Supabase", variant: "destructive" });
    }
  };

  const deleteCategory = async (id: string) => {
    const hasDishes = dishes.some((d) => d.category === id);
    if (hasDishes) {
      toast({ title: "لا يمكن الحذف", description: "هذه الفئة تحتوي على أطباق نشطة. يرجى نقل الأطباق أو حذفها أولاً.", variant: "destructive" });
      return;
    }
    if (confirm("هل أنت متأكد من حذف هذه الفئة؟")) {
      try {
        await handleUpdateCategoriesSafe(categories.filter((c) => c.id !== id));
        toast({ title: "تم الحذف", description: "تم حذف الفئة بنجاح" });
      } catch (err) {}
    }
  };

  const saveConfig = async () => {
    try {
      await handleUpdateConfigSafe(configForm);
      toast({ title: "✅ تم حفظ الإعدادات بنجاح", description: "تم تحديث معلومات المطعم والألوان بنجاح", duration: 3000 });
    } catch (err) {
      // error toast already shown
    }
  };

  const applyTheme = async (theme: typeof PRESET_THEMES[number]) => {
    const updatedConfig = { ...configForm, primaryColor: theme.primaryColor, backgroundColor: theme.backgroundColor };
    setConfigForm(updatedConfig);
    try {
      await handleUpdateConfigSafe(updatedConfig);
      toast({ title: "✅ تم تطبيق الثيم", description: `تم تطبيق ثيم "${theme.label}" وحفظه بنجاح`, duration: 2500 });
    } catch (err) {}
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

  // ── Stats ──
  const positiveReviews = reviews.filter((r) => r.rating >= 4).length;
  const complaints = reviews.filter((r) => r.rating < 4).length;

  // Upsells helper
  const currentDishId = editingDish?.id || "";
  const upsellCandidates = dishes.filter(d => d.id !== currentDishId && d.isAvailable);
  const currentUpsellIds: string[] = (dishForm as any).upsellIds || [];

  const toggleUpsell = (id: string) => {
    const current = new Set(currentUpsellIds);
    if (current.has(id)) current.delete(id);
    else current.add(id);
    setDishForm({ ...dishForm, upsellIds: Array.from(current) });
  };

  return (
    <div className="min-h-screen pb-16 relative" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <Tabs defaultValue="dishes" className="space-y-8" onValueChange={(val) => { if (val === "reviews") loadReviews(); if (val === "analytics") loadAnalytics(); }}>
          {/* ── Tabs Navigation ── */}
          <TabsList className="bg-white/[0.02] backdrop-blur-xl border border-white/[0.04] p-1 rounded-2xl w-full max-w-lg flex shadow-[0_4px_24px_rgba(0,0,0,0.2)]">
            <TabsTrigger value="dishes"
              className="flex-1 py-2.5 rounded-xl font-bold text-sm data-[state=active]:bg-[var(--primary)] data-[state=active]:text-black data-[state=active]:shadow-[0_2px_12px_rgba(200,162,77,0.3)] data-[state=inactive]:text-white/35 data-[state=inactive]:hover:text-white/60 transition-all duration-300">
              الأطباق
            </TabsTrigger>
            <TabsTrigger value="categories"
              className="flex-1 py-2.5 rounded-xl font-bold text-sm data-[state=active]:bg-[var(--primary)] data-[state=active]:text-black data-[state=active]:shadow-[0_2px_12px_rgba(200,162,77,0.3)] data-[state=inactive]:text-white/35 data-[state=inactive]:hover:text-white/60 transition-all duration-300">
              الفئات
            </TabsTrigger>
            <TabsTrigger value="settings"
              className="flex-1 py-2.5 rounded-xl font-bold text-sm data-[state=active]:bg-[var(--primary)] data-[state=active]:text-black data-[state=active]:shadow-[0_2px_12px_rgba(200,162,77,0.3)] data-[state=inactive]:text-white/35 data-[state=inactive]:hover:text-white/60 transition-all duration-300">
              الإعدادات
            </TabsTrigger>
            <TabsTrigger value="account"
              className="flex-1 py-2.5 rounded-xl font-bold text-sm data-[state=active]:bg-[var(--primary)] data-[state=active]:text-black data-[state=active]:shadow-[0_2px_12px_rgba(200,162,77,0.3)] data-[state=inactive]:text-white/35 data-[state=inactive]:hover:text-white/60 transition-all duration-300">
              الحساب
            </TabsTrigger>
            <TabsTrigger value="reviews"
              className="flex-1 py-2.5 rounded-xl font-bold text-sm data-[state=active]:bg-[var(--primary)] data-[state=active]:text-black data-[state=active]:shadow-[0_2px_12px_rgba(200,162,77,0.3)] data-[state=inactive]:text-white/35 data-[state=inactive]:hover:text-white/60 transition-all duration-300">
              التقييمات
            </TabsTrigger>
            <TabsTrigger value="analytics"
              className="flex-1 py-2.5 rounded-xl font-bold text-sm data-[state=active]:bg-[var(--primary)] data-[state=active]:text-black data-[state=active]:shadow-[0_2px_12px_rgba(200,162,77,0.3)] data-[state=inactive]:text-white/35 data-[state=inactive]:hover:text-white/60 transition-all duration-300">
              التحليلات
            </TabsTrigger>
          </TabsList>

          {/* ═══════════════════════ DISHES TAB ═══════════════════════ */}
          <TabsContent value="dishes" className="space-y-6">
            {/* Stats row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white/[0.02] backdrop-blur-2xl border border-white/[0.04] rounded-2xl p-4 shadow-[0_4px_24px_rgba(0,0,0,0.25)] hover:border-white/[0.08] transition-all duration-300">
                <div className="text-[11px] text-white/30 mb-1">إجمالي الأطباق</div>
                <div className="text-2xl font-bold text-white tracking-tight">{dishes.length}</div>
              </div>
              <div className="bg-white/[0.02] backdrop-blur-2xl border border-white/[0.04] rounded-2xl p-4 shadow-[0_4px_24px_rgba(0,0,0,0.25)] hover:border-white/[0.08] transition-all duration-300">
                <div className="text-[11px] text-white/30 mb-1">أطباق متوفرة</div>
                <div className="text-2xl font-bold text-emerald-400/80 tracking-tight">{availableDishes.length}</div>
              </div>
              <div className="bg-white/[0.02] backdrop-blur-2xl border border-white/[0.04] rounded-2xl p-4 shadow-[0_4px_24px_rgba(0,0,0,0.25)] hover:border-white/[0.08] transition-all duration-300">
                <div className="text-[11px] text-white/30 mb-1">أطباق مخفية</div>
                <div className="text-2xl font-bold text-red-400/60 tracking-tight">{unavailableDishes.length}</div>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-white">إدارة الأطباق</h2>
                <p className="text-xs text-white/25 mt-0.5">{dishes.length} طبق في القائمة</p>
              </div>
              <Button onClick={openAddDish}
                className="bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-black font-bold rounded-xl h-10 px-5 shadow-[0_4px_20px_rgba(200,162,77,0.2)] hover:shadow-[0_6px_24px_rgba(200,162,77,0.3)] transition-all duration-300">
                <Plus className="h-4 w-4 ml-1.5" /><span>إضافة طبق</span>
              </Button>
            </div>

            {/* Available dishes */}
            <div className="space-y-2">
              {availableDishes.map((dish) => {
                const cat = categories.find((c) => c.id === dish.category);
                const upsellCount = (dish.upsellIds || []).length;
                return (
                  <div key={dish.id}
                    className="bg-white/[0.02] backdrop-blur-2xl p-4 rounded-2xl border border-white/[0.04] flex items-center justify-between hover:border-white/[0.08] hover:bg-white/[0.03] transition-all duration-300 gap-3 shadow-[0_2px_16px_rgba(0,0,0,0.2)] hover:shadow-[0_4px_24px_rgba(0,0,0,0.3)]">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="h-12 w-12 rounded-xl overflow-hidden flex-shrink-0 border border-white/[0.06] shadow-[0_2px_8px_rgba(0,0,0,0.3)]">
                        <img src={dish.image} alt={dish.nameAr} className="w-full h-full object-cover" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold text-white text-sm truncate">{dish.nameAr}</h3>
                          {dish.isPromo && <Badge className="bg-[var(--primary)]/15 text-[var(--primary)] border border-[var(--primary)]/20 text-[10px] font-bold px-1.5 py-0 rounded-full backdrop-blur-sm">عرض</Badge>}
                          {upsellCount > 0 && <Badge className="bg-purple-500/10 text-purple-400/80 border border-purple-500/15 text-[10px] font-bold px-1.5 py-0 rounded-full backdrop-blur-sm"><Link2 className="h-2.5 w-2.5 inline-block ml-0.5" />{upsellCount} مكملات</Badge>}
                          {cat && <span className="text-[10px] text-white/25">({cat.nameAr})</span>}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[var(--primary)] font-bold text-sm">{dish.price} {config.currencyAr}</span>
                          <span className="text-emerald-400/50 text-[10px] font-medium">متوفر</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <Switch checked={dish.isAvailable} onCheckedChange={() => toggleDishAvailability(dish.id, dish.isAvailable)} />
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-200 hover:text-white hover:bg-white/10 rounded-lg transition-all" onClick={() => openEditDish(dish)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-red-400/40 hover:text-red-300 hover:bg-red-500/8 rounded-lg transition-all" onClick={() => deleteDish(dish.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
              {availableDishes.length === 0 && (
                <div className="bg-white/[0.02] backdrop-blur-2xl border border-white/[0.04] rounded-2xl p-12 text-center shadow-[0_4px_24px_rgba(0,0,0,0.2)]">
                  <Utensils className="h-10 w-10 mx-auto text-white/8 mb-3" />
                  <p className="text-white/25 text-sm">لا توجد أطباق متوفرة حالياً</p>
                  <p className="text-white/15 text-xs mt-1">أضف طبقاً جديداً للبدء</p>
                </div>
              )}
            </div>

            {/* Unavailable dishes */}
            {unavailableDishes.length > 0 && (
              <div className="pt-6 space-y-3">
                <div className="flex items-center gap-2">
                  <Ban className="h-4 w-4 text-red-400/30" />
                  <h3 className="text-sm font-bold text-red-400/40">أطباق مخفية عن الزبائن ({unavailableDishes.length})</h3>
                </div>
                <div className="space-y-2">
                  {unavailableDishes.map((dish) => {
                    const cat = categories.find((c) => c.id === dish.category);
                    return (
                      <div key={dish.id}
                        className="bg-white/[0.01] backdrop-blur-xl p-4 rounded-2xl border border-red-500/8 flex items-center justify-between opacity-50 hover:opacity-70 transition-all duration-300 gap-3">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="h-12 w-12 rounded-xl overflow-hidden flex-shrink-0 border border-white/[0.03] relative">
                            <img src={dish.image} alt={dish.nameAr} className="w-full h-full object-cover grayscale" />
                            <div className="absolute inset-0 bg-black/40" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-bold text-white/30 text-sm truncate line-through decoration-red-400/20">{dish.nameAr}</h3>
                              {cat && <span className="text-[10px] text-white/15">({cat.nameAr})</span>}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[var(--primary)]/30 font-bold text-sm">{dish.price} {config.currencyAr}</span>
                              <Badge className="bg-red-500/10 text-red-400/50 border border-red-500/10 text-[10px] font-bold px-1.5 py-0 rounded-full">مخفي</Badge>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <Button size="sm" variant="ghost"
                            className="text-emerald-400/60 hover:text-emerald-300 hover:bg-emerald-500/8 rounded-lg h-7 gap-1 text-xs"
                            onClick={() => reactivateDish(dish.id)}>
                            <RefreshCcw className="h-3 w-3" /><span>تفعيل</span>
                          </Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-300/60 hover:text-white hover:bg-white/10 rounded-lg" onClick={() => openEditDish(dish)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-red-400/30 hover:text-red-400/60 hover:bg-red-500/5 rounded-lg" onClick={() => deleteDish(dish.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </TabsContent>

          {/* ═══════════════════════ CATEGORIES TAB ═══════════════════════ */}
          <TabsContent value="categories" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-white">إدارة الفئات</h2>
                <p className="text-xs text-white/25 mt-0.5">{categories.length} فئة</p>
              </div>
              <Button onClick={openAddCategory}
                className="bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-black font-bold rounded-xl h-10 px-5 shadow-[0_4px_20px_rgba(200,162,77,0.2)] hover:shadow-[0_6px_24px_rgba(200,162,77,0.3)] transition-all duration-300">
                <Plus className="h-4 w-4 ml-1.5" /><span>إضافة فئة</span>
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories.map((cat) => {
                const IconComponent = iconMap[cat.icon] || Utensils;
                const dishCount = dishes.filter((d) => d.category === cat.id).length;
                return (
                  <div key={cat.id}
                    className="bg-white/[0.02] backdrop-blur-2xl p-5 rounded-2xl border border-white/[0.04] flex items-center justify-between hover:border-white/[0.08] hover:bg-white/[0.03] transition-all duration-300 shadow-[0_4px_20px_rgba(0,0,0,0.2)] hover:shadow-[0_6px_24px_rgba(0,0,0,0.3)]">
                    <div className="flex items-center gap-3">
                      <div className="h-11 w-11 rounded-xl bg-[var(--primary)]/8 flex items-center justify-center text-[var(--primary)] border border-[var(--primary)]/10 shadow-[0_2px_12px_rgba(200,162,77,0.08)]">
                        <IconComponent className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-white text-sm">{cat.nameAr}</h3>
                        <p className="text-xs text-white/25">{cat.nameFr} • {dishCount} أطباق</p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-200 hover:text-white hover:bg-white/10 rounded-lg transition-all" onClick={() => openEditCategory(cat)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-red-400/30 hover:text-red-300 hover:bg-red-500/8 rounded-lg transition-all" onClick={() => deleteCategory(cat.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
              {categories.length === 0 && (
                <div className="col-span-full bg-white/[0.02] backdrop-blur-2xl border border-white/[0.04] rounded-2xl p-12 text-center shadow-[0_4px_24px_rgba(0,0,0,0.2)]">
                  <Sparkles className="h-10 w-10 mx-auto text-white/8 mb-3" />
                  <p className="text-white/25 text-sm">لا توجد فئات حالياً</p>
                  <p className="text-white/15 text-xs mt-1">أضف فئة جديدة للبدء</p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* ═══════════════════════ SETTINGS TAB ═══════════════════════ */}
          <TabsContent value="settings" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white/[0.02] backdrop-blur-2xl p-6 rounded-2xl border border-white/[0.04] space-y-6 shadow-[0_4px_24px_rgba(0,0,0,0.2)]">
              <div className="border-b border-white/[0.04] pb-4">
                <h2 className="text-lg font-bold text-white">تخصيص معلومات ومظهر المطعم</h2>
                <p className="text-xs text-white/25 mt-1">قم بتعديل الاسم، الألوان، ومعلومات الاتصال</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-white/40 text-[11px] font-medium">اسم المطعم (بالعربية)</Label>
                  <Input value={configForm.nameAr} onChange={(e) => setConfigForm({ ...configForm, nameAr: e.target.value })}
                    className="mt-1.5 bg-white/[0.03] border-white/[0.06] text-white placeholder:text-white/15 rounded-xl h-10 text-sm focus:border-[var(--primary)]/30 focus:ring-1 focus:ring-[var(--primary)]/10 transition-all" />
                </div>
                <div>
                  <Label className="text-white/40 text-[11px] font-medium">اسم المطعم (بالفرنسية)</Label>
                  <Input value={configForm.nameFr} onChange={(e) => setConfigForm({ ...configForm, nameFr: e.target.value })}
                    className="mt-1.5 bg-white/[0.03] border-white/[0.06] text-white placeholder:text-white/15 rounded-xl h-10 text-sm focus:border-[var(--primary)]/30 focus:ring-1 focus:ring-[var(--primary)]/10 transition-all" />
                </div>
                <div>
                  <Label className="text-white/40 text-[11px] font-medium">اسم المطعم (بالإنجليزية)</Label>
                  <Input value={configForm.nameEn} onChange={(e) => setConfigForm({ ...configForm, nameEn: e.target.value })}
                    className="mt-1.5 bg-white/[0.03] border-white/[0.06] text-white placeholder:text-white/15 rounded-xl h-10 text-sm focus:border-[var(--primary)]/30 focus:ring-1 focus:ring-[var(--primary)]/10 transition-all" />
                </div>
                <div>
                  <Label className="text-white/40 text-[11px] font-medium">اسم المطعم (بالإسبانية)</Label>
                  <Input value={configForm.nameEs} onChange={(e) => setConfigForm({ ...configForm, nameEs: e.target.value })}
                    className="mt-1.5 bg-white/[0.03] border-white/[0.06] text-white placeholder:text-white/15 rounded-xl h-10 text-sm focus:border-[var(--primary)]/30 focus:ring-1 focus:ring-[var(--primary)]/10 transition-all" />
                </div>
                <div>
                  <Label className="text-white/40 text-[11px] font-medium">الشعار (بالعربية)</Label>
                  <Input value={configForm.sloganAr} onChange={(e) => setConfigForm({ ...configForm, sloganAr: e.target.value })}
                    className="mt-1.5 bg-white/[0.03] border-white/[0.06] text-white placeholder:text-white/15 rounded-xl h-10 text-sm focus:border-[var(--primary)]/30 focus:ring-1 focus:ring-[var(--primary)]/10 transition-all" />
                </div>
                <div>
                  <Label className="text-white/40 text-[11px] font-medium">الشعار (بالفرنسية)</Label>
                  <Input value={configForm.sloganFr} onChange={(e) => setConfigForm({ ...configForm, sloganFr: e.target.value })}
                    className="mt-1.5 bg-white/[0.03] border-white/[0.06] text-white placeholder:text-white/15 rounded-xl h-10 text-sm focus:border-[var(--primary)]/30 focus:ring-1 focus:ring-[var(--primary)]/10 transition-all" />
                </div>
                <div>
                  <Label className="text-white/40 text-[11px] font-medium">الشعار (بالإنجليزية)</Label>
                  <Input value={configForm.sloganEn} onChange={(e) => setConfigForm({ ...configForm, sloganEn: e.target.value })}
                    className="mt-1.5 bg-white/[0.03] border-white/[0.06] text-white placeholder:text-white/15 rounded-xl h-10 text-sm focus:border-[var(--primary)]/30 focus:ring-1 focus:ring-[var(--primary)]/10 transition-all" />
                </div>
                <div>
                  <Label className="text-white/40 text-[11px] font-medium">الشعار (بالإسبانية)</Label>
                  <Input value={configForm.sloganEs} onChange={(e) => setConfigForm({ ...configForm, sloganEs: e.target.value })}
                    className="mt-1.5 bg-white/[0.03] border-white/[0.06] text-white placeholder:text-white/15 rounded-xl h-10 text-sm focus:border-[var(--primary)]/30 focus:ring-1 focus:ring-[var(--primary)]/10 transition-all" />
                </div>
                <div>
                  <Label className="text-white/40 text-[11px] font-medium">ساعات العمل (بالعربية)</Label>
                  <Input value={configForm.workingHoursAr} onChange={(e) => setConfigForm({ ...configForm, workingHoursAr: e.target.value })}
                    className="mt-1.5 bg-white/[0.03] border-white/[0.06] text-white placeholder:text-white/15 rounded-xl h-10 text-sm focus:border-[var(--primary)]/30 focus:ring-1 focus:ring-[var(--primary)]/10 transition-all" />
                </div>
                <div>
                  <Label className="text-white/40 text-[11px] font-medium">ساعات العمل (بالفرنسية)</Label>
                  <Input value={configForm.workingHoursFr} onChange={(e) => setConfigForm({ ...configForm, workingHoursFr: e.target.value })}
                    className="mt-1.5 bg-white/[0.03] border-white/[0.06] text-white placeholder:text-white/15 rounded-xl h-10 text-sm focus:border-[var(--primary)]/30 focus:ring-1 focus:ring-[var(--primary)]/10 transition-all" />
                </div>
                <div>
                  <Label className="text-white/40 text-[11px] font-medium">ساعات العمل (بالإنجليزية)</Label>
                  <Input value={configForm.workingHoursEn} onChange={(e) => setConfigForm({ ...configForm, workingHoursEn: e.target.value })}
                    className="mt-1.5 bg-white/[0.03] border-white/[0.06] text-white placeholder:text-white/15 rounded-xl h-10 text-sm focus:border-[var(--primary)]/30 focus:ring-1 focus:ring-[var(--primary)]/10 transition-all" />
                </div>
                <div>
                  <Label className="text-white/40 text-[11px] font-medium">ساعات العمل (بالإسبانية)</Label>
                  <Input value={configForm.workingHoursEs} onChange={(e) => setConfigForm({ ...configForm, workingHoursEs: e.target.value })}
                    className="mt-1.5 bg-white/[0.03] border-white/[0.06] text-white placeholder:text-white/15 rounded-xl h-10 text-sm focus:border-[var(--primary)]/30 focus:ring-1 focus:ring-[var(--primary)]/10 transition-all" />
                </div>
                <div>
                  <Label className="text-white/40 text-[11px] font-medium">رقم واتساب (مع رمز الدولة)</Label>
                  <Input value={configForm.whatsappNumber} onChange={(e) => setConfigForm({ ...configForm, whatsappNumber: e.target.value })}
                    className="mt-1.5 bg-white/[0.03] border-white/[0.06] text-white placeholder:text-white/15 rounded-xl h-10 text-sm focus:border-[var(--primary)]/30 focus:ring-1 focus:ring-[var(--primary)]/10 transition-all" placeholder="212600000000" />
                </div>
                <div>
                  <Label className="text-white/40 text-[11px] font-medium">العملة</Label>
                  <div className="grid grid-cols-2 gap-2 mt-1.5">
                    <Input value={configForm.currencyAr} onChange={(e) => setConfigForm({ ...configForm, currencyAr: e.target.value })}
                      className="bg-white/[0.03] border-white/[0.06] text-white placeholder:text-white/15 rounded-xl h-10 text-sm focus:border-[var(--primary)]/30 focus:ring-1 focus:ring-[var(--primary)]/10 transition-all" placeholder="درهم" />
                    <Input value={configForm.currencyFr} onChange={(e) => setConfigForm({ ...configForm, currencyFr: e.target.value })}
                      className="bg-white/[0.03] border-white/[0.06] text-white placeholder:text-white/15 rounded-xl h-10 text-sm focus:border-[var(--primary)]/30 focus:ring-1 focus:ring-[var(--primary)]/10 transition-all" placeholder="MAD" />
                    <Input value={configForm.currencyEn} onChange={(e) => setConfigForm({ ...configForm, currencyEn: e.target.value })}
                      className="bg-white/[0.03] border-white/[0.06] text-white placeholder:text-white/15 rounded-xl h-10 text-sm focus:border-[var(--primary)]/30 focus:ring-1 focus:ring-[var(--primary)]/10 transition-all" placeholder="MAD" />
                    <Input value={configForm.currencyEs} onChange={(e) => setConfigForm({ ...configForm, currencyEs: e.target.value })}
                      className="bg-white/[0.03] border-white/[0.06] text-white placeholder:text-white/15 rounded-xl h-10 text-sm focus:border-[var(--primary)]/30 focus:ring-1 focus:ring-[var(--primary)]/10 transition-all" placeholder="MAD" />
                  </div>
                </div>
              </div>

              {/* Google Maps */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center gap-2 mb-1">
                  <MapPin className="h-4 w-4 text-[var(--primary)]/70" />
                  <Label className="text-white/60 text-sm font-bold">رابط خرائط Google Maps للتقييمات</Label>
                </div>
                <Input
                  value={configForm.googleMapsUrl || ""}
                  onChange={(e) => setConfigForm({ ...configForm, googleMapsUrl: e.target.value })}
                  className="mt-1 bg-white/[0.03] border-white/[0.06] text-white placeholder:text-white/15 rounded-xl h-11 text-sm focus:border-[var(--primary)]/30 focus:ring-1 focus:ring-[var(--primary)]/10 transition-all"
                  placeholder="https://maps.google.com/?cid=..."
                  dir="ltr"
                />
                <p className="text-white/30 text-[10px] leading-relaxed">
                  <MapPin className="h-3 w-3 inline-block ml-1 text-[var(--primary)]/60" />
                  عند إضافة الرابط، سيتم توجيه الزبائن إليه مباشرة عند تقييمهم. يمكنك الحصول عليه من تطبيق Google Maps عبر: مشاركة → نسخ الرابط
                </p>
                {!configForm.googleMapsUrl && (
                  <div className="flex items-start gap-2 bg-yellow-500/5 border border-yellow-500/10 rounded-xl p-3 mt-2 backdrop-blur-sm">
                    <AlertCircle className="h-4 w-4 text-yellow-400/70 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-yellow-400/70 text-xs font-semibold">تنبيه: لم يتم إضافة رابط Google Maps بعد</p>
                      <p className="text-yellow-400/40 text-[10px] mt-0.5">أضف رابط موقعك على Google Maps ليتم توجيه الزبائن إليه عند التقييم</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Preset Themes */}
              <div className="pt-4 border-t border-white/[0.04]">
                <Label className="text-white/40 text-[11px] font-medium">الثيم الجاهز</Label>
                <p className="text-white/18 text-[10px] mt-0.5 mb-3">اختر ثيمًا جاهزًا لتطبيق ألوان متناسقة فوراً</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                  {PRESET_THEMES.map((theme) => {
                    const isActive = configForm.primaryColor === theme.primaryColor && configForm.backgroundColor === theme.backgroundColor;
                    return (
                      <button
                        key={theme.id}
                        onClick={() => applyTheme(theme)}
                        disabled={isSaving}
                        className={`relative flex flex-col items-center gap-2 p-3 rounded-xl border transition-all duration-300 ${
                          isActive
                            ? "border-[var(--primary)] ring-1 ring-[var(--primary)]/30 bg-[var(--primary)]/5 shadow-[0_0_20px_rgba(200,162,77,0.1)]"
                            : "border-white/[0.05] bg-white/[0.01] hover:bg-white/[0.04] hover:border-white/[0.1]"
                        } disabled:opacity-40 disabled:cursor-not-allowed`}
                      >
                        <div className="flex gap-1.5">
                          <span className="w-6 h-6 rounded-full border border-white/10 shadow-[0_2px_6px_rgba(0,0,0,0.4)]" style={{ backgroundColor: theme.primaryColor }} />
                          <span className={`w-6 h-6 rounded-full border border-white/10 shadow-[0_2px_6px_rgba(0,0,0,0.4)] ${
                            theme.backgroundColor === "dark" ? "bg-[#060606]" : theme.backgroundColor === "cream" ? "bg-[#FDF6EE]" : "bg-white"
                          }`} />
                        </div>
                        <span className="text-xs font-medium text-white/50">{theme.label}</span>
                        {isActive && (
                          <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-[var(--primary)] rounded-full flex items-center justify-center shadow-[0_2px_8px_rgba(200,162,77,0.4)]">
                            <Check className="h-3 w-3 text-black" />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Logo Upload */}
              <div className="space-y-2 pt-4 border-t border-white/[0.04]">
                <Label className="text-white/40 text-[11px] font-medium">شعار المطعم (صورة)</Label>
                <div className="flex items-center gap-4 mt-1">
                  <div className="h-16 w-16 rounded-2xl border border-white/[0.06] overflow-hidden bg-white/[0.01] flex items-center justify-center flex-shrink-0 relative group shadow-[0_2px_12px_rgba(0,0,0,0.3)]">
                    {configForm.logoUrl ? (
                      <>
                        <img src={configForm.logoUrl} alt="Logo Preview" className="w-full h-full object-cover" />
                        <button onClick={() => setConfigForm({ ...configForm, logoUrl: "" })}
                          className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-red-500/70 hover:bg-red-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <X className="h-3 w-3 text-white" />
                        </button>
                      </>
                    ) : (
                      <ImageIcon className="h-6 w-6 text-white/10" />
                    )}
                  </div>
                  <div className="flex-1">
                    <Input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, "logo")} className="hidden" id="logo-upload" />
                    <Label htmlFor="logo-upload"
                      className="cursor-pointer inline-flex items-center gap-2 bg-white/[0.03] hover:bg-white/[0.06] px-4 py-2.5 rounded-xl border border-white/[0.06] text-sm font-semibold text-white/50 hover:text-white/80 transition-all duration-300">
                      <Upload className="h-4 w-4" /><span>رفع شعار جديد</span>
                    </Label>
                    <p className="text-xs text-white/18 mt-1.5">يمكنك رفع صورة مباشرة من جهازك وحفظها محلياً</p>
                  </div>
                </div>
              </div>

              {/* Cover Upload */}
              <div className="space-y-2 pt-4 border-t border-white/[0.04]">
                <Label className="text-white/40 text-[11px] font-medium">غلاف المطعم (صورة عريضة)</Label>
                <div className="space-y-3 mt-1">
                  {configForm.coverUrl && (
                    <div className="h-28 w-full rounded-xl border border-white/[0.06] overflow-hidden bg-white/[0.01] relative group shadow-[0_2px_12px_rgba(0,0,0,0.3)]">
                      <img src={configForm.coverUrl} alt="Cover Preview" className="w-full h-full object-cover" />
                      <button onClick={() => setConfigForm({ ...configForm, coverUrl: "" })}
                        className="absolute top-2 right-2 w-6 h-6 rounded-full bg-red-500/70 hover:bg-red-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <X className="h-3.5 w-3.5 text-white" />
                      </button>
                    </div>
                  )}
                  <div>
                    <Input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, "cover")} className="hidden" id="cover-upload" />
                    <Label htmlFor="cover-upload"
                      className="cursor-pointer inline-flex items-center gap-2 bg-white/[0.03] hover:bg-white/[0.06] px-4 py-2.5 rounded-xl border border-white/[0.06] text-sm font-semibold text-white/50 hover:text-white/80 transition-all duration-300">
                      <Upload className="h-4 w-4" /><span>رفع غلاف جديد</span>
                    </Label>
                    <p className="text-xs text-white/18 mt-1.5">صورة عريضة تظهر كخلفية لأعلى واجهة الزبون</p>
                  </div>
                </div>
              </div>

              {/* WhatsApp Messages */}
              <div className="space-y-4 pt-4 border-t border-white/[0.04]">
                <Label className="text-white/40 text-[11px] font-medium">رسالة واتساب الافتراضية</Label>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <Label className="text-white/30 text-[10px]">بالعربية</Label>
                    <Textarea value={configForm.whatsappMessageAr} onChange={(e) => setConfigForm({ ...configForm, whatsappMessageAr: e.target.value })}
                      className="mt-1 bg-white/[0.03] border-white/[0.06] text-white placeholder:text-white/15 rounded-xl text-xs min-h-[80px] focus:border-[var(--primary)]/30 focus:ring-1 focus:ring-[var(--primary)]/10 transition-all" />
                  </div>
                  <div>
                    <Label className="text-white/30 text-[10px]">بالفرنسية</Label>
                    <Textarea value={configForm.whatsappMessageFr} onChange={(e) => setConfigForm({ ...configForm, whatsappMessageFr: e.target.value })}
                      className="mt-1 bg-white/[0.03] border-white/[0.06] text-white placeholder:text-white/15 rounded-xl text-xs min-h-[80px] focus:border-[var(--primary)]/30 focus:ring-1 focus:ring-[var(--primary)]/10 transition-all" />
                  </div>
                  <div>
                    <Label className="text-white/30 text-[10px]">بالإنجليزية</Label>
                    <Textarea value={configForm.whatsappMessageEn} onChange={(e) => setConfigForm({ ...configForm, whatsappMessageEn: e.target.value })}
                      className="mt-1 bg-white/[0.03] border-white/[0.06] text-white placeholder:text-white/15 rounded-xl text-xs min-h-[80px] focus:border-[var(--primary)]/30 focus:ring-1 focus:ring-[var(--primary)]/10 transition-all" />
                  </div>
                  <div>
                    <Label className="text-white/30 text-[10px]">بالإسبانية</Label>
                    <Textarea value={configForm.whatsappMessageEs} onChange={(e) => setConfigForm({ ...configForm, whatsappMessageEs: e.target.value })}
                      className="mt-1 bg-white/[0.03] border-white/[0.06] text-white placeholder:text-white/15 rounded-xl text-xs min-h-[80px] focus:border-[var(--primary)]/30 focus:ring-1 focus:ring-[var(--primary)]/10 transition-all" />
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-4 border-t border-white/[0.04]">
                <Button onClick={saveConfig} disabled={isSaving}
                  className="bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-black font-bold px-6 h-11 rounded-xl disabled:opacity-60 disabled:cursor-not-allowed shadow-[0_4px_20px_rgba(200,162,77,0.2)] hover:shadow-[0_6px_24px_rgba(200,162,77,0.3)] transition-all duration-300">
                  {isSaving ? (
                    <><Loader2 className="h-4 w-4 ml-1.5 animate-spin" /><span>جارٍ الحفظ...</span></>
                  ) : (
                    <><Save className="h-4 w-4 ml-1.5" /><span>حفظ جميع التغييرات</span></>
                  )}
                </Button>
                <Button variant="ghost" onClick={onReset}
                  className="text-red-400/60 hover:text-red-300 hover:bg-red-500/8 rounded-xl transition-all duration-300">
                  <RefreshCw className="h-4 w-4 ml-1.5" /><span>إعادة تعيين البيانات الافتراضية</span>
                </Button>
              </div>
            </div>

            {/* QR Code Sidebar */}
            <div className="bg-white/[0.02] backdrop-blur-2xl p-6 rounded-2xl border border-white/[0.04] space-y-5 h-fit shadow-[0_4px_24px_rgba(0,0,0,0.2)]">
              <div>
                <h3 className="text-lg font-bold text-white">مشاركة القائمة</h3>
                <p className="text-xs text-white/25 mt-1">حمّل رمز QR واطبعه ليتمكن زبائنك من الوصول للقائمة مباشرة</p>
              </div>
              <div className="bg-white rounded-2xl p-3 shadow-[0_4px_16px_rgba(0,0,0,0.3)]">
                <img src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(menuUrl)}`} alt="QR Code" className="w-full rounded-xl" />
              </div>
              <Button onClick={downloadQRCode}
                className="w-full bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-black font-bold rounded-xl h-11 shadow-[0_4px_20px_rgba(200,162,77,0.2)] hover:shadow-[0_6px_24px_rgba(200,162,77,0.3)] transition-all duration-300">
                <Download className="h-4 w-4 ml-1.5" /><span>تحميل رمز QR</span>
              </Button>
            </div>
          </TabsContent>

          {/* ═══════════════════════ ACCOUNT TAB ═══════════════════════ */}
          <TabsContent value="account" className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-white">إعدادات الحساب</h2>
              <p className="text-xs text-white/25 mt-0.5">تغيير كلمة المرور الخاصة بحسابك</p>
            </div>

            <div className="bg-white/[0.02] backdrop-blur-2xl p-6 rounded-2xl border border-white/[0.04] space-y-5 max-w-md shadow-[0_4px_24px_rgba(0,0,0,0.2)]">
              {/* Current Password */}
              <div className="space-y-2">
                <Label className="text-white/40 text-[11px] font-medium">كلمة المرور الحالية</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/15" />
                  <Input
                    type={showCurrentPassword ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => { setCurrentPassword(e.target.value); setPasswordError(""); setPasswordSuccess(""); }}
                    className="pl-10 pr-12 bg-white/[0.03] border-white/[0.06] text-white placeholder:text-white/15 rounded-xl h-11 text-sm focus:border-[var(--primary)]/30 focus:ring-1 focus:ring-[var(--primary)]/10 transition-all"
                    placeholder="أدخل كلمة المرور الحالية"
                    dir="ltr"
                  />
                  <button type="button" onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/15 hover:text-white/40 transition-colors" tabIndex={-1}>
                    {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div className="space-y-2">
                <Label className="text-white/40 text-[11px] font-medium">كلمة المرور الجديدة</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/15" />
                  <Input
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => { setNewPassword(e.target.value); setPasswordError(""); setPasswordSuccess(""); }}
                    className="pl-10 pr-12 bg-white/[0.03] border-white/[0.06] text-white placeholder:text-white/15 rounded-xl h-11 text-sm focus:border-[var(--primary)]/30 focus:ring-1 focus:ring-[var(--primary)]/10 transition-all"
                    placeholder="أدخل كلمة المرور الجديدة"
                    dir="ltr"
                  />
                  <button type="button" onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/15 hover:text-white/40 transition-colors" tabIndex={-1}>
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm New Password */}
              <div className="space-y-2">
                <Label className="text-white/40 text-[11px] font-medium">تأكيد كلمة المرور الجديدة</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/15" />
                  <Input
                    type={showConfirmNewPassword ? "text" : "password"}
                    value={confirmNewPassword}
                    onChange={(e) => { setConfirmNewPassword(e.target.value); setPasswordError(""); setPasswordSuccess(""); }}
                    className="pl-10 pr-12 bg-white/[0.03] border-white/[0.06] text-white placeholder:text-white/15 rounded-xl h-11 text-sm focus:border-[var(--primary)]/30 focus:ring-1 focus:ring-[var(--primary)]/10 transition-all"
                    placeholder="أعد كتابة كلمة المرور الجديدة"
                    dir="ltr"
                  />
                  <button type="button" onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/15 hover:text-white/40 transition-colors" tabIndex={-1}>
                    {showConfirmNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Error */}
              {passwordError && (
                <div className="flex items-start gap-3 bg-red-500/8 border border-red-500/15 rounded-xl p-4 text-sm text-red-400/90 backdrop-blur-sm">
                  <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  <span>{passwordError}</span>
                </div>
              )}

              {/* Success */}
              {passwordSuccess && (
                <div className="flex items-start gap-3 bg-green-500/8 border border-green-500/15 rounded-xl p-4 text-sm text-green-400/90 backdrop-blur-sm">
                  <Check className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  <span>{passwordSuccess}</span>
                </div>
              )}

              <Button onClick={handleChangePassword} disabled={isChangingPassword}
                className="w-full bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-black font-bold rounded-xl h-11 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_4px_20px_rgba(200,162,77,0.2)] hover:shadow-[0_6px_24px_rgba(200,162,77,0.3)] transition-all duration-300">
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

          {/* ═══════════════════════ REVIEWS TAB ═══════════════════════ */}
          <TabsContent value="reviews" className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-white">التقييمات والشكاوى</h2>
              <p className="text-xs text-white/25 mt-0.5">مراجعة تقييمات الزبائن وشكاواهم لتحسين الخدمة</p>
            </div>

            {/* Reviews stats */}
            {!reviewsLoading && reviews.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white/[0.02] backdrop-blur-2xl border border-white/[0.04] rounded-2xl p-4 shadow-[0_4px_24px_rgba(0,0,0,0.2)]">
                  <div className="text-[11px] text-white/30 mb-1">إجمالي التقييمات</div>
                  <div className="text-2xl font-bold text-white tracking-tight">{reviews.length}</div>
                </div>
                <div className="bg-white/[0.02] backdrop-blur-2xl border border-white/[0.04] rounded-2xl p-4 shadow-[0_4px_24px_rgba(0,0,0,0.2)]">
                  <div className="text-[11px] text-white/30 mb-1">تقييمات إيجابية</div>
                  <div className="text-2xl font-bold text-emerald-400/80 tracking-tight">{positiveReviews}</div>
                </div>
                <div className="bg-white/[0.02] backdrop-blur-2xl border border-white/[0.04] rounded-2xl p-4 shadow-[0_4px_24px_rgba(0,0,0,0.2)]">
                  <div className="text-[11px] text-white/30 mb-1">شكاوى</div>
                  <div className="text-2xl font-bold text-red-400/60 tracking-tight">{complaints}</div>
                </div>
              </div>
            )}

            {reviewsLoading ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-10 h-10 rounded-2xl border border-[var(--primary)]/15 flex items-center justify-center">
                  <Loader2 className="h-5 w-5 text-[var(--primary)] animate-spin" />
                </div>
              </div>
            ) : reviews.length === 0 ? (
              <div className="bg-white/[0.02] backdrop-blur-2xl p-12 rounded-2xl border border-white/[0.04] text-center shadow-[0_4px_24px_rgba(0,0,0,0.2)]">
                <MessageCircle className="h-12 w-12 mx-auto text-white/6 mb-4" />
                <p className="text-white/30 text-lg">لا توجد تقييمات حالياً</p>
                <p className="text-white/18 text-sm mt-1">ستظهر هنا تقييمات الزبائن وشكاواهم فور ورودها</p>
              </div>
            ) : (
              <div className="space-y-3">
                {reviews.map((review) => (
                  <div key={review.id}
                    className="bg-white/[0.02] backdrop-blur-2xl p-5 rounded-2xl border border-white/[0.04] space-y-3 shadow-[0_4px_20px_rgba(0,0,0,0.2)] hover:border-white/[0.06] transition-all duration-300">
                    <div className="flex items-center justify-between flex-wrap gap-3">
                      <div className="flex items-center gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star key={star}
                            className={`h-5 w-5 ${star <= review.rating ? "text-yellow-400 fill-yellow-400 drop-shadow-[0_0_6px_rgba(250,204,21,0.3)]" : "text-white/8"}`} />
                        ))}
                        <span className="text-xs text-white/25 mr-2">
                          {new Date(review.created_at).toLocaleDateString("ar-MA", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={review.rating >= 4
                          ? "bg-emerald-500/10 text-emerald-400/80 border border-emerald-500/15 backdrop-blur-sm"
                          : "bg-red-500/10 text-red-400/80 border border-red-500/15 backdrop-blur-sm"}>
                          {review.rating >= 4 ? "تقييم إيجابي" : "شكوى"}
                        </Badge>
                        <Button size="icon" variant="ghost"
                          className="h-8 w-8 text-red-400/40 hover:text-red-300 hover:bg-red-500/8 rounded-lg transition-all"
                          onClick={() => handleDeleteReview(review.id)}
                          disabled={deletingReviewId === review.id}>
                          {deletingReviewId === review.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                    {review.feedback ? (
                      <div className="bg-white/[0.03] p-4 rounded-xl border border-white/[0.04]">
                        <p className="text-white/60 text-sm leading-relaxed break-words whitespace-pre-wrap">{review.feedback}</p>
                      </div>
                    ) : (
                      <p className="text-white/18 text-sm">بدون ملاحظات كتابية</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* ═══════════════════════ ANALYTICS TAB ═══════════════════════ */}
          <TabsContent value="analytics" className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-white">تحليلات المنيو</h2>
              <p className="text-xs text-white/25 mt-0.5">إحصائيات مشاهدات المنيو ونقرات واتساب</p>
            </div>

            {analyticsLoading ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-10 h-10 rounded-2xl border border-[var(--primary)]/15 flex items-center justify-center">
                  <Loader2 className="h-5 w-5 text-[var(--primary)] animate-spin" />
                </div>
              </div>
            ) : (
              <>
                {/* Stats cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-white/[0.02] backdrop-blur-2xl border border-white/[0.04] rounded-2xl p-5 shadow-[0_4px_24px_rgba(0,0,0,0.25)] hover:border-white/[0.08] transition-all duration-300">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/15">
                        <Eye className="h-5 w-5 text-blue-400" />
                      </div>
                      <div className="text-[11px] text-white/30">مشاهدات المنيو</div>
                    </div>
                    <div className="text-3xl font-bold text-white tracking-tight">{analytics.scanViews}</div>
                    <p className="text-white/20 text-xs mt-1">عدد مرات مسح QR أو فتح الرابط</p>
                  </div>
                  <div className="bg-white/[0.02] backdrop-blur-2xl border border-white/[0.04] rounded-2xl p-5 shadow-[0_4px_24px_rgba(0,0,0,0.25)] hover:border-white/[0.08] transition-all duration-300">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="h-10 w-10 rounded-xl bg-green-500/10 flex items-center justify-center border border-green-500/15">
                        <MessageCircle className="h-5 w-5 text-green-400" />
                      </div>
                      <div className="text-[11px] text-white/30">نقرات واتساب</div>
                    </div>
                    <div className="text-3xl font-bold text-white tracking-tight">{analytics.whatsappClicks}</div>
                    <p className="text-white/20 text-xs mt-1">عدد مرات النقر على زر طلب واتساب</p>
                  </div>
                  <div className="bg-white/[0.02] backdrop-blur-2xl border border-white/[0.04] rounded-2xl p-5 shadow-[0_4px_24px_rgba(0,0,0,0.25)] hover:border-white/[0.08] transition-all duration-300">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="h-10 w-10 rounded-xl bg-[var(--primary)]/10 flex items-center justify-center border border-[var(--primary)]/15">
                        <BarChart3 className="h-5 w-5 text-[var(--primary)]" />
                      </div>
                      <div className="text-[11px] text-white/30">معدل التحويل</div>
                    </div>
                    <div className="text-3xl font-bold text-white tracking-tight">
                      {analytics.scanViews > 0 ? Math.round((analytics.whatsappClicks / analytics.scanViews) * 100) : 0}%
                    </div>
                    <p className="text-white/20 text-xs mt-1">نسبة النقر على واتساب من المشاهدات</p>
                  </div>
                </div>

                {/* Total events */}
                <div className="bg-white/[0.02] backdrop-blur-2xl border border-white/[0.04] rounded-2xl p-5 shadow-[0_4px_24px_rgba(0,0,0,0.25)]">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[11px] text-white/30 mb-1">إجمالي التفاعلات</div>
                      <div className="text-2xl font-bold text-white tracking-tight">{analytics.totalEvents}</div>
                    </div>
                    <Button
                      onClick={handleResetAnalytics}
                      disabled={resettingAnalytics || analytics.totalEvents === 0}
                      variant="ghost"
                      className="text-red-400/60 hover:text-red-300 hover:bg-red-500/8 rounded-xl transition-all duration-300 disabled:opacity-30"
                    >
                      {resettingAnalytics ? (
                        <Loader2 className="h-4 w-4 ml-1.5 animate-spin" />
                      ) : (
                        <RefreshCw className="h-4 w-4 ml-1.5" />
                      )}
                      <span>تصفير الإحصائيات</span>
                    </Button>
                  </div>
                </div>

                {analytics.totalEvents === 0 && (
                  <div className="bg-white/[0.02] backdrop-blur-2xl p-12 rounded-2xl border border-white/[0.04] text-center shadow-[0_4px_24px_rgba(0,0,0,0.2)]">
                    <BarChart3 className="h-12 w-12 mx-auto text-white/6 mb-4" />
                    <p className="text-white/30 text-lg">لا توجد بيانات تحليلية بعد</p>
                    <p className="text-white/18 text-sm mt-1">ستظهر الإحصائيات فور بدء الزبائن بتصفح المنيو والطلب عبر واتساب</p>
                  </div>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* ═══════════════════════ DISH DIALOG ═══════════════════════ */}
      <Dialog open={isDishDialogOpen} onOpenChange={setIsDishDialogOpen}>
        <DialogContent
          className="bg-[#0D0D0D]/95 backdrop-blur-3xl border border-white/[0.06] text-white max-w-lg max-h-[90vh] overflow-y-auto rounded-[1.5rem] shadow-[0_25px_80px_rgba(0,0,0,0.6)]"
          dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">{editingDish ? "تعديل طبق" : "إضافة طبق جديد"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-white/40 text-[11px] font-medium">الاسم (عربي) <span className="text-red-400">*</span></Label>
                <Input value={dishForm.nameAr || ""} onChange={(e) => { setDishForm({ ...dishForm, nameAr: e.target.value }); setDishErrors(p => ({...p, nameAr: undefined})); }}
                  className={`mt-1 bg-white/[0.04] text-white placeholder:text-white/15 rounded-xl h-10 text-sm focus:border-[var(--primary)]/30 focus:ring-1 focus:ring-[var(--primary)]/10 transition-all ${dishErrors.nameAr ? "border-red-500/60" : "border-white/[0.08]"}`} />
                {dishErrors.nameAr && <p className="text-red-400 text-[10px] mt-1 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{dishErrors.nameAr}</p>}
              </div>
              <div>
                <Label className="text-white/40 text-[11px] font-medium">الاسم (فرنسي)</Label>
                <Input value={dishForm.nameFr || ""} onChange={(e) => setDishForm({ ...dishForm, nameFr: e.target.value })}
                  className="mt-1 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/15 rounded-xl h-10 text-sm focus:border-[var(--primary)]/30 focus:ring-1 focus:ring-[var(--primary)]/10 transition-all" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-white/40 text-[11px] font-medium">الاسم (إنجليزي)</Label>
                <Input value={dishForm.nameEn || ""} onChange={(e) => setDishForm({ ...dishForm, nameEn: e.target.value })}
                  className="mt-1 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/15 rounded-xl h-10 text-sm focus:border-[var(--primary)]/30 focus:ring-1 focus:ring-[var(--primary)]/10 transition-all" />
              </div>
              <div>
                <Label className="text-white/40 text-[11px] font-medium">الاسم (إسباني)</Label>
                <Input value={dishForm.nameEs || ""} onChange={(e) => setDishForm({ ...dishForm, nameEs: e.target.value })}
                  className="mt-1 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/15 rounded-xl h-10 text-sm focus:border-[var(--primary)]/30 focus:ring-1 focus:ring-[var(--primary)]/10 transition-all" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-white/40 text-[11px] font-medium">الوصف (عربي)</Label>
                <Textarea value={dishForm.descriptionAr || ""} onChange={(e) => setDishForm({ ...dishForm, descriptionAr: e.target.value })}
                  className="mt-1 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/15 rounded-xl text-xs min-h-[60px] focus:border-[var(--primary)]/30 focus:ring-1 focus:ring-[var(--primary)]/10 transition-all" />
              </div>
              <div>
                <Label className="text-white/40 text-[11px] font-medium">الوصف (فرنسي)</Label>
                <Textarea value={dishForm.descriptionFr || ""} onChange={(e) => setDishForm({ ...dishForm, descriptionFr: e.target.value })}
                  className="mt-1 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/15 rounded-xl text-xs min-h-[60px] focus:border-[var(--primary)]/30 focus:ring-1 focus:ring-[var(--primary)]/10 transition-all" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-white/40 text-[11px] font-medium">الوصف (إنجليزي)</Label>
                <Textarea value={dishForm.descriptionEn || ""} onChange={(e) => setDishForm({ ...dishForm, descriptionEn: e.target.value })}
                  className="mt-1 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/15 rounded-xl text-xs min-h-[60px] focus:border-[var(--primary)]/30 focus:ring-1 focus:ring-[var(--primary)]/10 transition-all" />
              </div>
              <div>
                <Label className="text-white/40 text-[11px] font-medium">الوصف (إسباني)</Label>
                <Textarea value={dishForm.descriptionEs || ""} onChange={(e) => setDishForm({ ...dishForm, descriptionEs: e.target.value })}
                  className="mt-1 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/15 rounded-xl text-xs min-h-[60px] focus:border-[var(--primary)]/30 focus:ring-1 focus:ring-[var(--primary)]/10 transition-all" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-white/40 text-[11px] font-medium">السعر <span className="text-red-400">*</span></Label>
                <Input type="number" value={dishForm.price && dishForm.price > 0 ? dishForm.price : ""} placeholder="0" onFocus={(e) => e.target.select()} onChange={(e) => { const v = e.target.value === "" ? 0 : Number(e.target.value); setDishForm({ ...dishForm, price: v }); setDishErrors(p => ({...p, price: undefined})); }}
                  className={`mt-1 bg-white/[0.04] text-white placeholder:text-white/15 rounded-xl h-10 text-sm focus:border-[var(--primary)]/30 focus:ring-1 focus:ring-[var(--primary)]/10 transition-all ${dishErrors.price ? "border-red-500/60" : "border-white/[0.08]"}`} />
                {dishErrors.price && <p className="text-red-400 text-[10px] mt-1 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{dishErrors.price}</p>}
              </div>
              <div>
                <Label className="text-white/40 text-[11px] font-medium">الفئة <span className="text-red-400">*</span></Label>
                <Select value={dishForm.category} onValueChange={(val) => { setDishForm({ ...dishForm, category: val }); setDishErrors(p => ({...p, category: undefined})); }}>
                  <SelectTrigger className={`mt-1 bg-white/[0.04] text-white rounded-xl h-10 text-sm focus:border-[var(--primary)]/30 transition-all ${dishErrors.category ? "border-red-500/60" : "border-white/[0.08]"}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#151515]/95 backdrop-blur-xl border-white/[0.08] text-white rounded-xl">
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id} className="focus:bg-white/[0.06] focus:text-white">{c.nameAr}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {dishErrors.category && <p className="text-red-400 text-[10px] mt-1 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{dishErrors.category}</p>}
              </div>
            </div>
            <div>
              <Label className="text-white/40 text-[11px] font-medium">صورة الطبق</Label>
              <div className="flex items-center gap-3 mt-1">
                <div className="h-14 w-14 rounded-xl overflow-hidden border border-white/[0.08] flex-shrink-0 shadow-[0_2px_10px_rgba(0,0,0,0.3)]">
                  <img src={dishForm.image || ""} alt="Preview" className="w-full h-full object-cover" />
                </div>
                <div>
                  <Input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, "dish")} className="hidden" id="dish-image-upload" />
                  <Label htmlFor="dish-image-upload"
                    className="cursor-pointer inline-flex items-center gap-1.5 bg-white/[0.04] hover:bg-white/[0.08] px-3 py-2 rounded-xl border border-white/[0.08] text-xs font-semibold text-white/60 hover:text-white/90 transition-all duration-300">
                    <Upload className="h-3.5 w-3.5" /><span>رفع صورة</span>
                  </Label>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center justify-between bg-white/[0.02] px-3 py-2 rounded-xl border border-white/[0.04]">
                <Label className="text-white/40 text-xs">متوفر</Label>
                <Switch checked={dishForm.isAvailable} onCheckedChange={(v) => setDishForm({ ...dishForm, isAvailable: v })} />
              </div>
              <div className="flex items-center justify-between bg-white/[0.02] px-3 py-2 rounded-xl border border-white/[0.04]">
                <Label className="text-white/40 text-xs">جديد</Label>
                <Switch checked={dishForm.isNew} onCheckedChange={(v) => setDishForm({ ...dishForm, isNew: v })} />
              </div>
              <div className="flex items-center justify-between bg-white/[0.02] px-3 py-2 rounded-xl border border-white/[0.04]">
                <Label className="text-white/40 text-xs">الأكثر طلباً</Label>
                <Switch checked={dishForm.isBestSeller} onCheckedChange={(v) => setDishForm({ ...dishForm, isBestSeller: v })} />
              </div>
              <div className="flex items-center justify-between bg-white/[0.02] px-3 py-2 rounded-xl border border-white/[0.04]">
                <Label className="text-white/40 text-xs">نباتي</Label>
                <Switch checked={dishForm.isVegetarian} onCheckedChange={(v) => setDishForm({ ...dishForm, isVegetarian: v })} />
              </div>
              <div className="flex items-center justify-between bg-white/[0.02] px-3 py-2 rounded-xl border border-white/[0.04]">
                <Label className="text-white/40 text-xs">حلال</Label>
                <Switch checked={dishForm.isHalal} onCheckedChange={(v) => setDishForm({ ...dishForm, isHalal: v })} />
              </div>
              <div className="flex items-center justify-between bg-white/[0.02] px-3 py-2 rounded-xl border border-white/[0.04]">
                <Label className="text-white/40 text-xs">خالي من الغلوتين</Label>
                <Switch checked={dishForm.isGlutenFree} onCheckedChange={(v) => setDishForm({ ...dishForm, isGlutenFree: v })} />
              </div>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-white/[0.06] bg-white/[0.02] px-3 py-2 rounded-xl">
              <Label className="text-white/40 text-xs">عرض ترويجي</Label>
              <Switch checked={dishForm.isPromo} onCheckedChange={(v) => setDishForm({ ...dishForm, isPromo: v })} />
            </div>
            {dishForm.isPromo && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-white/40 text-[11px] font-medium">وسم العرض (عربي)</Label>
                  <Input value={dishForm.promoLabelAr || ""} onChange={(e) => setDishForm({ ...dishForm, promoLabelAr: e.target.value })}
                    className="mt-1 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/15 rounded-xl h-10 text-sm focus:border-[var(--primary)]/30 focus:ring-1 focus:ring-[var(--primary)]/10 transition-all" />
                </div>
                <div>
                  <Label className="text-white/40 text-[11px] font-medium">وسم العرض (فرنسي)</Label>
                  <Input value={dishForm.promoLabelFr || ""} onChange={(e) => setDishForm({ ...dishForm, promoLabelFr: e.target.value })}
                    className="mt-1 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/15 rounded-xl h-10 text-sm focus:border-[var(--primary)]/30 focus:ring-1 focus:ring-[var(--primary)]/10 transition-all" />
                </div>
                <div>
                  <Label className="text-white/40 text-[11px] font-medium">وسم العرض (إنجليزي)</Label>
                  <Input value={dishForm.promoLabelEn || ""} onChange={(e) => setDishForm({ ...dishForm, promoLabelEn: e.target.value })}
                    className="mt-1 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/15 rounded-xl h-10 text-sm focus:border-[var(--primary)]/30 focus:ring-1 focus:ring-[var(--primary)]/10 transition-all" />
                </div>
                <div>
                  <Label className="text-white/40 text-[11px] font-medium">وسم العرض (إسباني)</Label>
                  <Input value={dishForm.promoLabelEs || ""} onChange={(e) => setDishForm({ ...dishForm, promoLabelEs: e.target.value })}
                    className="mt-1 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/15 rounded-xl h-10 text-sm focus:border-[var(--primary)]/30 focus:ring-1 focus:ring-[var(--primary)]/10 transition-all" />
                </div>
                <div>
                  <Label className="text-white/40 text-[11px] font-medium">نص العرض (عربي)</Label>
                  <Input value={dishForm.promoTextAr || ""} onChange={(e) => setDishForm({ ...dishForm, promoTextAr: e.target.value })}
                    className="mt-1 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/15 rounded-xl h-10 text-sm focus:border-[var(--primary)]/30 focus:ring-1 focus:ring-[var(--primary)]/10 transition-all" />
                </div>
                <div>
                  <Label className="text-white/40 text-[11px] font-medium">نص العرض (فرنسي)</Label>
                  <Input value={dishForm.promoTextFr || ""} onChange={(e) => setDishForm({ ...dishForm, promoTextFr: e.target.value })}
                    className="mt-1 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/15 rounded-xl h-10 text-sm focus:border-[var(--primary)]/30 focus:ring-1 focus:ring-[var(--primary)]/10 transition-all" />
                </div>
                <div>
                  <Label className="text-white/40 text-[11px] font-medium">نص العرض (إنجليزي)</Label>
                  <Input value={dishForm.promoTextEn || ""} onChange={(e) => setDishForm({ ...dishForm, promoTextEn: e.target.value })}
                    className="mt-1 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/15 rounded-xl h-10 text-sm focus:border-[var(--primary)]/30 focus:ring-1 focus:ring-[var(--primary)]/10 transition-all" />
                </div>
                <div>
                  <Label className="text-white/40 text-[11px] font-medium">نص العرض (إسباني)</Label>
                  <Input value={dishForm.promoTextEs || ""} onChange={(e) => setDishForm({ ...dishForm, promoTextEs: e.target.value })}
                    className="mt-1 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/15 rounded-xl h-10 text-sm focus:border-[var(--primary)]/30 focus:ring-1 focus:ring-[var(--primary)]/10 transition-all" />
                </div>
              </div>
            )}

            {/* ══════ قسم المكملات المقترحة (Upsells) ══════ */}
            <div className="pt-4 border-t border-white/[0.06]">
              <div className="flex items-center gap-2 mb-3">
                <Link2 className="h-4 w-4 text-purple-400" />
                <Label className="text-white/50 text-sm font-bold">المكملات المقترحة (Upsells)</Label>
              </div>
              <p className="text-white/25 text-xs mb-3 leading-relaxed">
                اختر أطباقاً إضافية لتُقترح على الزبون عند إضافة هذا الطبق إلى السلة. مثلاً: بطاطس مقلية، مشروب، صوص إضافي...
              </p>
              {upsellCandidates.length === 0 ? (
                <p className="text-white/20 text-xs py-3 text-center bg-white/[0.01] rounded-xl border border-white/[0.04]">
                  لا توجد أطباق أخرى متاحة للربط. أضف أطباقاً أخرى أولاً.
                </p>
              ) : (
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1 bg-white/[0.01] rounded-xl border border-white/[0.04] p-2">
                  {upsellCandidates.map((candidate) => {
                    const isChecked = currentUpsellIds.includes(candidate.id);
                    return (
                      <button
                        key={candidate.id}
                        type="button"
                        onClick={() => toggleUpsell(candidate.id)}
                        className={`w-full flex items-center justify-between p-2.5 rounded-xl transition-all duration-200 border ${
                          isChecked
                            ? "bg-purple-500/8 border-purple-500/20 hover:bg-purple-500/12"
                            : "bg-white/[0.01] border-transparent hover:bg-white/[0.03] hover:border-white/[0.05]"
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-lg overflow-hidden flex-shrink-0 border border-white/[0.06]">
                            <img src={candidate.image} alt={candidate.nameAr} className="w-full h-full object-cover" />
                          </div>
                          <div className="text-right min-w-0">
                            <div className="text-white/70 text-xs font-semibold truncate">{candidate.nameAr}</div>
                            <div className="text-white/30 text-[10px]">{candidate.price} {config.currencyAr}</div>
                          </div>
                        </div>
                        <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                          isChecked
                            ? "bg-purple-500 border-purple-500"
                            : "border-white/[0.12] bg-transparent"
                        }`}>
                          {isChecked && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
              {currentUpsellIds.length > 0 && (
                <div className="mt-2 flex items-center gap-2">
                  <Badge className="bg-purple-500/10 text-purple-400/80 border border-purple-500/15 text-[10px]">
                    <Link2 className="h-2.5 w-2.5 ml-1 inline-block" />
                    {currentUpsellIds.length} مكملات مقترحة
                  </Badge>
                </div>
              )}
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <Button variant="ghost" onClick={() => setIsDishDialogOpen(false)} disabled={isSaving}
                className="text-white/40 hover:text-white/70 hover:bg-white/[0.04] rounded-xl transition-all disabled:opacity-30">إلغاء</Button>
              <Button onClick={saveDish} disabled={isSaving}
                className="bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-black font-bold rounded-xl px-6 shadow-[0_4px_20px_rgba(200,162,77,0.2)] hover:shadow-[0_6px_24px_rgba(200,162,77,0.3)] transition-all duration-300 disabled:opacity-50">
                {isSaving ? (<><Loader2 className="h-4 w-4 ml-1.5 animate-spin" /><span>جاري الحفظ...</span></>) : (<><Save className="h-4 w-4 ml-1.5" /><span>حفظ</span></>)}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ═══════════════════════ CATEGORY DIALOG ═══════════════════════ */}
      <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
        <DialogContent
          className="bg-[#0D0D0D]/95 backdrop-blur-3xl border border-white/[0.06] text-white max-w-md rounded-[1.5rem] shadow-[0_25px_80px_rgba(0,0,0,0.6)]"
          dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">{editingCategory ? "تعديل فئة" : "إضافة فئة جديدة"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label className="text-white/40 text-[11px] font-medium">الاسم (عربي)</Label>
              <Input value={categoryForm.nameAr || ""} onChange={(e) => setCategoryForm({ ...categoryForm, nameAr: e.target.value })}
                className="mt-1 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/15 rounded-xl h-10 text-sm focus:border-[var(--primary)]/30 focus:ring-1 focus:ring-[var(--primary)]/10 transition-all" />
            </div>
            <div>
              <Label className="text-white/40 text-[11px] font-medium">الاسم (فرنسي)</Label>
              <Input value={categoryForm.nameFr || ""} onChange={(e) => setCategoryForm({ ...categoryForm, nameFr: e.target.value })}
                className="mt-1 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/15 rounded-xl h-10 text-sm focus:border-[var(--primary)]/30 focus:ring-1 focus:ring-[var(--primary)]/10 transition-all" />
            </div>
            <div>
              <Label className="text-white/40 text-[11px] font-medium">الاسم (إنجليزي)</Label>
              <Input value={categoryForm.nameEn || ""} onChange={(e) => setCategoryForm({ ...categoryForm, nameEn: e.target.value })}
                className="mt-1 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/15 rounded-xl h-10 text-sm focus:border-[var(--primary)]/30 focus:ring-1 focus:ring-[var(--primary)]/10 transition-all" />
            </div>
            <div>
              <Label className="text-white/40 text-[11px] font-medium">الاسم (إسباني)</Label>
              <Input value={categoryForm.nameEs || ""} onChange={(e) => setCategoryForm({ ...categoryForm, nameEs: e.target.value })}
                className="mt-1 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/15 rounded-xl h-10 text-sm focus:border-[var(--primary)]/30 focus:ring-1 focus:ring-[var(--primary)]/10 transition-all" />
            </div>
            <div>
              <Label className="text-white/40 text-[11px] font-medium">الأيقونة</Label>
              <Select value={categoryForm.icon} onValueChange={(val) => setCategoryForm({ ...categoryForm, icon: val })}>
                <SelectTrigger className="mt-1 bg-white/[0.04] border-white/[0.08] text-white rounded-xl h-10 text-sm focus:border-[var(--primary)]/30 transition-all">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#151515]/95 backdrop-blur-xl border-white/[0.08] text-white rounded-xl">
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
              <Button variant="ghost" onClick={() => setIsCategoryDialogOpen(false)}
                className="text-white/40 hover:text-white/70 hover:bg-white/[0.04] rounded-xl transition-all">إلغاء</Button>
              <Button onClick={saveCategory}
                className="bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-black font-bold rounded-xl px-6 shadow-[0_4px_20px_rgba(200,162,77,0.2)] hover:shadow-[0_6px_24px_rgba(200,162,77,0.3)] transition-all duration-300">
                <Save className="h-4 w-4 ml-1.5" /><span>حفظ</span>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}