"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { api } from "../../../lib/api";
import { JobCard, type JobCardJob } from "../../../components/JobCard";
import { Spinner } from "../../../components/ui/Spinner";

export default function ProAvailablePage() {
  const qc = useQueryClient();

  const jobsQuery = useQuery({
    queryKey: ["pro", "jobs", "available"],
    queryFn: async () => {
      const res = await api.get<JobCardJob[]>("/api/jobs/available");
      return res.data;
    },
  });

  const applyMutation = useMutation({
    mutationFn: async (jobId: string) => {
      await api.post("/api/applications", { jobId });
    },
    onSuccess: () => {
      toast.success("Application submitted");
      qc.invalidateQueries({ queryKey: ["pro", "jobs", "available"] });
      qc.invalidateQueries({ queryKey: ["pro", "applications"] });
      qc.invalidateQueries({ queryKey: ["pro", "stats"] });
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(err?.response?.data?.message ?? "Failed to apply");
    },
  });

  const jobs = jobsQuery.data ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-100">Available Jobs</h1>
        <p className="mt-1 text-sm text-slate-400">
          Open jobs you can apply to. You must be verified to apply.
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
          No open jobs right now.
        </div>
      ) : (
        <div className="space-y-4">
          {jobs.map((job) => (
            <JobCard
              key={job._id}
              job={job}
              showActions="professional"
              onApply={() => applyMutation.mutate(job._id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
