"use client";

import { FormEvent, useState } from "react";
import { Button } from "./ui/Button";

export type ProfileFormUser = {
  name: string;
  email: string;
  phone?: string;
  location?: string;
};

export function ProfileForm({
  user,
  onSubmit,
  isSubmitting,
  error,
}: {
  user: ProfileFormUser;
  onSubmit: (data: { name: string; email: string; phone: string; location: string }) => void;
  isSubmitting?: boolean;
  error?: string | null;
}) {
  const [name, setName] = useState(user.name ?? "");
  const [email, setEmail] = useState(user.email ?? "");
  const [phone, setPhone] = useState(user.phone ?? "");
  const [location, setLocation] = useState(user.location ?? "");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit({ name, email, phone, location });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-400">Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="h-10 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 text-sm text-slate-100 outline-none focus:border-sky-500"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-400">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="h-10 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 text-sm text-slate-100 outline-none focus:border-sky-500"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-400">Phone</label>
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="h-10 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 text-sm text-slate-100 outline-none focus:border-sky-500"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-400">Location</label>
        <input
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="h-10 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 text-sm text-slate-100 outline-none focus:border-sky-500"
        />
      </div>
      {error ? (
        <div className="rounded-xl border border-rose-900/60 bg-rose-950/30 px-3 py-2 text-sm text-rose-200">
          {error}
        </div>
      ) : null}
      <Button type="submit" loading={isSubmitting}>
        Save profile
      </Button>
    </form>
  );
}
