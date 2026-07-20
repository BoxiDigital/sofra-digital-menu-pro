import React from "react";
import { Settings, LogOut, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface AdminHeaderProps {
  restaurantId?: string;
  onLogout?: () => void;
}

export default function AdminHeader({ restaurantId, onLogout }: AdminHeaderProps) {
  return (
    <header className="bg-white/[0.02] border-b border-white/[0.06] sticky top-0 z-40 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            to={restaurantId ? `/?restaurant=${restaurantId}` : "/"}
            className="h-10 w-10 rounded-xl bg-[#C8A24D]/15 flex items-center justify-center text-[#C8A24D] border border-[#C8A24D]/20 hover:bg-[#C8A24D]/25 transition-colors"
            title="عرض المنيو"
          >
            <Settings className="h-5 w-5" />
          </Link>
          <div>
            <Link
              to={restaurantId ? `/?restaurant=${restaurantId}` : "/"}
              className="text-base font-bold text-white hover:text-[#C8A24D] transition-colors"
            >
              لوحة إدارة شِي نُو
            </Link>
            <p className="text-xs text-white/35">تعديل فوري لقائمة الطعام والمظهر</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {restaurantId && (
            <Link to={`/?restaurant=${restaurantId}`} target="_blank">
              <Button variant="ghost" size="sm" className="text-[#C8A24D] hover:text-[#D4B35D] hover:bg-white/5 rounded-xl gap-1.5">
                <Eye className="h-4 w-4" />
                <span className="hidden sm:inline">عرض المنيو</span>
              </Button>
            </Link>
          )}
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