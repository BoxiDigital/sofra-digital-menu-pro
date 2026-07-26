import React, { useState } from "react";
import { Link, useNavigate, Navigate } from "react-router-dom";
import { Mail, Lock, Store, UserPlus, AlertCircle, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "../contexts/AuthContext";
import { seedMyDefaultData } from "../utils/storage";
import { useToast } from "@/hooks/use-toast";

export default function Register() {
  const [email, setEmail] = useState("");
  const [restaurantName, setRestaurantName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const { register, isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // إذا كان مسجلاً بالفعل، وجهه للوحة التحكم
  if (!authLoading && isAuthenticated) {
    return <Navigate to="/admin" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!restaurantName.trim()) {
      setError("يرجى إدخال اسم المطعم");
      return;
    }
    if (password !== confirmPassword) {
      setError("كلمة المرور غير متطابقة");
      return;
    }
    if (password.length < 6) {
      setError("كلمة المرور يجب أن تكون 6 أحرف على الأقل");
      return;
    }

    setIsSubmitting(true);

    try {
      await register(email, password);

      try {
        // تهيئة بيانات المطعم مع slug
        const result = await seedMyDefaultData(restaurantName.trim(), `Restaurant ${restaurantName.trim()}`);

        toast({
          title: "🎉 تم التسجيل بنجاح",
          description: "تم إنشاء حسابك وتجهيز القائمة الافتراضية لمطعمك",
        });
        // توجيه للوحة التحكم مع رابط المنيو الخاص
        navigate(`/admin?slug=${result.slug}`, { replace: true });
      } catch (seedErr: any) {
        console.error("[Register] Seed error:", seedErr);
        toast({
          title: "🎉 تم إنشاء الحساب",
          description: "يرجى تأكيد بريدك الإلكتروني ثم تسجيل الدخول لتهيئة بيانات المطعم",
        });
        navigate("/login", { replace: true });
      }
    } catch (err: any) {
      setError(err.message || "حدث خطأ في التسجيل");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0D0D0D] px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#C8A24D]/10 border border-[#C8A24D]/20 mb-6">
            <UserPlus className="h-8 w-8 text-[#C8A24D]" />
          </div>
          <h2 className="text-2xl font-extrabold text-white">سجل مطعمك الآن</h2>
          <p className="text-sm text-white/50">
            أنشئ حسابك وابدأ في إدارة قائمتك الرقمية
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-3">
            <Label className="text-white/50 text-xs font-semibold mb-2 block">
              اسم المطعم
            </Label>
            <div className="relative">
              <Store className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20" />
              <Input
                type="text"
                required
                value={restaurantName}
                onChange={(e) => {
                  setRestaurantName(e.target.value);
                  setError("");
                }}
                className="block w-full pl-10 pr-4 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/20 rounded-xl h-12 text-sm focus:border-[#C8A24D]/40 focus:ring-[#C8A24D]/10 transition-all"
                placeholder="مثال: مطعم الأصالة"
                dir="rtl"
              />
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-white/50 text-xs font-semibold mb-2 block">
              البريد الإلكتروني
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20" />
              <Input
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError("");
                }}
                className="block w-full pl-10 pr-4 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/20 rounded-xl h-12 text-sm focus:border-[#C8A24D]/40 focus:ring-[#C8A24D]/10 transition-all"
                placeholder="example@gmail.com"
                dir="ltr"
              />
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-white/50 text-xs font-semibold mb-2 block">
              كلمة المرور
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20" />
              <Input
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError("");
                }}
                className="block w-full pl-10 pr-12 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/20 rounded-xl h-12 text-sm focus:border-[#C8A24D]/40 focus:ring-[#C8A24D]/10 transition-all"
                placeholder="••••••••"
                dir="ltr"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/50 transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-white/50 text-xs font-semibold mb-2 block">
              تأكيد كلمة المرور
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20" />
              <Input
                type={showConfirmPassword ? "text" : "password"}
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setError("");
                }}
                className="block w-full pl-10 pr-12 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/20 rounded-xl h-12 text-sm focus:border-[#C8A24D]/40 focus:ring-[#C8A24D]/10 transition-all"
                placeholder="••••••••"
                dir="ltr"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/50 transition-colors"
                tabIndex={-1}
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-sm text-red-400">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-6 bg-[#C8A24D] hover:bg-[#D4B35D] text-black font-bold rounded-xl text-base disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-lg shadow-[#C8A24D]/10"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <span className="w-5 h-5 border-2 border-black/30 border-t-black/80 rounded-full animate-spin" />
                جاري إنشاء الحساب...
              </span>
            ) : (
              "إنشاء الحساب"
            )}
          </Button>
        </form>

        <div className="text-center text-xs text-white/25">
          لديك حساب بالفعل؟{" "}
          <Link to="/login" className="text-[#C8A24D] hover:text-[#D4B35D] font-medium transition-colors">
            تسجيل الدخول
          </Link>
        </div>
      </div>
    </div>
  );
}