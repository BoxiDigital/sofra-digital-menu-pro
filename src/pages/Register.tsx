import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Lock, Mail, Eye, EyeOff, AlertCircle, ArrowLeft,
  Store, Globe, Coffee,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export default function Register() {
  const [step, setStep] = useState<1 | 2>(1);

  // الخطوة الأولى: البريد وكلمة المرور
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // الخطوة الثانية: اسم المطعم
  const [nameAr, setNameAr] = useState("");
  const [nameFr, setNameFr] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { register } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const goToStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError("يرجى إدخال البريد الإلكتروني");
      return;
    }
    if (password.length < 6) {
      setError("كلمة المرور يجب أن تكون 6 أحرف على الأقل");
      return;
    }
    if (password !== confirmPassword) {
      setError("كلمة المرور غير متطابقة");
      return;
    }

    setStep(2);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!nameAr.trim()) {
      setError("يرجى إدخال اسم المطعم بالعربية");
      return;
    }
    if (!nameFr.trim()) {
      setError("يرجى إدخال اسم المطعم بالفرنسية");
      return;
    }

    setIsSubmitting(true);

    try {
      await register(email, password, nameAr.trim(), nameFr.trim());
      toast({
        title: "🎉 تم التسجيل بنجاح!",
        description: `تم إنشاء مطعم "${nameAr}" وجاري توجيهك للوحة التحكم`,
      });
      navigate("/admin", { replace: true });
    } catch (err: any) {
      setError(err.message || "حدث خطأ في التسجيل");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0D0D0D] px-4 py-12 relative overflow-hidden" dir="rtl">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-[#C8A24D]/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-emerald-500/3 rounded-full blur-3xl" />
      </div>

      <Link
        to="/login"
        className="absolute top-6 right-6 flex items-center gap-2 text-white/40 hover:text-white/70 transition-colors text-sm"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>العودة لتسجيل الدخول</span>
      </Link>

      <div className="max-w-md w-full relative z-10">
        {/* الشعار */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 mb-5">
            <Store className="h-8 w-8 text-emerald-400" />
          </div>
          <h1 className="text-2xl font-extrabold text-white">تسجيل مطعم جديد</h1>
          <p className="mt-1.5 text-sm text-white/35">
            {step === 1
              ? "أنشئ حسابك أولاً"
              : "أدخل معلومات مطعمك"}
          </p>

          {/* مؤشر الخطوات */}
          <div className="flex items-center justify-center gap-2 mt-4">
            <div className={`w-2.5 h-2.5 rounded-full transition-colors ${step === 1 ? "bg-[#C8A24D]" : "bg-[#C8A24D]/30"}`} />
            <div className="w-8 h-px bg-white/10" />
            <div className={`w-2.5 h-2.5 rounded-full transition-colors ${step === 2 ? "bg-emerald-400" : "bg-white/10"}`} />
          </div>
        </div>

        {/* البطاقة */}
        <div className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-3xl p-8">
          {step === 1 ? (
            <form onSubmit={goToStep2} className="space-y-5">
              <div>
                <Label className="text-white/50 text-xs font-semibold mb-2 block">البريد الإلكتروني</Label>
                <div className="relative">
                  <Mail className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20" />
                  <Input
                    type="email" required
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(null); }}
                    className="pr-11 pl-4 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/20 rounded-xl h-12 text-sm focus:border-[#C8A24D]/40 focus:ring-[#C8A24D]/10 transition-all"
                    placeholder="example@restaurant.com"
                    dir="ltr"
                  />
                </div>
              </div>

              <div>
                <Label className="text-white/50 text-xs font-semibold mb-2 block">كلمة المرور</Label>
                <div className="relative">
                  <Lock className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20" />
                  <Input
                    type={showPassword ? "text" : "password"} required
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(null); }}
                    className="pr-11 pl-12 bg-white/[0.04] border-white/[0.08] text-white rounded-xl h-12 text-sm focus:border-[#C8A24D]/40 focus:ring-[#C8A24D]/10 transition-all"
                    placeholder="6 أحرف على الأقل"
                    dir="ltr"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <Label className="text-white/50 text-xs font-semibold mb-2 block">تأكيد كلمة المرور</Label>
                <div className="relative">
                  <Lock className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20" />
                  <Input
                    type={showPassword ? "text" : "password"} required
                    value={confirmPassword}
                    onChange={(e) => { setConfirmPassword(e.target.value); setError(null); }}
                    className="pr-11 pl-4 bg-white/[0.04] border-white/[0.08] text-white rounded-xl h-12 text-sm focus:border-[#C8A24D]/40 focus:ring-[#C8A24D]/10 transition-all"
                    placeholder="أعد كتابة كلمة المرور"
                    dir="ltr"
                  />
                </div>
              </div>

              {error && (
                <div className="flex items-start gap-2.5 bg-red-500/8 border border-red-500/20 rounded-xl p-3.5 text-sm text-red-400">
                  <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <Button
                type="submit"
                className="w-full py-6 bg-[#C8A24D] hover:bg-[#D4B35D] text-black font-bold rounded-xl text-base transition-all shadow-lg shadow-[#C8A24D]/10"
              >
                التالي: معلومات المطعم
              </Button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-5">
              <div>
                <Label className="text-white/50 text-xs font-semibold mb-2 block">
                  اسم المطعم (بالعربية) <span className="text-red-400">*</span>
                </Label>
                <div className="relative">
                  <Coffee className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20" />
                  <Input
                    required
                    value={nameAr}
                    onChange={(e) => { setNameAr(e.target.value); setError(null); }}
                    className="pr-11 pl-4 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/20 rounded-xl h-12 text-sm focus:border-emerald-500/40 focus:ring-emerald-500/10 transition-all"
                    placeholder="مثلاً: مطعم الأصالة"
                  />
                </div>
              </div>

              <div>
                <Label className="text-white/50 text-xs font-semibold mb-2 block">
                  اسم المطعم (بالفرنسية) <span className="text-red-400">*</span>
                </Label>
                <div className="relative">
                  <Globe className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20" />
                  <Input
                    required
                    value={nameFr}
                    onChange={(e) => { setNameFr(e.target.value); setError(null); }}
                    className="pr-11 pl-4 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/20 rounded-xl h-12 text-sm focus:border-emerald-500/40 focus:ring-emerald-500/10 transition-all"
                    placeholder="ex: Restaurant Al Assala"
                    dir="ltr"
                  />
                </div>
              </div>

              {error && (
                <div className="flex items-start gap-2.5 bg-red-500/8 border border-red-500/20 rounded-xl p-3.5 text-sm text-red-400">
                  <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => { setStep(1); setError(null); }}
                  className="flex-1 py-3 text-white/50 hover:text-white/70 hover:bg-white/5 rounded-xl border border-white/[0.08]"
                >
                  رجوع
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-[2] py-6 bg-emerald-500 hover:bg-emerald-400 text-white font-bold rounded-xl text-base disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-lg shadow-emerald-500/10"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      جاري إنشاء المطعم...
                    </span>
                  ) : (
                    "إنشاء المطعم والبدء"
                  )}
                </Button>
              </div>
            </form>
          )}
        </div>

        <p className="text-center mt-6 text-xs text-white/25">
          لديك حساب بالفعل؟{" "}
          <Link to="/login" className="text-[#C8A24D] hover:text-[#D4B35D] font-semibold transition-colors">
            تسجيل الدخول
          </Link>
        </p>
      </div>
    </div>
  );
}
