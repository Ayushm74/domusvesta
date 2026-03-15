"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { api } from "../../../lib/api";
import { Card } from "../../../components/ui/Card";
import { StatusBadge } from "../../../components/ui/StatusBadge";
import { Spinner } from "../../../components/ui/Spinner";

type Stats = {
  totalJobs: number;
  activeBookings: number;
  completedJobs: number;
  pendingPayments: number;
};

type Job = {
  _id: string;
  title: string;
  status: string;
  updatedAt: string;
};

export default function ClientDashboardPage() {
  const statsQuery = useQuery({
    queryKey: ["client", "stats"],
    queryFn: async () => {
      const res = await api.get<Stats>("/api/jobs/stats/household");
      return res.data;
    },
  });

  const jobsQuery = useQuery({
    queryKey: ["client", "jobs", "my"],
    queryFn: async () => {
      const res = await api.get<Job[]>("/api/jobs/my");
      return res.data;
    },
  });

  const stats = statsQuery.data;
  const recentJobs = (jobsQuery.data ?? []).slice(0, 5);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-slate-100">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-400">
          Summary of your jobs and activity
        </p>
      </div>

      {statsQuery.isLoading ? (
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      ) : stats ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <div className="text-xs font-medium text-slate-400">Total jobs posted</div>
            <div className="mt-2 text-2xl font-semibold text-slate-100">
              {stats.totalJobs}
            </div>
          </Card>
          <Card>
            <div className="text-xs font-medium text-slate-400">Active bookings</div>
            <div className="mt-2 text-2xl font-semibold text-sky-300">
              {stats.activeBookings}
            </div>
          </Card>
          <Card>
            <div className="text-xs font-medium text-slate-400">Completed jobs</div>
            <div className="mt-2 text-2xl font-semibold text-emerald-300">
              {stats.completedJobs}
            </div>
          </Card>
          <Card>
            <div className="text-xs font-medium text-slate-400">Pending payments</div>
            <div className="mt-2 text-2xl font-semibold text-amber-300">
              {stats.pendingPayments}
            </div>
          </Card>
        </div>
      ) : null}

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-100">Recent activity</h2>
          <Link
            href="/client/post-job"
            className="text-sm font-medium text-sky-400 hover:text-sky-300"
          >
            Post a job
          </Link>
        </div>
        {jobsQuery.isLoading ? (
          <div className="flex justify-center py-8">
            <Spinner />
          </div>
        ) : recentJobs.length === 0 ? (
          <Card>
            <p className="text-sm text-slate-400">
              No jobs yet.{" "}
              <Link href="/client/post-job" className="text-sky-400 hover:underline">
                Post your first job
              </Link>
            </p>
          </Card>
        ) : (
          <div className="space-y-2">
            {recentJobs.map((job) => (
              <Card key={job._id}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-slate-100">{job.title}</div>
                    <div className="mt-0.5 text-xs text-slate-500">
                      {new Date(job.updatedAt).toLocaleDateString()}
                    </div>
                  </div>
                  <StatusBadge status={job.status} />
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
