"use client";

import { StatusBadge } from "./ui/StatusBadge";

export type PaymentRowPayment = {
  _id: string;
  amount: number;
  platformCommission?: number;
  status: string;
  paymentMethod?: string;
  createdAt: string;
  jobId?: { _id: string; title?: string; status?: string };
};

export function PaymentRow({ payment }: { payment: PaymentRowPayment }) {
  const date = new Date(payment.createdAt).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3">
      <div>
        <div className="font-medium text-slate-100">
          {payment.jobId?.title ?? "Payment"}
        </div>
        <div className="mt-0.5 text-xs text-slate-400">
          £{payment.amount}
          {payment.platformCommission != null && payment.platformCommission > 0 && (
            <> (fee £{payment.platformCommission})</>
          )}{" "}
          • {payment.paymentMethod ?? "card"}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <StatusBadge status={payment.status} />
        <span className="text-xs text-slate-500">{date}</span>
      </div>
    </div>
  );
}
