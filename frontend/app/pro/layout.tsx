"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { RequireAuth } from "../../components/RequireAuth";
import { useAuth } from "../../lib/auth-context";
import { clsx } from "clsx";

const nav = [
  { href: "/pro/dashboard", label: "Dashboard" },
  { href: "/pro/available", label: "Available Jobs" },
  { href: "/pro/applications", label: "My Applications" },
  { href: "/pro/active-jobs", label: "Active Jobs" },
  { href: "/pro/earnings", label: "Earnings" },
  { href: "/pro/profile", label: "Profile" },
];

function ProLayoutInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-slate-950">
      <header className="sticky top-0 z-10 border-b border-slate-800 bg-slate-950/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <Link href="/pro/dashboard" className="text-lg font-semibold text-slate-100">
            DomusVesta
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-400">{user?.name}</span>
            <button
              onClick={() => {
                logout();
                router.push("/");
              }}
              className="text-sm text-slate-400 hover:text-sky-400"
            >
              Logout
            </button>
          </div>
        </div>
      </header>
      <div className="mx-auto flex max-w-6xl gap-8 px-4 py-6">
        <aside className="hidden w-52 shrink-0 md:block">
          <nav className="space-y-0.5">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  "block rounded-lg px-3 py-2 text-sm font-medium transition",
                  pathname === item.href
                    ? "bg-sky-500/10 text-sky-300"
                    : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}

export default function ProLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth role="professional">
      <ProLayoutInner>{children}</ProLayoutInner>
    </RequireAuth>
  );
}
