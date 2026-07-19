import React, { useState } from "react";
import { Lock, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

interface AdminLoginProps {
  onLogin: () => void;
}

export default function AdminLogin({ onLogin }: AdminLoginProps) {
  const [email, setEmail] = useState("admin@sofra.com");
  const [password, setPassword] = useState("admin123");
  const { toast } = useToast();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (email === "admin@sofra.com" && password === "admin123") {
      onLogin();
      toast({ title: "تم تسجيل الدخول بنجاح", description: "مرحباً بك في لوحة تحكم مطعم شِي نُو" });
    } else {
      toast({ title: "خطأ في تسجيل الدخول", description: "البريد الإلكتروني أو كلمة المرور غير صحيحة", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0D0D0D] px-4 py-12" dir="rtl">
      <div className="max-w-md w-full space-y-8 bg-white/[0.03] p-8 rounded-2xl border border-white/[0.06] backdrop-blur-sm">
        <div className="text-center">
          <div className="mx-auto h-14 w-14 rounded-2xl bg-[#C8A24D]/15 flex items-center justify-center text-[#C8A24D] mb-5 border border-[#C8A24D]/20">
            <Lock className="h-7 w-7" />
          </div>
          <h2 className="text-2xl font-extrabold text-white">لوحة تحكم المدير</h2>
          <p className="mt-2 text-sm text-white/40">سجل الدخول لإدارة قائمة الطعام وتخصيص المظهر</p>
        </div>
        <form className="mt-8 space-y-5" onSubmit={handleLogin}>
          <div className="space-y-4">
            <div>
              <Label className="text-white/70 text-sm">البريد الإلكتروني</Label>
              <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1.5 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/25 rounded-xl h-11" placeholder="admin@sofra.com" />
            </div>
            <div>
              <Label className="text-white/70 text-sm">كلمة المرور</Label>
              <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1.5 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/25 rounded-xl h-11" placeholder="••••••••" />
            </div>
          </div>
          <div className="bg-[#C8A24D]/10 border border-[#C8A24D]/20 rounded-xl p-3.5 text-xs text-[#C8A24D] flex items-start gap-2.5">
            <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">بيانات الدخول التجريبية:</span><br />
              البريد: <code className="font-mono text-white/60">admin@sofra.com</code><br />
              الرمز: <code className="font-mono text-white/60">admin123</code>
            </div>
          </div>
          <Button type="submit" className="w-full py-6 bg-[#C8A24D] hover:bg-[#D4B35D] text-black font-bold rounded-xl text-base">تسجيل الدخول</Button>
        </form>
      </div>
    </div>
  );
}