"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { api, setApiAuthToken } from "../../lib/api";
import { useAuth } from "../../lib/auth-context";

type RegisterResponse = {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: "client" | "professional" | "admin";
    location?: string;
  };
};

const roleToDashboard = (role: RegisterResponse["user"]["role"]) => {
  if (role === "admin") return "/admin/dashboard";
  if (role === "professional") return "/pro/dashboard";
  return "/client/dashboard";
};

export default function SignupPage() {
  const router = useRouter();
  const { setAuth, user, token, isReady } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [location, setLocation] = useState("");
  const [role, setRole] = useState<"client" | "professional">("client");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isReady) return;
    if (token && user) router.replace(roleToDashboard(user.role));
  }, [isReady, token, user, router]);

  const canSubmit = useMemo(() => {
    return name.trim() && email.trim() && password.trim();
  }, [name, email, password]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setError(null);
    setIsSubmitting(true);
    try {
      const res = await api.post<RegisterResponse>("/api/auth/register", {
        name,
        email,
        password,
        role,
        location,
      });
      setAuth(res.data.token, res.data.user);
      setApiAuthToken(res.data.token);
      router.replace(roleToDashboard(res.data.user.role));
    } catch (err: any) {
      setError(err?.response?.data?.message || "Sign up failed");
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

        <h1 className="mt-6 text-2xl font-semibold tracking-tight">Sign up</h1>
        <p className="mt-1 text-sm text-slate-400">
          Create an account to post jobs or offer services.
        </p>

        <form
          onSubmit={onSubmit}
          className="mt-8 space-y-3 rounded-3xl border border-slate-800 bg-slate-900/60 p-5"
        >
          <div className="space-y-1">
            <label className="text-xs text-slate-400">Account type</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: "client", label: "Household" },
                { value: "professional", label: "Professional" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setRole(opt.value as any)}
                  className={[
                    "h-10 rounded-xl border px-3 text-sm",
                    role === opt.value
                      ? "border-sky-500 bg-sky-500/10 text-sky-200"
                      : "border-slate-700 bg-slate-950 text-slate-200 hover:border-slate-500",
                  ].join(" ")}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-400">Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="h-10 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 text-sm outline-none focus:border-sky-500"
              placeholder="Your name"
            />
          </div>

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

          <div className="space-y-1">
            <label className="text-xs text-slate-400">
              Location <span className="text-slate-500">(optional)</span>
            </label>
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="h-10 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 text-sm outline-none focus:border-sky-500"
              placeholder="Leicester"
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
            {isSubmitting ? "Creating..." : "Create account"}
          </button>

          <div className="pt-2 text-center text-xs text-slate-400">
            Already have an account?{" "}
            <Link href="/login" className="text-sky-400 hover:text-sky-300">
              Login
            </Link>
          </div>
        </form>
      </div>
    </main>
  );
}

