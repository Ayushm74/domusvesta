"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { api } from "../../../lib/api";
import { Card } from "../../../components/ui/Card";
import { Spinner } from "../../../components/ui/Spinner";

type Stats = {
  availableJobs: number;
  appliedCount: number;
  acceptedCount: number;
  totalEarnings: number;
};

export default function ProDashboardPage() {
  const statsQuery = useQuery({
    queryKey: ["pro", "stats"],
    queryFn: async () => {
      const res = await api.get<Stats>("/api/jobs/stats/professional");
      return res.data;
    },
  });

  const stats = statsQuery.data;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-slate-100">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-400">
          Your activity and earnings summary
        </p>
      </div>

      {statsQuery.isLoading ? (
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      ) : stats ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <div className="text-xs font-medium text-slate-400">Jobs available</div>
            <div className="mt-2 text-2xl font-semibold text-slate-100">
              {stats.availableJobs}
            </div>
            <Link
              href="/pro/available"
              className="mt-2 block text-xs text-sky-400 hover:underline"
            >
              View all
            </Link>
          </Card>
          <Card>
            <div className="text-xs font-medium text-slate-400">My applications</div>
            <div className="mt-2 text-2xl font-semibold text-amber-300">
              {stats.appliedCount}
            </div>
            <Link
              href="/pro/applications"
              className="mt-2 block text-xs text-sky-400 hover:underline"
            >
              View all
            </Link>
          </Card>
          <Card>
            <div className="text-xs font-medium text-slate-400">Active jobs</div>
            <div className="mt-2 text-2xl font-semibold text-sky-300">
              {stats.acceptedCount}
            </div>
            <Link
              href="/pro/active-jobs"
              className="mt-2 block text-xs text-sky-400 hover:underline"
            >
              View all
            </Link>
          </Card>
          <Card>
            <div className="text-xs font-medium text-slate-400">Total earnings</div>
            <div className="mt-2 text-2xl font-semibold text-emerald-300">
              £{stats.totalEarnings ?? 0}
            </div>
            <Link
              href="/pro/earnings"
              className="mt-2 block text-xs text-sky-400 hover:underline"
            >
              View details
            </Link>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
