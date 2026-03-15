"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { api } from "../../../lib/api";
import { BookingCard, type BookingCardJob } from "../../../components/BookingCard";
import { Spinner } from "../../../components/ui/Spinner";

export default function ClientBookingsPage() {
  const router = useRouter();
  const qc = useQueryClient();

  const bookingsQuery = useQuery({
    queryKey: ["client", "bookings"],
    queryFn: async () => {
      const res = await api.get<BookingCardJob[]>("/api/jobs/bookings");
      return res.data;
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async (jobId: string) => {
      await api.patch("/api/jobs/cancel", { jobId });
    },
    onSuccess: () => {
      toast.success("Booking cancelled");
      qc.invalidateQueries({ queryKey: ["client", "bookings"] });
      qc.invalidateQueries({ queryKey: ["client", "jobs"] });
      qc.invalidateQueries({ queryKey: ["client", "stats"] });
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(err?.response?.data?.message ?? "Failed to cancel");
    },
  });

  const bookings = bookingsQuery.data ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-100">My Bookings</h1>
        <p className="mt-1 text-sm text-slate-400">
          Jobs with an assigned professional. Cancel or confirm completion here.
        </p>
      </div>

      {bookingsQuery.isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      ) : bookingsQuery.error ? (
        <div className="rounded-2xl border border-rose-900/60 bg-rose-950/30 px-4 py-3 text-sm text-rose-200">
          Failed to load bookings.
        </div>
      ) : bookings.length === 0 ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-8 text-center text-sm text-slate-400">
          No active bookings. Post a job and accept a professional to see bookings here.
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((job) => (
            <BookingCard
              key={job._id}
              job={job}
              onViewDetails={() => router.push(`/client/job/${job._id}`)}
              onCancel={() => cancelMutation.mutate(job._id)}
              onConfirmCompletion={() => router.push(`/client/job/${job._id}?complete=1`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
