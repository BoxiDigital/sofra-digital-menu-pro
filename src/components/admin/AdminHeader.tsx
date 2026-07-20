import React from "react";
import { Settings, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AdminHeaderProps {
  onLogout?: () => void;
}

export default function AdminHeader({ onLogout }: AdminHeaderProps) {
  return (
    <header className="bg-white/[0.02] border-b border-white/[0.06] sticky top-0 z-40 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-[#C8A24D]/15 flex items-center justify-center text-[#C8A24D] border border-[#C8A24D]/20">
            <Settings className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white">لوحة إدارة شِي نُو</h1>
            <p className="text-xs text-white/35">تعديل فوري لقائمة الطعام والمظهر</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
                  <span className="text-xs text-white/30 hidden sm:block">مرحباً، مدير المطعم</span>
                  {onLogout && (
                    <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl" onClick={onLogout}>
                      <LogOut className="h-4 w-4 ml-1.5" /><span>خروج</span>
                    </Button>
                  )}
                </div>
      </div>
    </header>
  );
}