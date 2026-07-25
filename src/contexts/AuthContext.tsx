import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AuthUser } from "../types";

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  needsSetup: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // مراقبة جلسة Supabase Auth
  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email || "",
          restaurantId: "rest_001",
        });
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => {
      data.subscription.unsubscribe();
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      throw new Error(error.message === "Invalid login credentials"
        ? "البريد الإلكتروني أو كلمة المرور غير صحيحة"
        : error.message);
    }
  }, []);

  const register = useCallback(async (email: string, password: string) => {
      const { data, error } = await supabase.auth.signUp({ email, password });
  
      if (error) {
        throw new Error(error.message);
      }
  
      // إذا تم تأكيد المستخدم تلقائياً (بدون بريد تحقق)، سجّل دخوله فوراً
      if (data.session) {
        setUser({
          id: data.session.user.id,
          email: data.session.user.email || "",
          restaurantId: "rest_001",
        });
      }
      // إذا احتاج تأكيد بريد إلكتروني، لا نرمي خطأ - نترك المستخدم يسجل دخوله بعد التأكيد
    }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
  }, []);

  const needsSetup = !isLoading && !user;

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        register,
        logout,
        isAuthenticated: !!user,
        needsSetup,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}