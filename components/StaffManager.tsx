"use client";

import { Fragment, useState, useTransition } from "react";
import { UserPlus, X, Pencil, Upload, Copy, Check } from "lucide-react";
import {
  setStaffRole,
  setPortalAccess,
  addStaffByEmail,
  updateStaffProfile,
} from "@/app/(dashboard)/staff/actions";
import { TEAM_CATEGORIES } from "@/lib/types";
import Modal from "@/components/Modal";

const field =
  "w-full rounded-lg border border-black/10 bg-white px-3 py-2.5 text-sm outline-none focus:border-pink-400 disabled:bg-pink-50/50";
const label = "mb-1.5 block text-xs font-semibold tracking-[0.1em] text-ink-900";

export type StaffRow = {
  id: string;
  email: string;
  full_name: string | null;
  role: "admin" | "therapist";
  photo_url: string | null;
  display_role: string | null;
  bio: string | null;
  show_on_site: boolean;
  sort_order: number;
  team_categories: string[];
  /** Whether this account can actually sign in to the portal — separate
   *  from `role`, since a Team-page-only profile keeps a role but is banned
   *  at the Auth layer so it can never log in. */
  canLogin: boolean;
};

/** One-time reveal of an auto-generated password right after account
 *  creation — this is the only place it's ever shown, so the admin needs to
 *  copy and hand it off before dismissing. */
function NewAccountBanner({
  account,
  onDismiss,
}: {
  account: { email: string; password: string };
  onDismiss: () => void;
}) {
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard.writeText(account.password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-emerald-900">
            Account created for {account.email}
          </p>
          <p className="mt-1 text-xs text-emerald-800">
            This password only shows once — copy it and share it with them
            now. They can sign in right away.
          </p>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          className="shrink-0 text-emerald-700 hover:text-emerald-900"
        >
          <X size={16} />
        </button>
      </div>
      <div className="mt-3 flex items-center gap-2">
        <code className="rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm text-emerald-900">
          {account.password}
        </code>
        <button
          type="button"
          onClick={copy}
          className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-medium text-white hover:bg-emerald-700"
        >
          {copied ? <Check size={13} /> : <Copy size={13} />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
    </div>
  );
}

/** Shared photo/title/bio/visibility fields used by both the add and edit forms. */
function ProfileFields({
  defaults,
  pending,
}: {
  defaults?: Pick<
    StaffRow,
    | "photo_url"
    | "display_role"
    | "bio"
    | "show_on_site"
    | "sort_order"
    | "team_categories"
  >;
  pending: boolean;
}) {
  const [preview, setPreview] = useState(defaults?.photo_url ?? "");

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    setPreview(file ? URL.createObjectURL(file) : defaults?.photo_url ?? "");
  }

  return (
    <>
      <div className="flex flex-wrap items-start gap-5">
        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full border border-black/10 bg-black/[0.02]">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="Preview" className="h-full w-full object-cover" />
          ) : (
            <span className="flex h-full items-center justify-center text-[10px] text-ink-500">
              No photo
            </span>
          )}
        </div>
        <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-pink-300 px-4 py-3 text-sm text-pink-500 hover:bg-pink-50">
          <Upload size={16} />
          {defaults?.photo_url ? "Replace photo" : "Choose photo"}
          <input
            type="file"
            name="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            onChange={handleFile}
            disabled={pending}
            className="hidden"
          />
        </label>
      </div>

      <div>
        <label className={label}>SORT ORDER</label>
        <input
          name="sortOrder"
          type="number"
          defaultValue={defaults?.sort_order ?? 0}
          disabled={pending}
          className={field}
        />
      </div>

      <div>
        <label className={label}>BIO (OPTIONAL)</label>
        <textarea
          name="bio"
          rows={2}
          defaultValue={defaults?.bio ?? ""}
          disabled={pending}
          className={field}
        />
      </div>

      <div>
        <label className={label}>
          OUR TEAM SECTION(S) — pick one or more
        </label>
        <div className="flex flex-wrap gap-x-5 gap-y-2">
          {TEAM_CATEGORIES.map((cat) => (
            <label
              key={cat}
              className="flex items-center gap-2 text-sm text-ink-700"
            >
              <input
                type="checkbox"
                name="teamCategories"
                value={cat}
                defaultChecked={defaults?.team_categories?.includes(cat) ?? false}
                disabled={pending}
                className="h-4 w-4 accent-pink-500"
              />
              {cat}
            </label>
          ))}
        </div>
        <p className="mt-1.5 text-xs text-ink-500">
          Which group(s) they&apos;re listed under on the Our Team page — e.g. a
          nail tech who also does massage can be both Beauty Specialist and
          Therapist. This also becomes their public title, so no separate one
          to type in.
        </p>
      </div>

      <label className="flex items-center gap-2 text-sm text-ink-700">
        <input
          type="checkbox"
          name="showOnSite"
          defaultChecked={defaults?.show_on_site ?? false}
          disabled={pending}
          className="h-4 w-4 accent-pink-500"
        />
        Show on the public Our Team page
      </label>
    </>
  );
}

