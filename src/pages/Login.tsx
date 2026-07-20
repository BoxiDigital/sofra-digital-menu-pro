import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Lock, Mail, Eye, EyeOff, AlertCircle, ArrowLeft, Coffee } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export default function Login() {
  const [email, setEmail] = useState("admin@sofra.com");
  const [password, setPassword] = useState("admin123");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { login } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await login(email, password);
      toast({
        title: "🎉 تم تسجيل الدخول بنجاح",
        description: "مرحباً بك في لوحة تحكم مطعمك",
      });
      navigate("/admin", { replace: true });
    } catch (err: any) {
      setError(err.message || "حدث خطأ في تسجيل الدخول");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0D0D0D] px-4 py-12 relative overflow-hidden" dir="rtl">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-[#C8A24D]/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-[#C8A24D]/3 rounded-full blur-3xl" />
      </div>

      <Link
        to="/"
        className="absolute top-6 right-6 flex items-center gap-2 text-white/40 hover:text-white/70 transition-colors text-sm"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>العودة للقائمة</span>
      </Link>

      <div className="max-w-md w-full relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#C8A24D]/10 border border-[#C8A24D]/20 mb-5">
            <Coffee className="h-8 w-8 text-[#C8A24D]" />
          </div>
          <h1 className="text-2xl font-extrabold text-white">لوحة تحكم المطعم</h1>
          <p className="mt-1.5 text-sm text-white/35">
            سجل الدخول لإدارة قائمتك وتخصيص مطعمك
          </p>
        </div>

        <div className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-3xl p-8 space-y-6">
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <Label className="text-white/50 text-xs font-semibold mb-2 block">
                البريد الإلكتروني
              </Label>
              <div className="relative">
                <Mail className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20" />
                <Input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError(null);
                  }}
                  className="pr-11 pl-4 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/20 rounded-xl h-12 text-sm focus:border-[#C8A24D]/40 focus:ring-[#C8A24D]/10 transition-all"
                  placeholder="admin@sofra.com"
                  dir="ltr"
                />
              </div>
            </div>

            <div>
              <Label className="text-white/50 text-xs font-semibold mb-2 block">
                كلمة المرور
              </Label>
              <div className="relative">
                <Lock className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20" />
                <Input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError(null);
                  }}
                  className="pr-11 pl-12 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/20 rounded-xl h-12 text-sm focus:border-[#C8A24D]/40 focus:ring-[#C8A24D]/10 transition-all"
                  placeholder="••••••••"
                  dir="ltr"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2.5 bg-red-500/8 border border-red-500/20 rounded-xl p-3.5 text-sm text-red-400">
                <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div className="bg-[#C8A24D]/5 border border-[#C8A24D]/15 rounded-xl p-3.5 text-xs text-[#C8A24D]/80 flex items-start gap-2.5">
              <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">بيانات تجريبية:</span>
                <br />
                البريد: <code className="font-mono text-white/50">admin@sofra.com</code>
                <br />
                الرمز: <code className="font-mono text-white/50">admin123</code>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-6 bg-[#C8A24D] hover:bg-[#D4B35D] text-black font-bold rounded-xl text-base disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-lg shadow-[#C8A24D]/10"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <span className="w-5 h-5 border-2 border-black/30 border-t-black/80 rounded-full animate-spin" />
                  جاري تسجيل الدخول...
                </span>
              ) : (
                "تسجيل الدخول"
              )}
            </Button>
          </form>

          <p className="text-center text-xs text-white/25">
            مطعم جديد؟{" "}
            <Link to="/register" className="text-[#C8A24D] hover:text-[#D4B35D] font-semibold transition-colors">
              سجل مطعمك الآن
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}