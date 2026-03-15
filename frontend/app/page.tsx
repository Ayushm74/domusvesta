"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";

type LandingMeta = {
  categories: { key: string; name: string; description?: string; icon?: string }[];
  testimonials: { _id: string; name: string; role?: string; quote: string }[];
  featuredProfessionals: {
    _id: string;
    averageRating?: number;
    jobsCompleted?: number;
    userId?: { name: string; location?: string };
  }[];
};

export default function LandingPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["landing-meta"],
    queryFn: async () => {
      const res = await api.get<LandingMeta>("/api/meta/landing");
      return res.data;
    },
  });

  const categories = data?.categories ?? [];
  const testimonials = data?.testimonials ?? [];
  const featuredProfessionals = data?.featuredProfessionals ?? [];
  return (
    <main className="min-h-screen flex flex-col bg-slate-950 text-slate-50">
      <header className="border-b border-slate-800">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div className="text-xl font-semibold tracking-tight">DomusVesta</div>
          <nav className="flex items-center gap-6 text-sm">
            <Link href="#how-it-works" className="hover:text-sky-400">
              Find Services
            </Link>
            <Link href="/pro" className="hover:text-sky-400">
              Become Professional
            </Link>
            <Link href="/login" className="hover:text-sky-400">
              Login
            </Link>
            <Link
              href="/signup"
              className="rounded-full bg-sky-500 px-4 py-1.5 text-sm font-medium text-slate-950 hover:bg-sky-400"
            >
              Sign Up
            </Link>
          </nav>
        </div>
      </header>

      <section className="border-b border-slate-800 bg-gradient-to-b from-slate-900 to-slate-950">
        <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-12 md:flex-row md:items-center">
          <div className="flex-1 space-y-6">
            <h1 className="text-3xl font-semibold tracking-tight md:text-5xl">
              Find trusted professionals
              <span className="text-sky-400"> near you</span>.
            </h1>
            <p className="max-w-xl text-sm text-slate-300 md:text-base">
              Book verified plumbers, electricians, cleaners and more in a few
              taps. Transparent pricing, ratings and secure payments.
            </p>

            <div className="flex flex-col gap-2 rounded-2xl bg-slate-900/80 p-3 ring-1 ring-slate-800 md:flex-row md:items-center">
              <input
                placeholder="Service type (e.g. plumber)"
                className="h-10 flex-1 rounded-xl border border-slate-700 bg-slate-950 px-3 text-sm outline-none focus:border-sky-500"
              />
              <input
                placeholder="Location (e.g. Leicester)"
                className="h-10 flex-1 rounded-xl border border-slate-700 bg-slate-950 px-3 text-sm outline-none focus:border-sky-500"
              />
              <button className="mt-2 h-10 rounded-xl bg-sky-500 px-6 text-sm font-medium text-slate-950 hover:bg-sky-400 md:mt-0">
                Search
              </button>
            </div>

            <div className="flex gap-6 text-xs text-slate-400">
              <div>AI‑assisted matching</div>
              <div>Verified professionals</div>
              <div>Secure payments</div>
            </div>
          </div>

          <div className="flex-1 space-y-4 rounded-3xl bg-slate-900/70 p-5 ring-1 ring-slate-800">
            <h2 className="text-sm font-medium text-slate-200">
              Popular categories
            </h2>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {isLoading && categories.length === 0 ? (
                <div className="col-span-2 text-xs text-slate-400">
                  Loading categories...
                </div>
              ) : (
                categories.map((c) => (
                  <button
                    key={c.key}
                    className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-950/60 px-3 py-3 text-left hover:border-sky-500"
                  >
                    <span>
                      <div className="text-sm text-slate-100">{c.name}</div>
                      {c.description ? (
                        <div className="text-[11px] text-slate-400">
                          {c.description}
                        </div>
                      ) : null}
                    </span>
                    <span className="text-[10px] text-sky-400">View</span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-slate-800 bg-slate-950">
        <div className="mx-auto max-w-6xl px-4 py-10">
          <div className="flex items-end justify-between gap-4">
            <h2 className="text-lg font-semibold tracking-tight">
              Featured professionals
            </h2>
            <div className="text-xs text-slate-500">
              Verified and highly rated on DomusVesta
            </div>
          </div>

          <div className="mt-6 grid gap-3 text-sm md:grid-cols-3">
            {isLoading && featuredProfessionals.length === 0 ? (
              <div className="text-xs text-slate-400">
                Loading professionals...
              </div>
            ) : featuredProfessionals.length === 0 ? (
              <div className="text-xs text-slate-400">
                No featured professionals yet.
              </div>
            ) : (
              featuredProfessionals.map((p) => (
                <div
                  key={p._id}
                  className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4"
                >
                  <div className="font-medium text-slate-100">
                    {p.userId?.name ?? "Professional"}
                  </div>
                  <div className="mt-1 text-xs text-slate-400">
                    {p.userId?.location ?? "Service provider"}
                  </div>
                  <div className="mt-2 text-xs text-slate-300">
                    ⭐ {p.averageRating?.toFixed(1) ?? "New"} •{" "}
                    {p.jobsCompleted ?? 0} jobs completed
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      <section
        id="how-it-works"
        className="border-b border-slate-800 bg-slate-950"
      >
        <div className="mx-auto max-w-6xl px-4 py-10">
          <h2 className="text-lg font-semibold tracking-tight">
            How it works
          </h2>
          <div className="mt-6 grid gap-4 text-sm md:grid-cols-4">
            {[
              "Post a Job",
              "Get Matched",
              "Book a Professional",
              "Leave Review",
            ].map((step, i) => (
              <div
                key={step}
                className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4"
              >
                <div className="text-xs text-sky-400">Step {i + 1}</div>
                <div className="mt-2 font-medium">{step}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-slate-800 bg-slate-950">
        <div className="mx-auto max-w-6xl px-4 py-10">
          <h2 className="text-lg font-semibold tracking-tight">
            Loved by households
          </h2>
          <div className="mt-6 grid gap-4 text-sm md:grid-cols-3">
            {isLoading && testimonials.length === 0 ? (
              <div className="text-xs text-slate-400">
                Loading testimonials...
              </div>
            ) : testimonials.length === 0 ? (
              <div className="text-xs text-slate-400">
                No testimonials yet.
              </div>
            ) : (
              testimonials.map((t) => (
                <div
                  key={t._id}
                  className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4"
                >
                  <p className="text-slate-200">“{t.quote}”</p>
                  <div className="mt-3 text-xs text-slate-400">
                    {t.name}
                    {t.role ? ` • ${t.role}` : null}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      <footer className="mt-auto border-t border-slate-800 bg-slate-950">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-6 text-xs text-slate-400 md:flex-row md:items-center md:justify-between">
          <div>&copy; {new Date().getFullYear()} DomusVesta</div>
          <div className="flex gap-4">
            <button>About</button>
            <button>Careers</button>
            <button>Support</button>
            <button>Privacy</button>
            <button>Terms</button>
          </div>
        </div>
      </footer>
    </main>
  );
}

