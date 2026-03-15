"use client";

import { ReactNode, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth, UserRole } from "../lib/auth-context";
import { setApiAuthToken } from "../lib/api";

const roleToDashboard = (role: UserRole) => {
  if (role === "admin") return "/admin/dashboard";
  if (role === "professional") return "/pro/dashboard";
  return "/client/dashboard";
};

export function RequireAuth({
  children,
  role,
}: {
  children: ReactNode;
  role: UserRole;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { isReady, token, user } = useAuth();

  useEffect(() => {
    if (!isReady) return;

    setApiAuthToken(token);

    if (!token || !user) {
      router.replace(`/login?next=${encodeURIComponent(pathname || "/")}`);
      return;
    }

    if (user.role !== role) {
      router.replace(roleToDashboard(user.role));
    }
  }, [isReady, token, user, router, pathname, role]);

  if (!isReady) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 text-sm text-slate-400">
        Loading...
      </div>
    );
  }

  if (!token || !user || user.role !== role) {
    return null;
  }

  return <>{children}</>;
}

