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

const STORAGE_KEY = "domusvesta_auth_v1";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as { token: string; user: AuthUser };
      setToken(parsed.token);
      setUser(parsed.user);
      setApiAuthToken(parsed.token);
    } finally {
      setIsReady(true);
    }
  }, []);

  const setAuth = (newToken: string, newUser: AuthUser) => {
    setToken(newToken);
    setUser(newUser);
    setApiAuthToken(newToken);
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ token: newToken, user: newUser })
    );
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setApiAuthToken(null);
    localStorage.removeItem(STORAGE_KEY);
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

