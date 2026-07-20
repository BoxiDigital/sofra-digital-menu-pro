import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { AuthUser } from "../types";

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const MOCK_USER: AuthUser = {
  id: "user_001",
  email: "admin@sofra.com",
  restaurantId: "rest_001",
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("sofra_auth_user");
    if (stored) {
      setUser(JSON.parse(stored));
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 800));

    if (email === "admin@sofra.com" && password === "admin123") {
      const authUser = { ...MOCK_USER, email };
      localStorage.setItem("sofra_auth_user", JSON.stringify(authUser));
      setUser(authUser);
    } else {
      throw new Error("البريد الإلكتروني أو كلمة المرور غير صحيحة");
    }
    setIsLoading(false);
  }, []);

  const logout = useCallback(async () => {
    localStorage.removeItem("sofra_auth_user");
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        logout,
        isAuthenticated: !!user,
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