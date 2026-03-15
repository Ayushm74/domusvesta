"use client";

import { Card } from "./ui/Card";
import { StatusBadge } from "./ui/StatusBadge";
import { Button } from "./ui/Button";

export type BookingCardJob = {
  _id: string;
  title: string;
  serviceCategory: string;
  location: string;
  status: string;
  preferredDate?: string;
  preferredTimeSlot?: string;
  updatedAt?: string;
  assignedProfessional?: {
    _id: string;
    userId?: { name: string; email?: string; phone?: string; location?: string };
  };
};

export function BookingCard({
  job,
  onViewDetails,
  onCancel,
  onConfirmCompletion,
}: {
  job: BookingCardJob;
  onViewDetails?: () => void;
  onCancel?: () => void;
  onConfirmCompletion?: () => void;
}) {
  const proName = job.assignedProfessional?.userId?.name ?? "—";
  const scheduled =
    job.preferredDate || job.preferredTimeSlot
      ? [job.preferredDate ? new Date(job.preferredDate).toLocaleDateString() : null, job.preferredTimeSlot].filter(Boolean).join(" • ")
      : "Not set";

  return (
    <Card>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="font-medium text-slate-100">{job.title}</div>
          <div className="mt-1 text-xs text-slate-400">
            {job.serviceCategory} • {job.location}
          </div>
          <div className="mt-1 text-xs text-slate-300">
            Professional: {proName}
          </div>
          <div className="mt-0.5 text-xs text-slate-500">Scheduled: {scheduled}</div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <StatusBadge status={job.status} />
          <div className="flex flex-wrap gap-2">
            {onViewDetails && (
              <Button variant="secondary" onClick={onViewDetails}>
                View details
              </Button>
            )}
            {onCancel && (job.status === "booked" || job.status === "in_progress") && (
              <Button variant="danger" onClick={onCancel}>
                Cancel
              </Button>
            )}
            {onConfirmCompletion && job.status === "in_progress" && (
              <Button variant="primary" onClick={onConfirmCompletion}>
                Confirm completion
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
