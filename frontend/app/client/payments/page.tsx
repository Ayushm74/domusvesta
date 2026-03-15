"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "../../../lib/api";
import { PaymentRow, type PaymentRowPayment } from "../../../components/PaymentRow";
import { Spinner } from "../../../components/ui/Spinner";

export default function ClientPaymentsPage() {
  const paymentsQuery = useQuery({
    queryKey: ["client", "payments"],
    queryFn: async () => {
      const res = await api.get<PaymentRowPayment[]>("/api/jobs/payments/my");
      return res.data;
    },
  });

  const payments = paymentsQuery.data ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-100">Payments</h1>
        <p className="mt-1 text-sm text-slate-400">
          Payment history for your completed jobs.
        </p>
      </div>

      {paymentsQuery.isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      ) : paymentsQuery.error ? (
        <div className="rounded-2xl border border-rose-900/60 bg-rose-950/30 px-4 py-3 text-sm text-rose-200">
          Failed to load payments.
        </div>
      ) : payments.length === 0 ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-8 text-center text-sm text-slate-400">
          No payments yet.
        </div>
      ) : (
        <div className="space-y-2">
          {payments.map((p) => (
            <PaymentRow key={p._id} payment={p} />
          ))}
        </div>
      )}
    </div>
  );
}
