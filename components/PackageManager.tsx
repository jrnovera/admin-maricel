"use client";

import { useState, useTransition } from "react";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import { savePackage, deletePackage } from "@/app/(dashboard)/packages/actions";
import { PACKAGE_ICONS, type MbcPackage } from "@/lib/types";

const field =
  "w-full rounded-lg border border-black/10 bg-white px-3 py-2.5 text-sm outline-none transition-colors focus:border-pink-400 disabled:bg-pink-50/50";
const label = "mb-1.5 block text-xs font-semibold tracking-[0.1em] text-ink-900";

function PackageForm({
  pkg,
  onDone,
}: {
  pkg: MbcPackage | null;
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
        await savePackage(formData);
        onDone();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not save package");
      }
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mb-6 space-y-4 rounded-xl border border-black/10 bg-white p-5"
    >
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg text-ink-900">
          {pkg ? "Edit Package" : "New Package"}
        </h2>
        <button type="button" onClick={onDone} className="text-ink-500">
          <X size={18} />
        </button>
      </div>

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {pkg && <input type="hidden" name="id" value={pkg.id} />}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={label}>NAME</label>
          <input name="name" required defaultValue={pkg?.name ?? ""} disabled={pending} className={field} />
        </div>
        <div>
          <label className={label}>ICON</label>
          <select
            name="icon"
            required
            defaultValue={pkg?.icon ?? "sparkle"}
            disabled={pending}
            className={field}
          >
            {PACKAGE_ICONS.map((i) => (
              <option key={i} value={i}>
                {i}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className={label}>INCLUDES (COMMA-SEPARATED)</label>
        <input
          name="includes"
          required
          defaultValue={pkg?.includes.join(", ") ?? ""}
          placeholder="e.g. Facial, Blow Dry, Manicure"
          disabled={pending}
          className={field}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className={label}>PRICE (AED)</label>
          <input
            name="price"
            type="number"
            step="0.01"
            min="0"
            required
            defaultValue={pkg?.price ?? ""}
            disabled={pending}
            className={field}
          />
        </div>
        <div>
          <label className={label}>DURATION</label>
          <input
            name="duration"
            required
            defaultValue={pkg?.duration ?? ""}
            placeholder="e.g. 2 hrs"
            disabled={pending}
            className={field}
          />
        </div>
        <div>
          <label className={label}>SORT ORDER</label>
          <input
            name="sortOrder"
            type="number"
            defaultValue={pkg?.sort_order ?? 0}
            disabled={pending}
            className={field}
          />
        </div>
      </div>

      <div>
        <label className={label}>PRICE LABEL (OPTIONAL)</label>
        <input
          name="priceLabel"
          defaultValue={pkg?.price_label ?? ""}
          placeholder='e.g. "From AED 299" — leave blank for a fixed price'
          disabled={pending}
          className={field}
        />
      </div>

      <label className="flex items-center gap-2 text-sm text-ink-700">
        <input
          type="checkbox"
          name="isActive"
          defaultChecked={pkg?.is_active ?? true}
          disabled={pending}
          className="h-4 w-4 accent-pink-500"
        />
        Show on the public site
      </label>

      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-pink-500 px-6 py-2.5 text-sm font-medium text-white hover:bg-pink-600 disabled:opacity-60"
      >
        {pending ? "SAVING…" : "Save Package"}
      </button>
    </form>
  );
}

export default function PackageManager({ packages }: { packages: MbcPackage[] }) {
  const [editing, setEditing] = useState<MbcPackage | null>(null);
  const [creating, setCreating] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div>
      {!creating && !editing && (
        <button
          onClick={() => setCreating(true)}
          className="mb-6 flex items-center gap-2 rounded-full bg-pink-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-pink-600"
        >
          <Plus size={16} /> New Package
        </button>
      )}

      {(creating || editing) && (
        <PackageForm
          pkg={editing}
          onDone={() => {
            setCreating(false);
            setEditing(null);
          }}
        />
      )}

      <div className="overflow-hidden card-premium">
        <table className="w-full text-sm">
          <tbody className="divide-y divide-pink-50">
            {packages.map((p) => (
              <tr key={p.id} className={p.is_active ? "" : "opacity-50"}>
                <td className="px-4 py-3">
                  {p.name}
                  {!p.is_active && (
                    <span className="ml-2 rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-600">
                      Hidden
                    </span>
                  )}
                  <p className="mt-0.5 text-xs text-ink-500">{p.includes.join(", ")}</p>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right font-medium">
                  {p.price_label ?? `AED ${Number(p.price).toLocaleString()}`}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right text-xs text-ink-500">
                  {p.duration}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right">
                  {confirmId === p.id ? (
                    <span className="flex items-center justify-end gap-2 text-xs">
                      <span className="text-ink-500">Delete?</span>
                      <button
                        disabled={pending}
                        onClick={() =>
                          startTransition(async () => {
                            await deletePackage(p.id);
                            setConfirmId(null);
                          })
                        }
                        className="font-medium text-red-600 hover:text-red-800"
                      >
                        Yes
                      </button>
                      <button onClick={() => setConfirmId(null)} className="text-ink-500">
                        No
                      </button>
                    </span>
                  ) : (
                    <span className="flex items-center justify-end gap-3">
                      <button
                        onClick={() => {
                          setCreating(false);
                          setEditing(p);
                        }}
                        className="text-ink-500 hover:text-pink-500"
                        title={`Edit ${p.name}`}
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => setConfirmId(p.id)}
                        className="text-red-500 hover:text-red-700"
                        title={`Delete ${p.name}`}
                      >
                        <Trash2 size={15} />
                      </button>
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {packages.length === 0 && (
        <p className="card-premium px-6 py-12 text-center text-sm text-ink-500">
          No packages yet.
        </p>
      )}
    </div>
  );
}
