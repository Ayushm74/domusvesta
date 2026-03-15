"use client";

import { ButtonHTMLAttributes, ReactNode } from "react";
import { clsx } from "clsx";

type Variant = "primary" | "secondary" | "danger" | "ghost";

export function Button({
  children,
  variant = "primary",
  className,
  disabled,
  loading,
  ...props
}: {
  children: ReactNode;
  variant?: Variant;
  className?: string;
  loading?: boolean;
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  const base = "inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 focus:ring-offset-slate-950 disabled:pointer-events-none disabled:opacity-60";
  const variants = {
    primary: "bg-sky-500 text-slate-950 hover:bg-sky-400",
    secondary: "border border-slate-700 bg-slate-800 text-slate-200 hover:border-slate-600 hover:bg-slate-700",
    danger: "bg-rose-600 text-white hover:bg-rose-500",
    ghost: "text-slate-300 hover:bg-slate-800 hover:text-slate-100",
  };
  return (
    <button
      className={clsx(base, variants[variant], className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <>
          <svg
            className="mr-2 h-4 w-4 animate-spin text-current"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          Loading...
        </>
      ) : (
        children
      )}
    </button>
  );
}
