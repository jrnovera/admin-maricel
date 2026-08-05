"use client";

import { useState, useTransition } from "react";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import {
  savePointGroup,
  deletePointGroup,
  saveRedemptionTier,
  deleteRedemptionTier,
} from "@/app/(dashboard)/point-system/actions";
import { PACKAGE_ICONS, type MbcPointGroup, type MbcRedemptionTier } from "@/lib/types";

const field =
  "w-full rounded-lg border border-black/10 bg-white px-3 py-2.5 text-sm outline-none transition-colors focus:border-pink-400 disabled:bg-pink-50/50";
const label = "mb-1.5 block text-xs font-semibold tracking-[0.1em] text-ink-900";

function itemsToText(group: MbcPointGroup | null) {
  if (!group) return "";
  return group.mbc_point_items
    .slice()
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((i) => `${i.name} | ${i.points}`)
    .join("\n");
}

function GroupForm({
  group,
  nextSortOrder,
  onDone,
}: {
  group: MbcPointGroup | null;
  nextSortOrder: number;
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
        await savePointGroup(formData);
        onDone();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not save group");
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
          {group ? "Edit Group" : "New Group"}
        </h2>
        <button type="button" onClick={onDone} className="text-ink-500">
          <X size={18} />
        </button>
      </div>

      {error && (
        <p className="whitespace-pre-line rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {group && <input type="hidden" name="id" value={group.id} />}
      {group && <input type="hidden" name="slug" value={group.slug} />}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={label}>TITLE</label>
          <input name="title" required defaultValue={group?.title ?? ""} disabled={pending} className={field} />
        </div>
        <div>
          <label className={label}>ICON</label>
          <select name="icon" required defaultValue={group?.icon ?? "sparkle"} disabled={pending} className={field}>
            {PACKAGE_ICONS.map((i) => (
              <option key={i} value={i}>
                {i}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className={label}>ITEMS (ONE PER LINE — &quot;SERVICE NAME | POINTS&quot;)</label>
        <textarea
          name="itemsText"
          required
          rows={10}
          defaultValue={itemsToText(group)}
          placeholder={"Manicure Express | 3\nGel Polish Hands or Feet | 3"}
          disabled={pending}
          className={`${field} font-mono text-xs leading-relaxed`}
        />
        <p className="mt-1 text-xs text-ink-500">
          Order here sets the display order. Saving replaces the whole list for this group.
        </p>
      </div>

      <div>
        <label className={label}>NOTE (OPTIONAL)</label>
        <input name="note" defaultValue={group?.note ?? ""} disabled={pending} className={field} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={label}>SORT ORDER</label>
          <input
            name="sortOrder"
            type="number"
            defaultValue={group?.sort_order ?? nextSortOrder}
            disabled={pending}
            className={field}
          />
        </div>
        <label className="flex items-center gap-2 self-end pb-2.5 text-sm text-ink-700">
          <input
            type="checkbox"
            name="isActive"
            defaultChecked={group?.is_active ?? true}
            disabled={pending}
            className="h-4 w-4 accent-pink-500"
          />
          Show on the public site
        </label>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-pink-500 px-6 py-2.5 text-sm font-medium text-white hover:bg-pink-600 disabled:opacity-60"
      >
        {pending ? "SAVING…" : "Save Group"}
      </button>
    </form>
  );
}

function GroupsSection({ groups }: { groups: MbcPointGroup[] }) {
  const [editing, setEditing] = useState<MbcPointGroup | null>(null);
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
          <Plus size={16} /> New Group
        </button>
      )}

      {(creating || editing) && (
        <GroupForm
          group={editing}
          nextSortOrder={Math.max(0, ...groups.map((g) => g.sort_order)) + 1}
          onDone={() => {
            setCreating(false);
            setEditing(null);
          }}
        />
      )}

      <div className="space-y-3">
        {groups.map((g) => (
          <div key={g.id} className={`card-premium p-4 ${g.is_active ? "" : "opacity-50"}`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium text-ink-900">
                  {g.title}
                  {!g.is_active && (
                    <span className="ml-2 rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-600">
                      Hidden
                    </span>
                  )}
                </p>
                <p className="mt-0.5 text-xs text-ink-500">
                  {g.mbc_point_items.length} item{g.mbc_point_items.length === 1 ? "" : "s"}
                </p>
              </div>

              {confirmId === g.id ? (
                <span className="flex shrink-0 items-center gap-2 text-xs">
                  <span className="text-ink-500">Delete?</span>
                  <button
                    disabled={pending}
                    onClick={() =>
                      startTransition(async () => {
                        await deletePointGroup(g.id);
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
                <span className="flex shrink-0 items-center gap-3">
                  <button
                    onClick={() => {
                      setCreating(false);
                      setEditing(g);
                    }}
                    className="text-ink-500 hover:text-pink-500"
                    title={`Edit ${g.title}`}
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    onClick={() => setConfirmId(g.id)}
                    className="text-red-500 hover:text-red-700"
                    title={`Delete ${g.title}`}
                  >
                    <Trash2 size={15} />
                  </button>
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {groups.length === 0 && (
        <p className="card-premium px-6 py-12 text-center text-sm text-ink-500">
          No point groups yet.
        </p>
      )}
    </div>
  );
}

function TierForm({
  tier,
  nextSortOrder,
  onDone,
}: {
  tier: MbcRedemptionTier | null;
  nextSortOrder: number;
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
        await saveRedemptionTier(formData);
        onDone();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not save tier");
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
          {tier ? "Edit Redemption Tier" : "New Redemption Tier"}
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

      {tier && <input type="hidden" name="id" value={tier.id} />}

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className={label}>PRICE LABEL</label>
          <input
            name="price"
            required
            defaultValue={tier?.price ?? ""}
            placeholder="e.g. AED 100"
            disabled={pending}
            className={field}
          />
        </div>
        <div>
          <label className={label}>POINTS</label>
          <input
            name="points"
            type="number"
            step="0.5"
            min="0"
            required
            defaultValue={tier?.points ?? ""}
            disabled={pending}
            className={field}
          />
        </div>
        <div>
          <label className={label}>SORT ORDER</label>
          <input
            name="sortOrder"
            type="number"
            defaultValue={tier?.sort_order ?? nextSortOrder}
            disabled={pending}
            className={field}
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-pink-500 px-6 py-2.5 text-sm font-medium text-white hover:bg-pink-600 disabled:opacity-60"
      >
        {pending ? "SAVING…" : "Save Tier"}
      </button>
    </form>
  );
}

function TiersSection({ tiers }: { tiers: MbcRedemptionTier[] }) {
  const [editing, setEditing] = useState<MbcRedemptionTier | null>(null);
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
          <Plus size={16} /> New Tier
        </button>
      )}

      {(creating || editing) && (
        <TierForm
          tier={editing}
          nextSortOrder={Math.max(0, ...tiers.map((t) => t.sort_order)) + 1}
          onDone={() => {
            setCreating(false);
            setEditing(null);
          }}
        />
      )}

      <div className="overflow-hidden card-premium">
        <table className="w-full text-sm">
          <tbody className="divide-y divide-pink-50">
            {tiers.map((t) => (
              <tr key={t.id}>
                <td className="px-4 py-3 font-medium">{t.price}</td>
                <td className="whitespace-nowrap px-4 py-3 text-right text-ink-500">
                  {t.points} pts
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right">
                  {confirmId === t.id ? (
                    <span className="flex items-center justify-end gap-2 text-xs">
                      <span className="text-ink-500">Delete?</span>
                      <button
                        disabled={pending}
                        onClick={() =>
                          startTransition(async () => {
                            await deleteRedemptionTier(t.id);
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
                          setEditing(t);
                        }}
                        className="text-ink-500 hover:text-pink-500"
                        title={`Edit ${t.price}`}
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => setConfirmId(t.id)}
                        className="text-red-500 hover:text-red-700"
                        title={`Delete ${t.price}`}
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

      {tiers.length === 0 && (
        <p className="card-premium px-6 py-12 text-center text-sm text-ink-500">
          No redemption tiers yet.
        </p>
      )}
    </div>
  );
}

export default function PointSystemManager({
  groups,
  tiers,
}: {
  groups: MbcPointGroup[];
  tiers: MbcRedemptionTier[];
}) {
  return (
    <div className="space-y-10">
      <section>
        <h2 className="mb-1 font-display text-lg text-ink-900">Redemption Tiers</h2>
        <p className="mb-4 text-sm text-ink-500">The circles at the top of the page.</p>
        <TiersSection tiers={tiers} />
      </section>

      <section>
        <h2 className="mb-1 font-display text-lg text-ink-900">Service Point Values</h2>
        <p className="mb-4 text-sm text-ink-500">
          Grouped price lists shown below the redemption tiers.
        </p>
        <GroupsSection groups={groups} />
      </section>
    </div>
  );
}
