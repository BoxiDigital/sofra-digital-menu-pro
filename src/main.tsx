import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./globals.css";

// تنظيف أي بيانات قديمة للمستخدم والتخزين المؤقت (مرة واحدة فقط)
const CLEANUP_FLAG = "sofra_cleanup_done_v61";
if (!localStorage.getItem(CLEANUP_FLAG)) {
  // حذف بيانات المستخدم المسجل والجلسة فقط (الإصدار 60 لم يكن يستخدم sofra_auth_user)
  // نحتفظ بإعدادات وبيانات المطعم إن وجدت
  localStorage.removeItem("sofra_user");
  localStorage.removeItem("sofra_auth_user");
  localStorage.removeItem("sofra_restaurant");
  // تعليم أن التنظيف تم
  localStorage.setItem(CLEANUP_FLAG, "1");
}

createRoot(document.getElementById("root")!).render(<App />);