import React from "react";
import { Save, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Dish, Category } from "../../types";
import { useToast } from "@/hooks/use-toast";

interface DishDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingDish: Dish | null;
  initialForm: Partial<Dish>;
  categories: Category[];
  onSave: (form: Partial<Dish>) => void;
}

export default function DishDialog({ open, onOpenChange, editingDish, initialForm, categories, onSave }: DishDialogProps) {
  const [dishForm, setDishForm] = React.useState<Partial<Dish>>({});
  const { toast } = useToast();

  React.useEffect(() => {
    if (open) {
      setDishForm({
        ...initialForm,
        nameAr: initialForm.nameAr || "",
        nameFr: initialForm.nameFr || "",
        descriptionAr: initialForm.descriptionAr || "",
        descriptionFr: initialForm.descriptionFr || "",
        price: initialForm.price || 0,
        category: initialForm.category || categories[0]?.id || "",
        image: initialForm.image || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80",
        isAvailable: initialForm.isAvailable ?? true,
        isNew: initialForm.isNew ?? false,
        isBestSeller: initialForm.isBestSeller ?? false,
        isVegetarian: initialForm.isVegetarian ?? false,
        isHalal: initialForm.isHalal ?? true,
        isGlutenFree: initialForm.isGlutenFree ?? false,
        isPromo: initialForm.isPromo ?? false,
        promoLabelAr: initialForm.promoLabelAr || "",
        promoLabelFr: initialForm.promoLabelFr || "",
        promoTextAr: initialForm.promoTextAr || "",
        promoTextFr: initialForm.promoTextFr || "",
      });
    }
  }, [open, initialForm, categories]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setDishForm((prev) => ({ ...prev, image: reader.result as string }));
      toast({ title: "تم رفع الصورة بنجاح", description: "تم تحويل الصورة وحفظها محلياً" });
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    if (!dishForm.nameAr || !dishForm.nameFr || !dishForm.price) {
      toast({ title: "تنبيه", description: "يرجى ملء جميع الحقول المطلوبة", variant: "destructive" });
      return;
    }
    onSave(dishForm);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
                <Input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" id="dish-image-upload" />
                <Label htmlFor="dish-image-upload" className="cursor-pointer inline-flex items-center gap-1.5 bg-white/[0.04] hover:bg-white/[0.07] px-3 py-2 rounded-xl border border-white/[0.08] text-xs font-semibold text-white/70 hover:text-white transition-all">
                  <Upload className="h-3.5 w-3.5" /><span>رفع صورة</span>
                </Label>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center justify-between">
              <Label className="text-white/60 text-xs">متوفر</Label>
              <Switch checked={dishForm.isAvailable} onCheckedChange={(v) => setDishForm({ ...dishForm, isAvailable: v })} className="data-[state=checked]:bg-[#C8A24D]" />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-white/60 text-xs">جديد</Label>
              <Switch checked={dishForm.isNew} onCheckedChange={(v) => setDishForm({ ...dishForm, isNew: v })} className="data-[state=checked]:bg-[#C8A24D]" />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-white/60 text-xs">الأكثر طلباً</Label>
              <Switch checked={dishForm.isBestSeller} onCheckedChange={(v) => setDishForm({ ...dishForm, isBestSeller: v })} className="data-[state=checked]:bg-[#C8A24D]" />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-white/60 text-xs">نباتي</Label>
              <Switch checked={dishForm.isVegetarian} onCheckedChange={(v) => setDishForm({ ...dishForm, isVegetarian: v })} className="data-[state=checked]:bg-[#C8A24D]" />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-white/60 text-xs">حلال</Label>
              <Switch checked={dishForm.isHalal} onCheckedChange={(v) => setDishForm({ ...dishForm, isHalal: v })} className="data-[state=checked]:bg-[#C8A24D]" />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-white/60 text-xs">خالي من الغلوتين</Label>
              <Switch checked={dishForm.isGlutenFree} onCheckedChange={(v) => setDishForm({ ...dishForm, isGlutenFree: v })} className="data-[state=checked]:bg-[#C8A24D]" />
            </div>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-white/[0.06]">
            <Label className="text-white/60 text-xs">عرض ترويجي</Label>
            <Switch checked={dishForm.isPromo} onCheckedChange={(v) => setDishForm({ ...dishForm, isPromo: v })} className="data-[state=checked]:bg-[#C8A24D]" />
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