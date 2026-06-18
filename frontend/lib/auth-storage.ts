"use client";

import type { AuthUser } from "./auth-context";

export const AUTH_STORAGE_KEY = "domusvesta_auth_v1";
export const AUTH_EXPIRED_EVENT = "domusvesta_auth_expired";

type StoredAuth = {
  token: string;
  user: AuthUser;
};

function canUseBrowserStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function getStoredAuth(): StoredAuth | null {
  if (!canUseBrowserStorage()) return null;

  try {
    const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as StoredAuth;
    if (!parsed?.token || !parsed?.user) return null;

    return parsed;
  } catch {
    clearStoredAuth();
    return null;
  }
}

export function getStoredToken() {
  return getStoredAuth()?.token || null;
}

export function saveStoredAuth(token: string, user: AuthUser) {
  if (!canUseBrowserStorage()) return;
  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ token, user }));
}

export function clearStoredAuth() {
  if (!canUseBrowserStorage()) return;
  window.localStorage.removeItem(AUTH_STORAGE_KEY);
}

export function notifyAuthExpired() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
}
