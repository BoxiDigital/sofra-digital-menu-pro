import React from "react";
import { Save, RefreshCw, Upload, X, Image as ImageIcon, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RestaurantConfig } from "../../types";
import { useToast } from "@/hooks/use-toast";

interface AdminSettingsTabProps {
  config: RestaurantConfig;
  onUpdateConfig: (config: RestaurantConfig) => void;
  onReset: () => void;
}

export default function AdminSettingsTab({ config, onUpdateConfig, onReset }: AdminSettingsTabProps) {
  const [configForm, setConfigForm] = React.useState<RestaurantConfig>({ ...config });
  const { toast } = useToast();

  React.useEffect(() => {
    setConfigForm({ ...config });
  }, [config]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, type: "logo" | "cover") => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      if (type === "cover") setConfigForm((prev) => ({ ...prev, coverUrl: base64String }));
      else setConfigForm((prev) => ({ ...prev, logoUrl: base64String }));
      toast({ title: "تم رفع الصورة بنجاح", description: "تم تحويل الصورة وحفظها محلياً" });
    };
    reader.readAsDataURL(file);
  };

  const saveConfig = () => {
    onUpdateConfig(configForm);
    toast({ title: "تم حفظ الإعدادات", description: "تم تحديث معلومات المطعم والألوان بنجاح" });
  };

  const downloadQRCode = async () => {
    const currentUrl = window.location.origin;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(currentUrl)}`;
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
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-4 border-t border-white/[0.06]">
          <div>
            <Label className="text-white/60 text-xs">اللون الرئيسي</Label>
            <div className="flex gap-3 items-center mt-2">
              <Input type="color" value={configForm.primaryColor} onChange={(e) => setConfigForm({ ...configForm, primaryColor: e.target.value })} className="w-12 h-10 p-1 rounded-xl cursor-pointer border-white/10 bg-transparent" />
              <Input type="text" value={configForm.primaryColor} onChange={(e) => setConfigForm({ ...configForm, primaryColor: e.target.value })} className="font-mono bg-white/[0.04] border-white/[0.08] text-white rounded-xl h-10 text-sm" />
            </div>
          </div>
          <div>
            <Label className="text-white/60 text-xs">نمط الخلفية</Label>
            <Select value={configForm.backgroundColor} onValueChange={(val: any) => setConfigForm({ ...configForm, backgroundColor: val })}>
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
          <Button onClick={saveConfig} className="bg-[#C8A24D] hover:bg-[#D4B35D] text-black font-bold px-6 h-11 rounded-xl">
            <Save className="h-4 w-4 ml-1.5" /><span>حفظ جميع التغييرات</span>
          </Button>
          <Button variant="ghost" onClick={onReset} className="text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl">
            <RefreshCw className="h-4 w-4 ml-1.5" /><span>إعادة تعيين البيانات الافتراضية</span>
          </Button>
        </div>
      </div>

      <div className="bg-white/[0.03] p-6 rounded-2xl border border-white/[0.06] space-y-4 h-fit">
        <h3 className="text-lg font-bold text-white">مشاركة القائمة</h3>
        <p className="text-xs text-white/35">حمّل رمز QR واطبعه ليتمكن زبائنك من الوصول للقائمة مباشرة</p>
        <div className="bg-white rounded-2xl p-3">
          <img src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(window.location.origin)}`} alt="QR Code" className="w-full rounded-xl" />
        </div>
        <Button onClick={downloadQRCode} className="w-full bg-[#C8A24D] hover:bg-[#D4B35D] text-black font-bold rounded-xl h-11">
          <Download className="h-4 w-4 ml-1.5" /><span>تحميل رمز QR</span>
        </Button>
      </div>
    </div>
  );
}