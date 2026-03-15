"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { api } from "../../../lib/api";
import { ProfileForm } from "../../../components/ProfileForm";
import { Spinner } from "../../../components/ui/Spinner";
import { useAuth } from "../../../lib/auth-context";

type ProfileUser = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  location?: string;
};

export default function ClientProfilePage() {
  const qc = useQueryClient();
  const { user: authUser } = useAuth();

  const profileQuery = useQuery({
    queryKey: ["auth", "me"],
    queryFn: async () => {
      const res = await api.get<ProfileUser>("/api/auth/me");
      return res.data;
    },
    enabled: !!authUser,
  });

  const updateMutation = useMutation({
    mutationFn: async (data: { name: string; email: string; phone: string; location: string }) => {
      await api.put("/api/users/profile", data);
    },
    onSuccess: () => {
      toast.success("Profile updated");
      qc.invalidateQueries({ queryKey: ["auth", "me"] });
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(err?.response?.data?.message ?? "Failed to update profile");
    },
  });

  const user = profileQuery.data ?? authUser;

  if (profileQuery.isLoading && !authUser) {
    return (
      <div className="flex justify-center py-12">
        <Spinner />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="rounded-2xl border border-rose-900/60 bg-rose-950/30 px-4 py-3 text-sm text-rose-200">
        Could not load profile.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-100">Profile</h1>
        <p className="mt-1 text-sm text-slate-400">
          Update your name, email, phone, and location.
        </p>
      </div>
      <div className="max-w-md">
        <ProfileForm
          user={{
            name: user.name ?? "",
            email: user.email ?? "",
            phone: (user as ProfileUser).phone ?? "",
            location: user.location ?? "",
          }}
          onSubmit={(data) => updateMutation.mutate(data)}
          isSubmitting={updateMutation.isPending}
          error={updateMutation.error?.response?.data?.message}
        />
      </div>
    </div>
  );
}
