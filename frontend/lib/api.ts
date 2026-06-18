"use client";

import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { clearStoredAuth, getStoredToken, notifyAuthExpired } from "./auth-storage";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (process.env.NODE_ENV === "development"
    ? "http://localhost:5000"
    : "https://domusvesta-1.onrender.com");

export const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getStoredToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  } else {
    delete config.headers.Authorization;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ message?: string; code?: string }>) => {
    if (error.response?.status === 401) {
      clearStoredAuth();
      notifyAuthExpired();
    }

    return Promise.reject(error);
  }
);

export const setApiAuthToken = (token: string | null) => {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
};

