"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import toast from "react-hot-toast";
import { api } from "../../../../lib/api";
import { Card } from "../../../../components/ui/Card";
import { StatusBadge } from "../../../../components/ui/StatusBadge";
import { Button } from "../../../../components/ui/Button";
import { Spinner } from "../../../../components/ui/Spinner";

type Job = {
  _id: string;
  title: string;
  description?: string;
  serviceCategory: string;
  location: string;
  budgetMin?: number;
  budgetMax?: number;
  status: string;
  createdBy?: { name: string; email?: string; phone?: string };
  assignedProfessional?: {
    _id: string;
    userId?: { name: string; email?: string; phone?: string };
  };
};

type Application = {
  _id: string;
  status: string;
  professionalId: {
    _id: string;
    userId?: { name: string; email?: string; phone?: string };
    averageRating?: number;
    jobsCompleted?: number;
  };
};

export default function ClientJobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const qc = useQueryClient();
  const jobId = String(params.jobId);

  const [ratingQuality, setRatingQuality] = useState(5);
  const [ratingCommunication, setRatingCommunication] = useState(5);
  const [ratingPunctuality, setRatingPunctuality] = useState(5);
  const [comment, setComment] = useState("");
  const [paymentAmount, setPaymentAmount] = useState("");

  const jobQuery = useQuery({
    queryKey: ["client", "job", jobId],
    queryFn: async () => {
      const res = await api.get<Job>(`/api/jobs/${jobId}`);
      return res.data;
    },
    enabled: !!jobId,
  });

  const applicationsQuery = useQuery({
    queryKey: ["client", "applications", jobId],
    queryFn: async () => {
      const res = await api.get<Application[]>(`/api/applications/job/${jobId}`);
      return res.data;
    },
    enabled: !!jobId && jobQuery.data?.status === "open",
  });

  const acceptMutation = useMutation({
    mutationFn: async (applicationId: string) => {
      await api.patch("/api/applications/accept", { applicationId });
    },
    onSuccess: () => {
      toast.success("Professional accepted");
      qc.invalidateQueries({ queryKey: ["client", "job", jobId] });
      qc.invalidateQueries({ queryKey: ["client", "bookings"] });
      qc.invalidateQueries({ queryKey: ["client", "jobs"] });
      qc.invalidateQueries({ queryKey: ["client", "stats"] });
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(err?.response?.data?.message ?? "Failed to accept");
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async () => {
      await api.patch("/api/jobs/cancel", { jobId });
    },
    onSuccess: () => {
      toast.success("Job cancelled");
      qc.invalidateQueries({ queryKey: ["client", "job", jobId] });
      qc.invalidateQueries({ queryKey: ["client", "bookings"] });
      qc.invalidateQueries({ queryKey: ["client", "jobs"] });
      router.push("/client/jobs");
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(err?.response?.data?.message ?? "Failed to cancel");
    },
  });

  const payMutation = useMutation({
    mutationFn: async () => {
      const amount = Number(paymentAmount);
      if (!amount || amount <= 0) throw new Error("Invalid amount");
      await api.post("/api/jobs/pay", { jobId, amount });
    },
    onSuccess: () => {
      toast.success("Payment recorded");
      qc.invalidateQueries({ queryKey: ["client", "job", jobId] });
      qc.invalidateQueries({ queryKey: ["client", "payments"] });
      setPaymentAmount("");
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(err?.response?.data?.message ?? "Payment failed");
    },
  });

  const reviewMutation = useMutation({
    mutationFn: async (e: FormEvent) => {
      e.preventDefault();
      if (!jobQuery.data?.assignedProfessional?._id) throw new Error("No professional");
      await api.post("/api/jobs/review", {
        jobId,
        professionalId: jobQuery.data.assignedProfessional._id,
        ratingQuality,
        ratingCommunication,
        ratingPunctuality,
        comment,
      });
    },
    onSuccess: () => {
      toast.success("Review submitted");
      qc.invalidateQueries({ queryKey: ["client", "job", jobId] });
      qc.invalidateQueries({ queryKey: ["client", "reviews"] });
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(err?.response?.data?.message ?? "Failed to submit review");
    },
  });

  const job = jobQuery.data;
  const applications = (applicationsQuery.data ?? []).filter((a) => a.status === "pending");

  if (jobQuery.isLoading || !job) {
    return (
      <div className="flex justify-center py-12">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-100">{job.title}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-400">
            <StatusBadge status={job.status} />
            <span>{job.serviceCategory} • {job.location}</span>
            <span>£{job.budgetMin ?? "?"}{job.budgetMax != null ? ` – £${job.budgetMax}` : ""}</span>
          </div>
        </div>
        {["open", "booked", "in_progress"].includes(job.status) && (
          <Button variant="danger" onClick={() => cancelMutation.mutate()}>
            Cancel job
          </Button>
        )}
      </div>

      {job.description ? (
        <Card>
          <div className="text-sm text-slate-300">{job.description}</div>
        </Card>
      ) : null}

      {job.assignedProfessional && (
        <Card>
          <div className="text-sm font-medium text-slate-100">Assigned professional</div>
          <div className="mt-1 text-slate-300">
            {job.assignedProfessional.userId?.name ?? "—"}
          </div>
          {job.assignedProfessional.userId?.phone ? (
            <div className="mt-0.5 text-xs text-slate-400">
              {job.assignedProfessional.userId.phone}
            </div>
          ) : null}
        </Card>
      )}

      {job.status === "open" && applications.length > 0 && (
        <Card>
          <div className="mb-3 text-sm font-semibold text-slate-100">Applications</div>
          <div className="space-y-2">
            {applications.map((app) => (
              <div
                key={app._id}
                className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2"
              >
                <div>
                  <div className="text-slate-100">
                    {app.professionalId?.userId?.name ?? "Professional"}
                  </div>
                  <div className="text-xs text-slate-400">
                    {app.professionalId?.averageRating != null
                      ? `⭐ ${app.professionalId.averageRating.toFixed(1)}`
                      : ""}{" "}
                    {app.professionalId?.jobsCompleted != null
                      ? `• ${app.professionalId.jobsCompleted} jobs`
                      : ""}
                  </div>
                </div>
                <Button onClick={() => acceptMutation.mutate(app._id)}>
                  Accept
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {job.status === "open" && applicationsQuery.isLoading && (
        <div className="flex justify-center py-4">
          <Spinner />
        </div>
      )}

      {job.status === "completed" && job.assignedProfessional && (
        <>
          <Card>
            <div className="text-sm font-semibold text-slate-100">Make payment</div>
            <p className="mt-1 text-xs text-slate-400">
              Record payment for this job (mock; no real gateway).
            </p>
            <div className="mt-3 flex gap-2">
              <input
                type="number"
                min={1}
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                placeholder="Amount (£)"
                className="h-10 w-32 rounded-xl border border-slate-700 bg-slate-950 px-3 text-sm text-slate-100 outline-none focus:border-sky-500"
              />
              <Button
                onClick={() => payMutation.mutate()}
                disabled={!paymentAmount || Number(paymentAmount) <= 0}
                loading={payMutation.isPending}
              >
                Pay now
              </Button>
            </div>
          </Card>
          <Card>
            <div className="text-sm font-semibold text-slate-100">Leave a review</div>
            <form onSubmit={reviewMutation.mutate} className="mt-3 space-y-3">
              <div className="flex gap-4 text-sm">
                <label className="flex items-center gap-1">
                  Quality
                  <select
                    value={ratingQuality}
                    onChange={(e) => setRatingQuality(Number(e.target.value))}
                    className="rounded border border-slate-700 bg-slate-950 px-2 py-1 text-slate-100"
                  >
                    {[1, 2, 3, 4, 5].map((n) => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </label>
                <label className="flex items-center gap-1">
                  Communication
                  <select
                    value={ratingCommunication}
                    onChange={(e) => setRatingCommunication(Number(e.target.value))}
                    className="rounded border border-slate-700 bg-slate-950 px-2 py-1 text-slate-100"
                  >
                    {[1, 2, 3, 4, 5].map((n) => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </label>
                <label className="flex items-center gap-1">
                  Punctuality
                  <select
                    value={ratingPunctuality}
                    onChange={(e) => setRatingPunctuality(Number(e.target.value))}
                    className="rounded border border-slate-700 bg-slate-950 px-2 py-1 text-slate-100"
                  >
                    {[1, 2, 3, 4, 5].map((n) => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </label>
              </div>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Your review (optional)"
                rows={2}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-sky-500"
              />
              <Button type="submit" loading={reviewMutation.isPending}>
                Submit review
              </Button>
            </form>
          </Card>
        </>
      )}
    </div>
  );
}
