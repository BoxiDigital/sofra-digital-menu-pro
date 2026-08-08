import { Link } from "react-router-dom";
import { Store, LogIn, QrCode, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Index() {
  return (
    <div className="min-h-screen bg-[#0D0D0D] flex flex-col relative overflow-hidden">
      {/* ─── Animated Background Orbs ─── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[500px] rounded-full blur-[150px] animate-glow-pulse" style={{ background: "radial-gradient(ellipse at center, rgba(var(--primary-r), var(--primary-g), var(--primary-b), 0.2) 0%, transparent 70%)" }} />
        <div className="absolute bottom-0 -right-20 w-[400px] h-[400px] rounded-full blur-[120px] animate-float-slower" style={{ background: "radial-gradient(circle, rgba(var(--primary-r), var(--primary-g), var(--primary-b), 0.12) 0%, transparent 70%)" }} />
        <div className="absolute top-1/3 -left-20 w-[350px] h-[350px] rounded-full blur-[130px] animate-float-wide" style={{ background: "radial-gradient(circle, rgba(var(--primary-r), var(--primary-g), var(--primary-b), 0.1) 0%, transparent 70%)" }} />
      </div>

      {/* Hero Section */}
      <section className="flex-1 flex flex-col items-center justify-center px-4 py-16 text-center relative z-10">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-[var(--primary)]/10 border border-[var(--primary)]/20 mb-8 animate-fade-in-up">
          <Sparkles className="h-10 w-10 text-[var(--primary)]" />
        </div>

        <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-4 leading-tight animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
          قائمتك الرقمية
          <br />
          <span className="text-[var(--primary)]">في متناول الجميع</span>
        </h1>

        <p className="text-white/50 text-sm sm:text-base max-w-md mb-10 leading-relaxed animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
          منصة سُفرة تتيح لك إنشاء قائمة رقمية احترافية لمطعمك، ومشاركتها عبر رابط أو كود QR.
          الزبائن يتصفحون المنيو ويطلبون مباشرة عبر واتساب.
        </p>

        <Link to="/login" className="w-full max-w-xs animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
          <Button className="w-full py-6 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-black font-bold rounded-xl text-base transition-all duration-300 shadow-[0_4px_25px_rgba(var(--primary-r),var(--primary-g),var(--primary-b),0.25)] hover:shadow-[0_8px_35px_rgba(var(--primary-r),var(--primary-g),var(--primary-b),0.4)] active:scale-[0.98]">
            <LogIn className="h-4 w-4 ml-2" />
            تسجيل الدخول
          </Button>
        </Link>
      </section>

      {/* Features */}
            <section className="py-12 px-4 border-t border-white/[0.06] relative z-10">
              <div className="max-w-3xl mx-auto grid sm:grid-cols-3 gap-8 stagger-entrance">
                <div className="text-center space-y-3">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[var(--primary)]/10 border border-[var(--primary)]/10">
                    <Store className="h-5 w-5 text-[var(--primary)]" />
                  </div>
                  <h3 className="text-white font-semibold text-sm">إدارة سهلة</h3>
                  <p className="text-white/40 text-xs leading-relaxed">
                    أضف أطباقك وفئاتك وعدّل الأسعار بسهولة من لوحة تحكم بسيطة
                  </p>
                </div>
      
                <div className="text-center space-y-3">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[var(--primary)]/10 border border-[var(--primary)]/10">
                    <QrCode className="h-5 w-5 text-[var(--primary)]" />
                  </div>
                  <h3 className="text-white font-semibold text-sm">رابط وكود QR</h3>
                  <p className="text-white/40 text-xs leading-relaxed">
                    احصل على رابط خاص بمطعمك وكود QR لتشاركه مع زبائنك
                  </p>
                </div>
      
                <div className="text-center space-y-3">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[var(--primary)]/10 border border-[var(--primary)]/10">
                    <Sparkles className="h-5 w-5 text-[var(--primary)]" />
                  </div>
                  <h3 className="text-white font-semibold text-sm">طلب مباشر</h3>
                  <p className="text-white/40 text-xs leading-relaxed">
                    الزبائن يطلبون أطباقهم مباشرة عبر واتساب بنقرة واحدة
                  </p>
                </div>
              </div>
            </section>

      {/* Footer */}
      <footer className="bg-zinc-900 text-zinc-400 py-6 text-center text-xs border-t border-zinc-800">
        <p>© {new Date().getFullYear()} سُفرة - جميع الحقوق محفوظة</p>
      </footer>
    </div>
  );
}