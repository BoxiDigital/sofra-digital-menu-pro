import React, { useState } from "react";
import { Link, useNavigate, Navigate } from "react-router-dom";
import { Mail, Lock, AlertCircle, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { login, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  if (!isLoading && isAuthenticated) {
    return <Navigate to="/admin" replace />;
  }

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
    <div className="min-h-screen flex items-center justify-center bg-[#0D0D0D] px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#C8A24D]/10 border border-[#C8A24D]/20 mb-6">
            <Mail className="h-8 w-8 text-[#C8A24D]" />
          </div>
          <h2 className="text-2xl font-extrabold text-white">تسجيل الدخول</h2>
          <p className="text-sm text-white/50">
            أدخل بياناتك للوصول إلى لوحة التحكم
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
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
                  setError(null);
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
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(null);
                }}
                className="block w-full pl-10 pr-4 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/20 rounded-xl h-12 text-sm focus:border-[#C8A24D]/40 focus:ring-[#C8A24D]/10 transition-all"
                placeholder="••••••••"
                dir="ltr"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
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
                جاري الدخول...
              </span>
            ) : (
              "دخول"
            )}
          </Button>
        </form>

        <div className="text-center text-xs text-white/25">
          لا تملك حساب؟{" "}
          <Link to="/register" className="text-[#C8A24D] hover:text-[#D4B35D] font-medium transition-colors">
            سجل مطعمك الآن
          </Link>
        </div>
      </div>
    </div>
  );
}
