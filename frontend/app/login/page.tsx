"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { api } from "../../lib/api";
import { useAuth } from "../../lib/auth-context";
import { setApiAuthToken } from "../../lib/api";

type LoginResponse = {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: "client" | "professional" | "admin";
    location?: string;
  };
};

const roleToDashboard = (role: LoginResponse["user"]["role"]) => {
  if (role === "admin") return "/admin/dashboard";
  if (role === "professional") return "/pro/dashboard";
  return "/client/dashboard";
};

export default function LoginPage() {
  const router = useRouter();
  const { setAuth, user, isReady, token } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isReady) return;
    if (token && user) router.replace(roleToDashboard(user.role));
  }, [isReady, token, user, router]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const res = await api.post<LoginResponse>("/api/auth/login", {
        email,
        password,
      });
      setAuth(res.data.token, res.data.user);
      setApiAuthToken(res.data.token);
      router.replace(roleToDashboard(res.data.user.role));
    } catch (err: any) {
      setError(err?.response?.data?.message || "Login failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto max-w-md px-4 py-12">
        <Link href="/" className="text-sm text-slate-400 hover:text-sky-400">
          ← Back to home
        </Link>

        <h1 className="mt-6 text-2xl font-semibold tracking-tight">Login</h1>
        <p className="mt-1 text-sm text-slate-400">
          Sign in to manage bookings, jobs, and approvals.
        </p>

        <form
          onSubmit={onSubmit}
          className="mt-8 space-y-3 rounded-3xl border border-slate-800 bg-slate-900/60 p-5"
        >
          <div className="space-y-1">
            <label className="text-xs text-slate-400">Email</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              required
              className="h-10 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 text-sm outline-none focus:border-sky-500"
              placeholder="you@example.com"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-400">Password</label>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              required
              className="h-10 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 text-sm outline-none focus:border-sky-500"
              placeholder="••••••••"
            />
          </div>

          {error ? (
            <div className="rounded-xl border border-rose-900/60 bg-rose-950/30 px-3 py-2 text-xs text-rose-200">
              {error}
            </div>
          ) : null}

          <button
            disabled={isSubmitting}
            className="h-10 w-full rounded-xl bg-sky-500 text-sm font-medium text-slate-950 hover:bg-sky-400 disabled:opacity-60"
          >
            {isSubmitting ? "Signing in..." : "Login"}
          </button>

          <div className="pt-2 text-center text-xs text-slate-400">
            New here?{" "}
            <Link href="/signup" className="text-sky-400 hover:text-sky-300">
              Create an account
            </Link>
          </div>
        </form>
      </div>
    </main>
  );
}