function EditProfileForm({
  staff,
  onDone,
}: {
  staff: StaffRow;
  onDone: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      try {
        await updateStaffProfile(formData);
        onDone();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not save profile");
      }
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-xl bg-white p-5"
    >
      <div className="flex items-center justify-between">
        <h3 className="font-display text-base text-ink-900">
          Public Profile — {staff.full_name || staff.email}
        </h3>
        <button type="button" onClick={onDone} className="text-ink-500">
          <X size={18} />
        </button>
      </div>

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <input type="hidden" name="id" value={staff.id} />
      <div>
        <label className={label}>FULL NAME</label>
        <input
          name="fullName"
          defaultValue={staff.full_name ?? ""}
          disabled={pending}
          className={field}
        />
      </div>

      <ProfileFields
        defaults={{
          photo_url: staff.photo_url,
          display_role: staff.display_role,
          bio: staff.bio,
          show_on_site: staff.show_on_site,
          sort_order: staff.sort_order,
          team_categories: staff.team_categories,
        }}
        pending={pending}
      />

      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-pink-500 px-6 py-2.5 text-sm font-medium text-white hover:bg-pink-600 disabled:opacity-60"
      >
        {pending ? "SAVING…" : "Save Profile"}
      </button>
    </form>
  );
}

export default function StaffManager({
  staff,
  currentUserId,
}: {
  staff: StaffRow[];
  currentUserId: string;
}) {
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [newAccount, setNewAccount] = useState<{
    email: string;
    password: string;
  } | null>(null);
  const [pending, startTransition] = useTransition();
  const editingStaff = staff.find((s) => s.id === editingId) ?? null;

  function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setNewAccount(null);
    const form = e.currentTarget;
    const formData = new FormData(form);
    const email = String(formData.get("email") ?? "");

    startTransition(async () => {
      try {
        const { tempPassword } = await addStaffByEmail(formData);
        form.reset();
        setAdding(false);
        if (tempPassword) setNewAccount({ email, password: tempPassword });
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

  function toggleLogin(id: string, canLogin: boolean) {
    setError("");
    startTransition(async () => {
      try {
        await setPortalAccess(id, canLogin);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not update login access");
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

      {newAccount && (
        <NewAccountBanner
          account={newAccount}
          onDismiss={() => setNewAccount(null)}
        />
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
        <Modal maxWidth="max-w-2xl" onClose={() => setAdding(false)}>
          <form
            onSubmit={handleAdd}
            className="space-y-4 rounded-xl bg-white p-5"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg text-ink-900">Add Staff Member</h2>
              <button type="button" onClick={() => setAdding(false)} className="text-ink-500">
                <X size={18} />
              </button>
            </div>

            <p className="rounded-lg bg-blush-50 px-3 py-2 text-xs text-ink-500">
              By default this just adds them to the public Our Team page — no
              portal login. Check the box below only if they also need to sign
              in here.
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

            <label className="flex items-start gap-2 text-sm text-ink-700">
              <input
                type="checkbox"
                name="portalAccess"
                disabled={pending}
                className="mt-0.5 h-4 w-4 accent-pink-500"
              />
              <span>
                Give them portal login access
                <span className="block text-xs font-normal text-ink-500">
                  Leave unchecked for a Team-page-only profile with no way to
                  sign in.
                </span>
              </span>
            </label>

            <div className="border-t border-black/[0.06] pt-4">
              <p className="mb-3 text-xs font-semibold tracking-[0.1em] text-ink-500">
                PUBLIC OUR TEAM PROFILE (OPTIONAL)
              </p>
              <div className="space-y-4">
                <ProfileFields pending={pending} />
              </div>
            </div>

            <button
              type="submit"
              disabled={pending}
              className="rounded-full bg-pink-500 px-6 py-2.5 text-sm font-medium text-white hover:bg-pink-600 disabled:opacity-60"
            >
              {pending ? "ADDING…" : "Add Staff"}
            </button>
          </form>
        </Modal>
      )}

      <div className="overflow-x-auto card-premium">
        <table className="w-full text-sm">
          <thead className="border-b border-black/[0.06] bg-black/[0.015] text-left">
            <tr className="text-[11px] tracking-[0.1em] text-ink-500">
              <th className="px-4 py-3 font-semibold">NAME</th>
              <th className="px-4 py-3 font-semibold">EMAIL</th>
              <th className="px-4 py-3 font-semibold">ROLE</th>
              <th className="px-4 py-3 font-semibold">LOGIN</th>
              <th className="px-4 py-3 font-semibold">TEAM SECTION(S)</th>
              <th className="px-4 py-3 font-semibold">ON SITE</th>
              <th className="px-4 py-3 text-right font-semibold">ACTIONS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-pink-50">
            {staff.map((s) => {
              const isSelf = s.id === currentUserId;
              return (
                <Fragment key={s.id}>
                  <tr>
                    <td className="px-4 py-3 font-medium text-ink-900">
                      <span className="flex items-center gap-2">
                        {s.photo_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={s.photo_url}
                            alt=""
                            className="h-7 w-7 shrink-0 rounded-full object-cover"
                          />
                        ) : (
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-pink-50 text-[10px] text-pink-400">
                            {(s.full_name || s.email).slice(0, 1).toUpperCase()}
                          </span>
                        )}
                        {s.full_name || "—"}
                      </span>
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
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        disabled={pending || isSelf}
                        onClick={() => toggleLogin(s.id, !s.canLogin)}
                        title={
                          isSelf
                            ? "You can't disable your own login"
                            : s.canLogin
                              ? "Click to disable portal login"
                              : "Click to enable portal login"
                        }
                        className={`rounded-full px-2 py-0.5 text-[11px] font-medium disabled:opacity-60 ${
                          s.canLogin
                            ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                            : "bg-black/[0.04] text-ink-500 hover:bg-black/[0.08]"
                        }`}
                      >
                        {s.canLogin ? "Enabled" : "Disabled"}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      {s.team_categories.length > 0 ? (
                        <span className="flex flex-wrap gap-1">
                          {s.team_categories.map((cat) => (
                            <span
                              key={cat}
                              className="rounded-full bg-pink-50 px-2 py-0.5 text-[11px] font-medium text-pink-600"
                            >
                              {cat}
                            </span>
                          ))}
                        </span>
                      ) : (
                        <span className="text-xs text-ink-500">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {s.show_on_site ? (
                        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                          Visible
                        </span>
                      ) : (
                        <span className="rounded-full bg-black/[0.04] px-2 py-0.5 text-[11px] text-ink-500">
                          Hidden
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="flex items-center justify-end gap-4">
                        <button
                          onClick={() =>
                            setEditingId(editingId === s.id ? null : s.id)
                          }
                          className="flex items-center gap-1 text-xs font-medium text-ink-500 hover:text-pink-500"
                        >
                          <Pencil size={12} /> Profile
                        </button>
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
                      </span>
                    </td>
                  </tr>
                </Fragment>
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

      {editingStaff && (
        <Modal maxWidth="max-w-2xl" onClose={() => setEditingId(null)}>
          <EditProfileForm staff={editingStaff} onDone={() => setEditingId(null)} />
        </Modal>
      )}
    </div>
  );
}
