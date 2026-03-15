"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { RequireAuth } from "../../../components/RequireAuth";
import { api } from "../../../lib/api";
import { useAuth } from "../../../lib/auth-context";

type AdminStats = {
  usersCount: number;
  professionalsCount: number;
  jobsCount: number;
  completedJobsCount: number;
  paymentsCount: number;
};

type PendingProfessional = {
  _id: string;
  verificationStatus: string;
  skills: string[];
  experienceYears: number;
  location?: string;
  userId?: {
    name: string;
    email: string;
    location?: string;
  };
};

type AdminUser = {
  _id: string;
  name: string;
  email: string;
  role: string;
};

type AdminJob = {
  _id: string;
  title: string;
  status: string;
};

type AdminPayment = {
  _id: string;
  amount: number;
  status: string;
};

function AdminDashboardInner() {
  const { logout } = useAuth();
  const qc = useQueryClient();

  const statsQuery = useQuery({
    queryKey: ["admin", "stats"],
    queryFn: async () => {
      const res = await api.get<AdminStats>("/api/admin/stats");
      return res.data;
    },
  });

  const pendingQuery = useQuery({
    queryKey: ["admin", "pending-professionals"],
    queryFn: async () => {
      const res = await api.get<PendingProfessional[]>(
        "/api/admin/pending-professionals"
      );
      return res.data;
    },
  });

  const usersQuery = useQuery({
    queryKey: ["admin", "users"],
    queryFn: async () => {
      const res = await api.get<AdminUser[]>("/api/admin/users");
      return res.data;
    },
  });

  const jobsQuery = useQuery({
    queryKey: ["admin", "jobs"],
    queryFn: async () => {
      const res = await api.get<AdminJob[]>("/api/admin/jobs");
      return res.data;
    },
  });

  const paymentsQuery = useQuery({
    queryKey: ["admin", "payments"],
    queryFn: async () => {
      const res = await api.get<AdminPayment[]>("/api/admin/payments");
      return res.data;
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (params: { professionalId: string; approve: boolean }) => {
      await api.patch("/api/admin/approve-professional", params);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "pending-professionals"] });
      qc.invalidateQueries({ queryKey: ["admin", "stats"] });
    },
  });

  return (
    <div className="mx-auto flex max-w-6xl gap-8 px-4 py-10">
      <aside className="w-56 space-y-2 text-sm">
        <div className="flex items-center justify-between">
          <div className="font-semibold text-slate-200">Admin</div>
          <button
            onClick={logout}
            className="text-[11px] text-slate-400 hover:text-sky-400"
          >
            Logout
          </button>
        </div>
        <nav className="space-y-1 text-slate-300">
          <div className="text-sky-300">Dashboard</div>
          <div>Users</div>
          <div>Professional Applications</div>
          <div>Jobs</div>
          <div>Payments</div>
          <div>Reports</div>
          <div>Analytics</div>
        </nav>
      </aside>

      <main className="flex-1 space-y-6">
        <div>
          <h1 className="text-xl font-semibold text-slate-100">Overview</h1>
          <p className="text-sm text-slate-400">
            Live platform metrics and pending professional applications.
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
            <div className="text-xs text-slate-400">Users</div>
            <div className="mt-2 text-2xl font-semibold">
              {statsQuery.data?.usersCount ?? "—"}
            </div>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
            <div className="text-xs text-slate-400">Approved professionals</div>
            <div className="mt-2 text-2xl font-semibold">
              {statsQuery.data?.professionalsCount ?? "—"}
            </div>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
            <div className="text-xs text-slate-400">Completed jobs</div>
            <div className="mt-2 text-2xl font-semibold">
              {statsQuery.data?.completedJobsCount ?? "—"}
            </div>
          </div>
        </div>

        <section className="space-y-2">
          <div className="flex items-end justify-between">
            <h2 className="text-sm font-semibold text-slate-200">
              Pending professional applications
            </h2>
            <div className="text-xs text-slate-500">
              {pendingQuery.isLoading
                ? "Loading…"
                : `${pendingQuery.data?.length || 0} pending`}
            </div>
          </div>

          {pendingQuery.isLoading ? (
            <div className="text-sm text-slate-400">Loading applications...</div>
          ) : pendingQuery.error ? (
            <div className="rounded-2xl border border-rose-900/60 bg-rose-950/30 px-4 py-3 text-sm text-rose-200">
              Failed to load pending applications.
            </div>
          ) : (pendingQuery.data?.length || 0) === 0 ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 px-4 py-3 text-sm text-slate-300">
              Nothing pending right now.
            </div>
          ) : (
            <div className="space-y-2">
              {pendingQuery.data!.map((p) => (
                <div
                  key={p._id}
                  className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="font-medium text-slate-100">
                        {p.userId?.name || "Professional"}{" "}
                        <span className="text-xs text-slate-500">
                          ({p.userId?.email || "—"})
                        </span>
                      </div>
                      <div className="mt-1 text-xs text-slate-400">
                        Skills: {(p.skills || []).join(", ") || "—"} • Exp:{" "}
                        {p.experienceYears ?? 0}y • Location:{" "}
                        {p.location || p.userId?.location || "—"}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 text-xs">
                      <span className="rounded-full border border-slate-700 bg-slate-950 px-3 py-1 text-slate-300">
                        {p.verificationStatus}
                      </span>
                      <div className="flex gap-2">
                        <button
                          onClick={() =>
                            approveMutation.mutate({
                              professionalId: p._id,
                              approve: true,
                            })
                          }
                          className="rounded-full bg-emerald-500 px-3 py-1 text-xs font-medium text-emerald-950 hover:bg-emerald-400"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() =>
                            approveMutation.mutate({
                              professionalId: p._id,
                              approve: false,
                            })
                          }
                          className="rounded-full border border-rose-600 px-3 py-1 text-xs text-rose-300 hover:bg-rose-950/40"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 rounded-2xl border border-slate-800 bg-slate-900/60 p-4 text-xs">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-100">Recent users</h3>
              <span className="text-slate-500">
                {usersQuery.data?.length ?? 0}
              </span>
            </div>
            {usersQuery.isLoading ? (
              <div className="text-slate-400">Loading users...</div>
            ) : usersQuery.error ? (
              <div className="text-rose-300">Failed to load users.</div>
            ) : (
              <div className="space-y-1">
                {(usersQuery.data || []).slice(0, 6).map((u) => (
                  <div
                    key={u._id}
                    className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2"
                  >
                    <div>
                      <div className="text-slate-100">{u.name}</div>
                      <div className="text-[11px] text-slate-500">
                        {u.email}
                      </div>
                    </div>
                    <div className="text-[11px] text-slate-400">{u.role}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2 rounded-2xl border border-slate-800 bg-slate-900/60 p-4 text-xs">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-100">Recent jobs</h3>
              <span className="text-slate-500">
                {jobsQuery.data?.length ?? 0}
              </span>
            </div>
            {jobsQuery.isLoading ? (
              <div className="text-slate-400">Loading jobs...</div>
            ) : jobsQuery.error ? (
              <div className="text-rose-300">Failed to load jobs.</div>
            ) : (
              <div className="space-y-1">
                {(jobsQuery.data || []).slice(0, 6).map((j) => (
                  <div
                    key={j._id}
                    className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2"
                  >
                    <div className="text-slate-100">{j.title}</div>
                    <div className="text-[11px] text-slate-400">
                      {j.status}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="space-y-2 rounded-2xl border border-slate-800 bg-slate-900/60 p-4 text-xs">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-100">Recent payments</h3>
            <span className="text-slate-500">
              {paymentsQuery.data?.length ?? 0}
            </span>
          </div>
          {paymentsQuery.isLoading ? (
            <div className="text-slate-400">Loading payments...</div>
          ) : paymentsQuery.error ? (
            <div className="text-rose-300">Failed to load payments.</div>
          ) : (
            <div className="space-y-1">
              {(paymentsQuery.data || []).slice(0, 6).map((p) => (
                <div
                  key={p._id}
                  className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2"
                >
                  <div className="text-slate-100">£{p.amount}</div>
                  <div className="text-[11px] text-slate-400">{p.status}</div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default function AdminDashboardPage() {
  return (
    <RequireAuth role="admin">
      <AdminDashboardInner />
    </RequireAuth>
  );
}

