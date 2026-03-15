"use client";

import { ReactNode } from "react";
import { clsx } from "clsx";

export function Card({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={clsx(
        "rounded-2xl border border-slate-800 bg-slate-900/60 p-4 transition hover:border-slate-700",
        className
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={clsx("mb-3 text-sm font-semibold text-slate-100", className)}>{children}</div>;
}
