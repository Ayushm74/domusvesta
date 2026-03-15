"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { api } from "../../../lib/api";
import { JobCard, type JobCardJob } from "../../../components/JobCard";
import { Spinner } from "../../../components/ui/Spinner";

export default function ClientJobsPage() {
  const router = useRouter();

  const jobsQuery = useQuery({
    queryKey: ["client", "jobs", "my"],
    queryFn: async () => {
      const res = await api.get<JobCardJob[]>("/api/jobs/my");
      return res.data;
    },
  });

  const jobs = jobsQuery.data ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-100">My Jobs</h1>
        <p className="mt-1 text-sm text-slate-400">
          All jobs you have posted. Open jobs can receive applications; view details to accept a professional.
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
          No jobs yet. Post a job to get started.
        </div>
      ) : (
        <div className="space-y-4">
          {jobs.map((job) => (
            <JobCard
              key={job._id}
              job={job}
              showActions="client"
              onViewDetails={() => router.push(`/client/job/${job._id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
