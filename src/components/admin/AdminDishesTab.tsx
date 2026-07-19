import React from "react";
import { Plus, Ban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dish, Category } from "../../types";
import DishRow from "./DishRow";

interface AdminDishesTabProps {
  dishes: Dish[];
  categories: Category[];
  currency: string;
  onAddDish: () => void;
  onEditDish: (dish: Dish) => void;
  onDeleteDish: (id: string) => void;
  onToggleAvailability: (id: string) => void;
  onReactivateDish: (id: string) => void;
}

export default function AdminDishesTab({
  dishes,
  categories,
  currency,
  onAddDish,
  onEditDish,
  onDeleteDish,
  onToggleAvailability,
  onReactivateDish,
}: AdminDishesTabProps) {
  const availableDishes = dishes.filter((d) => d.isAvailable);
  const unavailableDishes = dishes.filter((d) => !d.isAvailable);

  return (
    <div className="space-y-5">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-white">إدارة الأطباق</h2>
          <p className="text-xs text-white/35 mt-0.5">{dishes.length} طبق في القائمة ({availableDishes.length} متوفر، {unavailableDishes.length} مخفي)</p>
        </div>
        <Button onClick={onAddDish} className="bg-[#C8A24D] hover:bg-[#D4B35D] text-black font-bold rounded-xl h-10 px-4">
          <Plus className="h-4 w-4 ml-1.5" /><span>إضافة طبق</span>
        </Button>
      </div>

      <div className="space-y-1.5">
        {availableDishes.map((dish) => {
          const cat = categories.find((c) => c.id === dish.category);
          return (
            <DishRow
              key={dish.id}
              dish={dish}
              category={cat}
              isAvailable={true}
              currency={currency}
              onToggleAvailability={onToggleAvailability}
              onEdit={onEditDish}
              onDelete={onDeleteDish}
              onReactivate={onReactivateDish}
            />
          );
        })}
      </div>

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
                <DishRow
                  key={dish.id}
                  dish={dish}
                  category={cat}
                  isAvailable={false}
                  currency={currency}
                  onToggleAvailability={onToggleAvailability}
                  onEdit={onEditDish}
                  onDelete={onDeleteDish}
                  onReactivate={onReactivateDish}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}