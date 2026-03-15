"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "../../../lib/api";
import { ReviewItem, type ReviewItemReview } from "../../../components/ReviewItem";
import { Spinner } from "../../../components/ui/Spinner";

export default function ClientReviewsPage() {
  const reviewsQuery = useQuery({
    queryKey: ["client", "reviews"],
    queryFn: async () => {
      const res = await api.get<ReviewItemReview[]>("/api/jobs/reviews/my");
      return res.data;
    },
  });

  const reviews = reviewsQuery.data ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-100">Reviews</h1>
        <p className="mt-1 text-sm text-slate-400">
          Reviews you have written for completed jobs. Leave a review from the job detail page after completion.
        </p>
      </div>

      {reviewsQuery.isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      ) : reviewsQuery.error ? (
        <div className="rounded-2xl border border-rose-900/60 bg-rose-950/30 px-4 py-3 text-sm text-rose-200">
          Failed to load reviews.
        </div>
      ) : reviews.length === 0 ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-8 text-center text-sm text-slate-400">
          No reviews yet. Complete a job and leave a review from the job page.
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((r) => (
            <ReviewItem key={r._id} review={r} />
          ))}
        </div>
      )}
    </div>
  );
}
