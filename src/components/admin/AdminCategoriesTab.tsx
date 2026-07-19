import React from "react";
import { Plus, Edit, Trash2, Utensils } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Category, Dish } from "../../types";
import { Sparkles, Beef, Sandwich, Cake, Coffee } from "lucide-react";

const iconMap: Record<string, React.ComponentType<any>> = {
  Sparkles,
  Utensils,
  Beef,
  Sandwich,
  Cake,
  Coffee,
};

interface AdminCategoriesTabProps {
  categories: Category[];
  dishes: Dish[];
  onAddCategory: () => void;
  onEditCategory: (category: Category) => void;
  onDeleteCategory: (id: string) => void;
}

export default function AdminCategoriesTab({
  categories,
  dishes,
  onAddCategory,
  onEditCategory,
  onDeleteCategory,
}: AdminCategoriesTabProps) {
  return (
    <div className="space-y-5">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-white">إدارة الفئات</h2>
          <p className="text-xs text-white/35 mt-0.5">{categories.length} فئة</p>
        </div>
        <Button onClick={onAddCategory} className="bg-[#C8A24D] hover:bg-[#D4B35D] text-black font-bold rounded-xl h-10 px-4">
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
                <div className="h-11 w-11 rounded-xl bg-[#C8A24D]/10 flex items-center justify-center text-[#C8A24D] border border-[#C8A24D]/20">
                  <IconComponent className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">{cat.nameAr}</h3>
                  <p className="text-xs text-white/35">{cat.nameFr} • {dishCount} أطباق</p>
                </div>
              </div>
              <div className="flex gap-1">
                <Button size="icon" variant="ghost" className="h-8 w-8 text-[#C8A24D] hover:text-[#D4B35D] hover:bg-white/5 rounded-lg" onClick={() => onEditCategory(cat)}><Edit className="h-4 w-4" /></Button>
                <Button size="icon" variant="ghost" className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg" onClick={() => onDeleteCategory(cat.id)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}