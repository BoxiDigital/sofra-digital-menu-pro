import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { AuthUser } from "../types";
import { loginUser, registerUser, seedDefaultAdmin, isSuperAdmin } from "../utils/storage";

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, nameAr: string, nameFr: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  isSuperAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // تهيئة المستخدم الإداري الافتراضي
    seedDefaultAdmin();

    const stored = localStorage.getItem("sofra_auth_user");
    if (stored) {
      setUser(JSON.parse(stored));
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 600));

    try {
      const authUser = loginUser(email, password);
      localStorage.setItem("sofra_auth_user", JSON.stringify(authUser));
      setUser(authUser);
    } catch (err) {
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (
    email: string,
    password: string,
    nameAr: string,
    nameFr: string,
  ) => {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 800));

    try {
      const authUser = registerUser(email, password, nameAr, nameFr);
      localStorage.setItem("sofra_auth_user", JSON.stringify(authUser));
      setUser(authUser);
    } catch (err) {
      throw err;
    } finally {
      setIsLoading(false);
    }
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
        register,
        logout,
        isAuthenticated: !!user,
        isSuperAdmin: user ? isSuperAdmin(user.email) : false,
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
