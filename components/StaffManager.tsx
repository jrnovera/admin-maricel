"use client";

import { useState, useTransition } from "react";
import { UserPlus, X } from "lucide-react";
import { setStaffRole, addStaffByEmail } from "@/app/(dashboard)/staff/actions";

const field =
  "w-full rounded-lg border border-black/10 bg-white px-3 py-2.5 text-sm outline-none focus:border-pink-400 disabled:bg-pink-50/50";
const label = "mb-1.5 block text-xs font-semibold tracking-[0.1em] text-ink-900";

export type StaffRow = {
  id: string;
  email: string;
  full_name: string | null;
  role: "admin" | "therapist";
};

export default function StaffManager({
  staff,
  currentUserId,
}: {
  staff: StaffRow[];
  currentUserId: string;
}) {
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const form = e.currentTarget;
    const formData = new FormData(form);

    startTransition(async () => {
      try {
        await addStaffByEmail(formData);
        form.reset();
        setAdding(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not add staff");
      }
    });
  }

  function changeRole(id: string, role: "admin" | "therapist" | null) {
    setError("");
    startTransition(async () => {
      try {
        await setStaffRole(id, role);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not update role");
      }
    });
  }

  return (
    <div>
      {error && (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {!adding && (
        <button
          onClick={() => setAdding(true)}
          className="mb-6 flex items-center gap-2 rounded-full bg-pink-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-pink-600"
        >
          <UserPlus size={16} /> Add Staff
        </button>
      )}

      {adding && (
        <form
          onSubmit={handleAdd}
          className="mb-6 space-y-4 rounded-xl border border-black/10 bg-white p-5"
        >
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg text-ink-900">Add Staff Member</h2>
            <button type="button" onClick={() => setAdding(false)} className="text-ink-500">
              <X size={18} />
            </button>
          </div>

          <p className="rounded-lg bg-blush-50 px-3 py-2 text-xs text-ink-500">
            They need an account first — ask them to sign up, then grant access here.
            No password is handled in this portal.
          </p>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <label className={label}>EMAIL</label>
              <input name="email" type="email" required disabled={pending} className={field} />
            </div>
            <div>
              <label className={label}>ROLE</label>
              <select name="role" defaultValue="therapist" disabled={pending} className={field}>
                <option value="therapist">Therapist</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>

          <div>
            <label className={label}>FULL NAME (OPTIONAL)</label>
            <input name="fullName" disabled={pending} className={field} />
          </div>

          <button
            type="submit"
            disabled={pending}
            className="rounded-full bg-pink-500 px-6 py-2.5 text-sm font-medium text-white hover:bg-pink-600 disabled:opacity-60"
          >
            {pending ? "ADDING…" : "Add Staff"}
          </button>
        </form>
      )}

      <div className="overflow-x-auto card-premium">
        <table className="w-full text-sm">
          <thead className="border-b border-black/[0.06] bg-black/[0.015] text-left">
            <tr className="text-[11px] tracking-[0.1em] text-ink-500">
              <th className="px-4 py-3 font-semibold">NAME</th>
              <th className="px-4 py-3 font-semibold">EMAIL</th>
              <th className="px-4 py-3 font-semibold">ROLE</th>
              <th className="px-4 py-3 text-right font-semibold">ACCESS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-pink-50">
            {staff.map((s) => {
              const isSelf = s.id === currentUserId;
              return (
                <tr key={s.id}>
                  <td className="px-4 py-3 font-medium text-ink-900">
                    {s.full_name || "—"}
                    {isSelf && <span className="ml-2 text-xs text-pink-500">(you)</span>}
                  </td>
                  <td className="px-4 py-3 text-xs text-ink-500">{s.email}</td>
                  <td className="px-4 py-3">
                    <select
                      value={s.role}
                      disabled={pending || isSelf}
                      onChange={(e) =>
                        changeRole(s.id, e.target.value as "admin" | "therapist")
                      }
                      className="rounded-lg border border-black/10 bg-white px-2 py-1.5 text-xs outline-none focus:border-pink-400 disabled:opacity-60"
                    >
                      <option value="therapist">Therapist</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {!isSelf && (
                      <button
                        disabled={pending}
                        onClick={() => {
                          if (!confirm(`Remove ${s.full_name || s.email} from staff?`)) return;
                          changeRole(s.id, null);
                        }}
                        className="text-xs text-red-600 hover:text-red-800"
                      >
                        Revoke
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {staff.length === 0 && (
          <p className="px-6 py-12 text-center text-sm text-ink-500">
            No staff yet.
          </p>
        )}
      </div>
    </div>
  );
}
