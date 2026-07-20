import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Dish, Category, RestaurantConfig } from "../types";
import AdminHeader from "./admin/AdminHeader";
import AdminDishesTab from "./admin/AdminDishesTab";
import AdminCategoriesTab from "./admin/AdminCategoriesTab";
import AdminSettingsTab from "./admin/AdminSettingsTab";
import DishDialog from "./admin/DishDialog";
import CategoryDialog from "./admin/CategoryDialog";

interface AdminViewProps {
  categories: Category[];
  dishes: Dish[];
  config: RestaurantConfig;
  restaurantId?: string;
  onUpdateCategories: (categories: Category[]) => void;
  onUpdateDishes: (dishes: Dish[]) => void;
  onUpdateConfig: (config: RestaurantConfig) => void;
  onReset: () => void;
}

export default function AdminView({
  categories,
  dishes,
  config,
  restaurantId,
  onUpdateCategories,
  onUpdateDishes,
  onUpdateConfig,
  onReset,
}: AdminViewProps) {
  const { toast } = useToast();

  const [editingDish, setEditingDish] = useState<Dish | null>(null);
  const [dishForm, setDishForm] = useState<Partial<Dish>>({});
  const [isDishDialogOpen, setIsDishDialogOpen] = useState(false);

  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryForm, setCategoryForm] = useState<Partial<Category>>({});
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);

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

  const openEditDish = (dish: Dish) => {
    setEditingDish(dish);
    setDishForm({ ...dish });
    setIsDishDialogOpen(true);
  };

  const saveDish = (form: Partial<Dish>) => {
    let updatedDishes: Dish[];
    if (editingDish) {
      updatedDishes = dishes.map((d) => (d.id === editingDish.id ? (form as Dish) : d));
      toast({ title: "تم التعديل", description: "تم تعديل الطبق بنجاح" });
    } else {
      const newDish: Dish = {
        ...(form as Dish),
        id: `dish_${Date.now()}`,
        restaurantId: restaurantId || form.restaurantId || "rest_001",
      };
      updatedDishes = [...dishes, newDish];
      toast({ title: "تم الإضافة", description: "تم إضافة الطبق الجديد بنجاح" });
    }
    onUpdateDishes(updatedDishes);
    setIsDishDialogOpen(false);
  };

  const deleteDish = (id: string) => {
    if (confirm("هل أنت متأكد من حذف هذا الطبق؟")) {
      onUpdateDishes(dishes.filter((d) => d.id !== id));
      toast({ title: "تم الحذف", description: "تم حذف الطبق بنجاح" });
    }
  };

  const toggleDishAvailability = (id: string) => {
    const dish = dishes.find((d) => d.id === id);
    if (!dish) return;
    const newStatus = !dish.isAvailable;
    const updated = dishes.map((d) => d.id === id ? { ...d, isAvailable: newStatus } : d);
    onUpdateDishes(updated);
    toast({
      title: newStatus ? "تم تفعيل الطبق" : "تم تعطيل الطبق",
      description: newStatus ? "الطبق متوفر الآن للزبائن" : "الطبق غير متوفر حالياً (مخفي عن الزبائن)",
    });
  };

  const reactivateDish = (id: string) => {
    onUpdateDishes(dishes.map((d) => d.id === id ? { ...d, isAvailable: true } : d));
    toast({ title: "تم إعادة تفعيل الطبق", description: "عاد الطبق للظهور في قائمة الزبائن" });
  };

  const openAddCategory = () => {
    setEditingCategory(null);
    setCategoryForm({ nameAr: "", nameFr: "", icon: "Utensils" });
    setIsCategoryDialogOpen(true);
  };

  const openEditCategory = (category: Category) => {
    setEditingCategory(category);
    setCategoryForm({ ...category });
    setIsCategoryDialogOpen(true);
  };

  const saveCategory = (form: Partial<Category>) => {
      let updatedCategories: Category[];
      if (editingCategory) {
        updatedCategories = categories.map((c) => (c.id === editingCategory.id ? (form as Category) : c));
        toast({ title: "تم التعديل", description: "تم تعديل الفئة بنجاح" });
      } else {
        const newCategory: Category = {
          ...(form as Category),
          id: `cat_${Date.now()}`,
          restaurantId: restaurantId || form.restaurantId || "rest_001",
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
      toast({ title: "لا يمكن الحذف", description: "هذه الفئة تحتوي على أطباق نشطة. يرجى نقل الأطباق أو حذفها أولاً.", variant: "destructive" });
      return;
    }
    if (confirm("هل أنت متأكد من حذف هذه الفئة؟")) {
      onUpdateCategories(categories.filter((c) => c.id !== id));
      toast({ title: "تم الحذف", description: "تم حذف الفئة بنجاح" });
    }
  };

  return (
    <div className="min-h-screen bg-[#0D0D0D] pb-12" dir="rtl">
      <AdminHeader restaurantId={restaurantId} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <Tabs defaultValue="dishes" className="space-y-6">
          <TabsList className="bg-white/[0.03] border border-white/[0.06] p-1 rounded-2xl w-full max-w-lg flex">
            <TabsTrigger value="dishes" className="flex-1 py-2.5 rounded-xl font-bold text-sm data-[state=active]:bg-[#C8A24D] data-[state=active]:text-black data-[state=inactive]:text-white/40 data-[state=inactive]:hover:text-white/70 transition-all">الأطباق</TabsTrigger>
            <TabsTrigger value="categories" className="flex-1 py-2.5 rounded-xl font-bold text-sm data-[state=active]:bg-[#C8A24D] data-[state=active]:text-black data-[state=inactive]:text-white/40 data-[state=inactive]:hover:text-white/70 transition-all">الفئات</TabsTrigger>
            <TabsTrigger value="settings" className="flex-1 py-2.5 rounded-xl font-bold text-sm data-[state=active]:bg-[#C8A24D] data-[state=active]:text-black data-[state=inactive]:text-white/40 data-[state=inactive]:hover:text-white/70 transition-all">الإعدادات</TabsTrigger>
          </TabsList>

          <TabsContent value="dishes">
            <AdminDishesTab
              dishes={dishes}
              categories={categories}
              currency={config.currencyAr}
              onAddDish={openAddDish}
              onEditDish={openEditDish}
              onDeleteDish={deleteDish}
              onToggleAvailability={toggleDishAvailability}
              onReactivateDish={reactivateDish}
            />
          </TabsContent>

          <TabsContent value="categories">
            <AdminCategoriesTab
              categories={categories}
              dishes={dishes}
              onAddCategory={openAddCategory}
              onEditCategory={openEditCategory}
              onDeleteCategory={deleteCategory}
            />
          </TabsContent>

          <TabsContent value="settings">
            <AdminSettingsTab
              config={config}
              onUpdateConfig={onUpdateConfig}
              onReset={onReset}
            />
          </TabsContent>
        </Tabs>
      </div>

      <DishDialog
        open={isDishDialogOpen}
        onOpenChange={setIsDishDialogOpen}
        editingDish={editingDish}
        initialForm={dishForm}
        categories={categories}
        onSave={saveDish}
      />

      <CategoryDialog
        open={isCategoryDialogOpen}
        onOpenChange={setIsCategoryDialogOpen}
        editingCategory={editingCategory}
        initialForm={categoryForm}
        onSave={saveCategory}
      />
    </div>
  );
}