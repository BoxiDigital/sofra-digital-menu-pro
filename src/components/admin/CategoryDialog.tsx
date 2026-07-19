import React from "react";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Category } from "../../types";
import { useToast } from "@/hooks/use-toast";

interface CategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingCategory: Category | null;
  initialForm: Partial<Category>;
  onSave: (form: Partial<Category>) => void;
}

export default function CategoryDialog({ open, onOpenChange, editingCategory, initialForm, onSave }: CategoryDialogProps) {
  const [categoryForm, setCategoryForm] = React.useState<Partial<Category>>({});
  const { toast } = useToast();

  React.useEffect(() => {
    if (open) {
      setCategoryForm({
        nameAr: initialForm.nameAr || "",
        nameFr: initialForm.nameFr || "",
        icon: initialForm.icon || "Utensils",
      });
    }
  }, [open, initialForm]);

  const handleSave = () => {
    if (!categoryForm.nameAr || !categoryForm.nameFr) {
      toast({ title: "تنبيه", description: "يرجى ملء جميع الحقول المطلوبة", variant: "destructive" });
      return;
    }
    onSave(categoryForm);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
            <Button variant="ghost" onClick={() => onOpenChange(false)} className="text-white/50 rounded-xl">إلغاء</Button>
            <Button onClick={handleSave} className="bg-[#C8A24D] hover:bg-[#D4B35D] text-black font-bold rounded-xl px-6">
              <Save className="h-4 w-4 ml-1.5" /><span>حفظ</span>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}