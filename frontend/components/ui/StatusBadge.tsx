"use client";

import { clsx } from "clsx";

const statusStyles: Record<string, string> = {
  open: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
  booked: "bg-sky-500/20 text-sky-300 border-sky-500/40",
  in_progress: "bg-amber-500/20 text-amber-300 border-amber-500/40",
  completed: "bg-slate-500/20 text-slate-300 border-slate-500/40",
  cancelled: "bg-rose-500/20 text-rose-300 border-rose-500/40",
  pending: "bg-amber-500/20 text-amber-300 border-amber-500/40",
  accepted: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
  rejected: "bg-rose-500/20 text-rose-300 border-rose-500/40",
  succeeded: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
  failed: "bg-rose-500/20 text-rose-300 border-rose-500/40",
};

export function StatusBadge({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  const style = statusStyles[status] || "bg-slate-500/20 text-slate-300 border-slate-500/40";
  const label = String(status).replace(/_/g, " ");
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize",
        style,
        className
      )}
    >
      {label}
    </span>
  );
}
