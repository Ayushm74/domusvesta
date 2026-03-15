"use client";

import Link from "next/link";
import { Card } from "./ui/Card";
import { StatusBadge } from "./ui/StatusBadge";
import { Button } from "./ui/Button";

export type JobCardJob = {
  _id: string;
  title: string;
  description?: string;
  serviceCategory: string;
  location: string;
  budgetMin?: number;
  budgetMax?: number;
  status: string;
  createdAt?: string;
  createdBy?: { name: string; location?: string };
  assignedProfessional?: {
    _id: string;
    userId?: { name: string; email?: string; phone?: string; location?: string };
  };
};

export function JobCard({
  job,
  showActions,
  onViewDetails,
  onApply,
  onAcceptApplication,
  applicationId,
}: {
  job: JobCardJob;
  showActions?: "client" | "professional";
  onViewDetails?: () => void;
  onApply?: () => void;
  onAcceptApplication?: (applicationId: string) => void;
  applicationId?: string;
}) {
  const budget =
    job.budgetMin != null || job.budgetMax != null
      ? `£${job.budgetMin ?? "?"}${job.budgetMax != null ? ` – £${job.budgetMax}` : ""}`
      : "—";

  return (
    <Card>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="font-medium text-slate-100">{job.title}</div>
          {job.description ? (
            <p className="mt-1 line-clamp-2 text-xs text-slate-400">{job.description}</p>
          ) : null}
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-400">
            <span>{job.serviceCategory}</span>
            <span>•</span>
            <span>{job.location}</span>
            <span>•</span>
            <span>{budget}</span>
          </div>
          {job.assignedProfessional?.userId ? (
            <div className="mt-1 text-xs text-slate-300">
              Professional: {job.assignedProfessional.userId.name}
            </div>
          ) : null}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <StatusBadge status={job.status} />
          {showActions === "client" && onViewDetails && (
            <Button variant="secondary" onClick={onViewDetails}>
              View details
            </Button>
          )}
          {showActions === "professional" && onApply && job.status === "open" && (
            <Button onClick={onApply}>Apply</Button>
          )}
          {showActions === "client" && onAcceptApplication && applicationId && (
            <Button onClick={() => onAcceptApplication(applicationId)}>Accept</Button>
          )}
        </div>
      </div>
    </Card>
  );
}
