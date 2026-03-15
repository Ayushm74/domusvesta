"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "../../../lib/api";
import { Card } from "../../../components/ui/Card";
import { Spinner } from "../../../components/ui/Spinner";

type Earnings = {
  totalEarnings: number;
  jobsCompleted: number;
  totalPayouts: number;
};

export default function ProEarningsPage() {
  const earningsQuery = useQuery({
    queryKey: ["pro", "earnings"],
    queryFn: async () => {
      const res = await api.get<Earnings>("/api/professionals/me/earnings");
      return res.data;
    },
  });

  const data = earningsQuery.data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-100">Earnings</h1>
        <p className="mt-1 text-sm text-slate-400">
          Summary of your completed job payments.
        </p>
      </div>

      {earningsQuery.isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      ) : earningsQuery.error ? (
        <div className="rounded-2xl border border-rose-900/60 bg-rose-950/30 px-4 py-3 text-sm text-rose-200">
          Failed to load earnings.
        </div>
      ) : data ? (
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <div className="text-xs font-medium text-slate-400">Total earnings</div>
            <div className="mt-2 text-2xl font-semibold text-emerald-300">
              £{data.totalEarnings ?? 0}
            </div>
          </Card>
          <Card>
            <div className="text-xs font-medium text-slate-400">Jobs completed</div>
            <div className="mt-2 text-2xl font-semibold text-slate-100">
              {data.jobsCompleted ?? 0}
            </div>
          </Card>
          <Card>
            <div className="text-xs font-medium text-slate-400">Successful payments</div>
            <div className="mt-2 text-2xl font-semibold text-slate-100">
              {data.totalPayouts ?? 0}
            </div>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
