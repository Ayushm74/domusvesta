"use client";

import { Card } from "./ui/Card";

export type ReviewItemReview = {
  _id: string;
  overallRating: number;
  ratingQuality?: number;
  ratingCommunication?: number;
  ratingPunctuality?: number;
  comment?: string;
  createdAt: string;
  jobId?: { _id: string; title?: string };
  professionalId?: { _id: string; userId?: { name: string } };
};

export function ReviewItem({ review }: { review: ReviewItemReview }) {
  const date = new Date(review.createdAt).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const jobTitle = review.jobId?.title ?? "Job";
  const proName = review.professionalId?.userId?.name ?? "Professional";

  return (
    <Card>
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="font-medium text-slate-100">{jobTitle}</div>
          <div className="mt-0.5 text-xs text-slate-400">Reviewed: {proName}</div>
          <div className="mt-2 flex items-center gap-1 text-amber-400">
            {"★".repeat(Math.round(review.overallRating))}
            <span className="ml-1 text-sm text-slate-300">
              {review.overallRating.toFixed(1)}
            </span>
          </div>
          {review.comment ? (
            <p className="mt-2 text-sm text-slate-300">{review.comment}</p>
          ) : null}
        </div>
        <span className="text-xs text-slate-500">{date}</span>
      </div>
    </Card>
  );
}
