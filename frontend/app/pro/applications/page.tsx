"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "../../../lib/api";
import { Card } from "../../../components/ui/Card";
import { StatusBadge } from "../../../components/ui/StatusBadge";
import { Spinner } from "../../../components/ui/Spinner";

type Application = {
  _id: string;
  status: string;
  createdAt: string;
  jobId: {
    _id: string;
    title: string;
    description?: string;
    serviceCategory: string;
    location: string;
    budgetMin?: number;
    budgetMax?: number;
    status: string;
  };
};

export default function ProApplicationsPage() {
  const applicationsQuery = useQuery({
    queryKey: ["pro", "applications"],
    queryFn: async () => {
      const res = await api.get<Application[]>("/api/applications/my");
      return res.data;
    },
  });

  const applications = applicationsQuery.data ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-100">My Applications</h1>
        <p className="mt-1 text-sm text-slate-400">
          Jobs you have applied to. Status: pending, accepted, or rejected.
        </p>
      </div>

      {applicationsQuery.isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      ) : applicationsQuery.error ? (
        <div className="rounded-2xl border border-rose-900/60 bg-rose-950/30 px-4 py-3 text-sm text-rose-200">
          Failed to load applications.
        </div>
      ) : applications.length === 0 ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-8 text-center text-sm text-slate-400">
          No applications yet. Apply to jobs from Available Jobs.
        </div>
      ) : (
        <div className="space-y-4">
          {applications.map((app) => (
            <Card key={app._id}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="font-medium text-slate-100">
                    {app.jobId?.title ?? "—"}
                  </div>
                  <div className="mt-1 text-xs text-slate-400">
                    {app.jobId?.serviceCategory} • {app.jobId?.location} • £
                    {app.jobId?.budgetMin ?? "?"}
                    {app.jobId?.budgetMax != null ? ` – £${app.jobId.budgetMax}` : ""}
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    Applied {new Date(app.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <StatusBadge status={app.status} />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
