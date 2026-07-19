import React from "react";
import { Edit, Trash2, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dish, Category } from "../../types";

interface DishRowProps {
  dish: Dish;
  category?: Category;
  isAvailable: boolean;
  currency: string;
  onToggleAvailability: (id: string) => void;
  onEdit: (dish: Dish) => void;
  onDelete: (id: string) => void;
  onReactivate: (id: string) => void;
}

export default function DishRow({
  dish,
  category,
  isAvailable,
  currency,
  onToggleAvailability,
  onEdit,
  onDelete,
  onReactivate,
}: DishRowProps) {
  if (isAvailable) {
    return (
      <div className="bg-white/[0.03] p-3 rounded-2xl border border-white/[0.06] flex items-center justify-between hover:border-white/[0.10] transition-all gap-3">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="h-12 w-12 rounded-xl overflow-hidden flex-shrink-0 border border-white/10">
            <img src={dish.image} alt={dish.nameAr} className="w-full h-full object-cover" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-white text-sm truncate">{dish.nameAr}</h3>
              {dish.isPromo && <Badge className="bg-[#C8A24D]/20 text-[#C8A24D] border-0 text-[10px] font-bold px-1.5 py-0 rounded-full">عرض</Badge>}
              {category && <span className="text-[10px] text-white/35">({category.nameAr})</span>}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[#C8A24D] font-bold text-sm">{dish.price} {currency}</span>
              <span className="text-emerald-400/70 text-[10px] font-medium">متوفر</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Switch checked={true} onCheckedChange={() => onToggleAvailability(dish.id)} className="data-[state=checked]:bg-[#C8A24D]" />
          <Button size="icon" variant="ghost" className="h-8 w-8 text-[#C8A24D] hover:text-[#D4B35D] hover:bg-white/5 rounded-lg" onClick={() => onEdit(dish)}><Edit className="h-4 w-4" /></Button>
          <Button size="icon" variant="ghost" className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg" onClick={() => onDelete(dish.id)}><Trash2 className="h-4 w-4" /></Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/[0.01] p-3 rounded-2xl border border-red-500/10 flex items-center justify-between opacity-60 hover:opacity-80 transition-all gap-3">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="h-12 w-12 rounded-xl overflow-hidden flex-shrink-0 border border-white/5 relative">
          <img src={dish.image} alt={dish.nameAr} className="w-full h-full object-cover grayscale" />
          <div className="absolute inset-0 bg-black/30" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-bold text-white/40 text-sm truncate line-through decoration-red-400/30">{dish.nameAr}</h3>
            {category && <span className="text-[10px] text-white/20">({category.nameAr})</span>}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[#C8A24D]/40 font-bold text-sm">{dish.price} {currency}</span>
            <Badge className="bg-red-500/15 text-red-400/70 border-0 text-[10px] font-bold px-1.5 py-0 rounded-full">مخفي</Badge>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <Button size="sm" variant="ghost" className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 rounded-lg h-7 gap-1 text-xs" onClick={() => onReactivate(dish.id)}>
          <RefreshCcw className="h-3 w-3" /><span>تفعيل</span>
        </Button>
        <Button size="icon" variant="ghost" className="h-8 w-8 text-[#C8A24D]/50 hover:text-[#D4B35D] hover:bg-white/5 rounded-lg" onClick={() => onEdit(dish)}><Edit className="h-4 w-4" /></Button>
        <Button size="icon" variant="ghost" className="h-8 w-8 text-red-400/50 hover:text-red-300 hover:bg-red-500/10 rounded-lg" onClick={() => onDelete(dish.id)}><Trash2 className="h-4 w-4" /></Button>
      </div>
    </div>
  );
}