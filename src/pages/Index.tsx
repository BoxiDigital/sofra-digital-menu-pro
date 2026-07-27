import { Link } from "react-router-dom";
import { Store, LogIn, QrCode, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Index() {
  return (
    <div className="min-h-screen bg-[#0D0D0D] flex flex-col">
      {/* Hero Section */}
      <section className="flex-1 flex flex-col items-center justify-center px-4 py-16 text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-[#C8A24D]/10 border border-[#C8A24D]/20 mb-8">
          <Sparkles className="h-10 w-10 text-[#C8A24D]" />
        </div>

        <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-4 leading-tight">
          قائمتك الرقمية
          <br />
          <span className="text-[#C8A24D]">في متناول الجميع</span>
        </h1>

        <p className="text-white/50 text-sm sm:text-base max-w-md mb-10 leading-relaxed">
          منصة سُفرة تتيح لك إنشاء قائمة رقمية احترافية لمطعمك، ومشاركتها عبر رابط أو كود QR.
          الزبائن يتصفحون المنيو ويطلبون مباشرة عبر واتساب.
        </p>

        <Link to="/login" className="w-full max-w-xs">
                  <Button className="w-full py-6 bg-[#C8A24D] hover:bg-[#D4B35D] text-black font-bold rounded-xl text-base transition-all shadow-lg shadow-[#C8A24D]/10">
                    <LogIn className="h-4 w-4 ml-2" />
                    تسجيل الدخول
                  </Button>
                </Link>
      </section>

      {/* Features */}
      <section className="py-12 px-4 border-t border-white/[0.06]">
        <div className="max-w-3xl mx-auto grid sm:grid-cols-3 gap-8">
          <div className="text-center space-y-3">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#C8A24D]/10">
              <Store className="h-5 w-5 text-[#C8A24D]" />
            </div>
            <h3 className="text-white font-semibold text-sm">إدارة سهلة</h3>
            <p className="text-white/40 text-xs leading-relaxed">
              أضف أطباقك وفئاتك وعدّل الأسعار بسهولة من لوحة تحكم بسيطة
            </p>
          </div>

          <div className="text-center space-y-3">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#C8A24D]/10">
              <QrCode className="h-5 w-5 text-[#C8A24D]" />
            </div>
            <h3 className="text-white font-semibold text-sm">رابط وكود QR</h3>
            <p className="text-white/40 text-xs leading-relaxed">
              احصل على رابط خاص بمطعمك وكود QR لتشاركه مع زبائنك
            </p>
          </div>

          <div className="text-center space-y-3">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#C8A24D]/10">
              <Sparkles className="h-5 w-5 text-[#C8A24D]" />
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