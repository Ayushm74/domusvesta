"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { api } from "../../../lib/api";
import { Card } from "../../../components/ui/Card";
import { StatusBadge } from "../../../components/ui/StatusBadge";
import { Button } from "../../../components/ui/Button";
import { Spinner } from "../../../components/ui/Spinner";

type Job = {
  _id: string;
  title: string;
  serviceCategory: string;
  location: string;
  status: string;
  createdBy?: { name: string; email?: string; phone?: string; location?: string };
};

export default function ProActiveJobsPage() {
  const qc = useQueryClient();

  const jobsQuery = useQuery({
    queryKey: ["pro", "jobs", "mine"],
    queryFn: async () => {
      const res = await api.get<Job[]>("/api/jobs/mine");
      return res.data;
    },
  });

  const statusMutation = useMutation({
    mutationFn: async ({ jobId, status }: { jobId: string; status: string }) => {
      await api.patch("/api/jobs/status", { jobId, status });
    },
    onSuccess: () => {
      toast.success("Job status updated");
      qc.invalidateQueries({ queryKey: ["pro", "jobs", "mine"] });
      qc.invalidateQueries({ queryKey: ["pro", "stats"] });
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(err?.response?.data?.message ?? "Failed to update status");
    },
  });

  const jobs = (jobsQuery.data ?? []).filter(
    (j) => j.status === "booked" || j.status === "in_progress"
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-100">Active Jobs</h1>
        <p className="mt-1 text-sm text-slate-400">
          Jobs you have accepted. Mark as started, then completed when done.
        </p>
      </div>

      {jobsQuery.isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      ) : jobsQuery.error ? (
        <div className="rounded-2xl border border-rose-900/60 bg-rose-950/30 px-4 py-3 text-sm text-rose-200">
          Failed to load jobs.
        </div>
      ) : jobs.length === 0 ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-8 text-center text-sm text-slate-400">
          No active jobs. When a household accepts your application, the job will appear here.
        </div>
      ) : (
        <div className="space-y-4">
          {jobs.map((job) => (
            <Card key={job._id}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="font-medium text-slate-100">{job.title}</div>
                  <div className="mt-1 text-xs text-slate-400">
                    {job.serviceCategory} • {job.location}
                  </div>
                  {job.createdBy ? (
                    <div className="mt-1 text-xs text-slate-300">
                      Client: {job.createdBy.name}
                      {job.createdBy.phone ? ` • ${job.createdBy.phone}` : ""}
                    </div>
                  ) : null}
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2">
                  <StatusBadge status={job.status} />
                  {job.status === "booked" && (
                    <Button
                      onClick={() =>
                        statusMutation.mutate({ jobId: job._id, status: "in_progress" })
                      }
                      loading={statusMutation.isPending}
                    >
                      Mark started
                    </Button>
                  )}
                  {(job.status === "booked" || job.status === "in_progress") && (
                    <Button
                      variant="primary"
                      onClick={() =>
                        statusMutation.mutate({ jobId: job._id, status: "completed" })
                      }
                      loading={statusMutation.isPending}
                    >
                      Mark completed
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
