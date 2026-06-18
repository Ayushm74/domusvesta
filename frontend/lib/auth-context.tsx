"use client";

import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { setApiAuthToken } from "./api";
import {
  AUTH_EXPIRED_EVENT,
  clearStoredAuth,
  getStoredAuth,
  saveStoredAuth,
} from "./auth-storage";

export type UserRole = "client" | "professional" | "admin";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  location?: string;
};

type AuthState = {
  token: string | null;
  user: AuthUser | null;
  isReady: boolean;
};

type AuthContextValue = AuthState & {
  setAuth: (token: string, user: AuthUser) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    try {
      const storedAuth = getStoredAuth();
      if (!storedAuth) return;
      setToken(storedAuth.token);
      setUser(storedAuth.user);
      setApiAuthToken(storedAuth.token);
    } finally {
      setIsReady(true);
    }
  }, []);

  useEffect(() => {
    const handleAuthExpired = () => {
      setToken(null);
      setUser(null);
      setApiAuthToken(null);
    };

    window.addEventListener(AUTH_EXPIRED_EVENT, handleAuthExpired);
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, handleAuthExpired);
  }, []);

  const setAuth = (newToken: string, newUser: AuthUser) => {
    setToken(newToken);
    setUser(newUser);
    setApiAuthToken(newToken);
    saveStoredAuth(newToken, newUser);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setApiAuthToken(null);
    clearStoredAuth();
  };

  const value = useMemo<AuthContextValue>(
    () => ({ token, user, isReady, setAuth, logout }),
    [token, user, isReady]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

