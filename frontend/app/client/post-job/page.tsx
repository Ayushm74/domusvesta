"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { api } from "../../../lib/api";
import { Button } from "../../../components/ui/Button";
import { Card } from "../../../components/ui/Card";
import { useAuth } from "../../../lib/auth-context";

type Category = { key: string; name: string };

export default function PostJobPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [serviceCategory, setServiceCategory] = useState("");
  const [location, setLocation] = useState(user?.location ?? "");
  const [budgetMin, setBudgetMin] = useState("");
  const [budgetMax, setBudgetMax] = useState("");

  const categoriesQuery = useQuery({
    queryKey: ["meta", "landing"],
    queryFn: async () => {
      const res = await api.get<{ categories: Category[] }>("/api/meta/landing");
      return res.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (e: FormEvent) => {
      e.preventDefault();
      const fd = new FormData();
      fd.append("title", title.trim());
      fd.append("description", description.trim());
      fd.append("serviceCategory", serviceCategory);
      fd.append("location", location.trim());
      if (budgetMin) fd.append("budgetMin", budgetMin);
      if (budgetMax) fd.append("budgetMax", budgetMax);
      const res = await api.post<{ job: { _id: string }; matches: unknown[] }>(
        "/api/jobs/create",
        fd,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      return res.data;
    },
    onSuccess: (data) => {
      toast.success("Job posted successfully");
      qc.invalidateQueries({ queryKey: ["client", "jobs"] });
      qc.invalidateQueries({ queryKey: ["client", "stats"] });
      router.push("/client/dashboard");
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(err?.response?.data?.message ?? "Failed to post job");
    },
  });

  const canSubmit = useMemo(
    () => title.trim() && serviceCategory && location.trim(),
    [title, serviceCategory, location]
  );

  useEffect(() => {
    if (user?.location && !location) setLocation(user.location);
  }, [user?.location, location]);

  const categories = categoriesQuery.data?.categories ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-100">Post a Job</h1>
        <p className="mt-1 text-sm text-slate-400">
          Describe your service request. Professionals matching your category and location can apply.
        </p>
      </div>

      <Card className="p-6">
        <form
          onSubmit={(e) => createMutation.mutate(e)}
          className="grid gap-4 sm:grid-cols-2"
        >
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-medium text-slate-400">Title *</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="e.g. Fix leaking pipe under kitchen sink"
              className="h-10 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 text-sm text-slate-100 outline-none focus:border-sky-500"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-medium text-slate-400">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Share details, access notes, and any constraints."
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-sky-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-400">Category *</label>
            <select
              value={serviceCategory}
              onChange={(e) => setServiceCategory(e.target.value)}
              required
              className="h-10 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 text-sm text-slate-100 outline-none focus:border-sky-500"
            >
              <option value="">Select category</option>
              {categories.map((c) => (
                <option key={c.key} value={c.key}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-400">Location *</label>
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              required
              placeholder="e.g. Leicester"
              className="h-10 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 text-sm text-slate-100 outline-none focus:border-sky-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-400">Budget min (£)</label>
            <input
              type="number"
              min={0}
              value={budgetMin}
              onChange={(e) => setBudgetMin(e.target.value)}
              className="h-10 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 text-sm text-slate-100 outline-none focus:border-sky-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-400">Budget max (£)</label>
            <input
              type="number"
              min={0}
              value={budgetMax}
              onChange={(e) => setBudgetMax(e.target.value)}
              className="h-10 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 text-sm text-slate-100 outline-none focus:border-sky-500"
            />
          </div>
          <div className="sm:col-span-2 flex justify-end">
            <Button type="submit" disabled={!canSubmit} loading={createMutation.isPending}>
              Post job
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
