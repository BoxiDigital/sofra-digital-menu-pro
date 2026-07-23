import React, { useState } from "react";
import { Link, useNavigate, Navigate } from "react-router-dom";
import { Mail, Lock, UserPlus, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const { register, isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  if (!authLoading && isAuthenticated) {
    return <Navigate to="/admin" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

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
      toast({
        title: "🎉 تم التسجيل بنجاح",
        description: "تم إنشاء حسابك وتوجيهك إلى لوحة التحكم",
      });
      navigate("/admin", { replace: true });
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
          <h2 className="text-2xl font-extrabold text-white">إنشاء حساب جديد</h2>
          <p className="text-sm text-white/50">
            سجل مطعمك الآن وابدأ في إدارة قائمتك الرقمية
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
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
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError("");
                }}
                className="block w-full pl-10 pr-4 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/20 rounded-xl h-12 text-sm focus:border-[#C8A24D]/40 focus:ring-[#C8A24D]/10 transition-all"
                placeholder="••••••••"
                dir="ltr"
              />
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-white/50 text-xs font-semibold mb-2 block">
              تأكيد كلمة المرور
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20" />
              <Input
                type="password"
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setError("");
                }}
                className="block w-full pl-10 pr-4 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/20 rounded-xl h-12 text-sm focus:border-[#C8A24D]/40 focus:ring-[#C8A24D]/10 transition-all"
                placeholder="••••••••"
                dir="ltr"
              />
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
