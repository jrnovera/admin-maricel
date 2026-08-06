"use client";

import { useState, useTransition } from "react";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import {
  saveServiceGroup,
  deleteServiceGroup,
} from "@/app/(dashboard)/services/actions";
import { PACKAGE_ICONS, type MbcServiceGroup } from "@/lib/types";
import Modal from "@/components/Modal";

const field =
  "w-full rounded-lg border border-black/10 bg-white px-3 py-2.5 text-sm outline-none transition-colors focus:border-pink-400 disabled:bg-pink-50/50";
const label = "mb-1.5 block text-xs font-semibold tracking-[0.1em] text-ink-900";

/** A bare number round-trips as a plain price; a label ("From AED 25") is kept verbatim. */
function priceText(item: MbcServiceGroup["mbc_services"][number]) {
  return item.price_label ?? String(Number(item.price));
}

function itemsToText(group: MbcServiceGroup | null) {
  if (!group) return "";
  return group.mbc_services
    .slice()
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((i) => `${i.name} | ${priceText(i)}`)
    .join("\n");
}

function GroupForm({
  group,
  nextSortOrder,
  onDone,
}: {
  group: MbcServiceGroup | null;
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
        await saveServiceGroup(formData);
        onDone();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not save group");
      }
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-xl bg-white p-5"
    >
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg text-ink-900">
          {group ? "Edit Service Group" : "New Service Group"}
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
          <input
            name="title"
            required
            defaultValue={group?.title ?? ""}
            placeholder="e.g. Nail Services"
            disabled={pending}
            className={field}
          />
        </div>
        <div>
          <label className={label}>ICON</label>
          <select
            name="icon"
            required
            defaultValue={group?.icon ?? "sparkle"}
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
        <label className={label}>
          SERVICES (ONE PER LINE — &quot;SERVICE NAME | PRICE&quot;)
        </label>
        <textarea
          name="itemsText"
          required
          rows={12}
          defaultValue={itemsToText(group)}
          placeholder={"Manicure Express | 40\nGel Polish Hands or Feet | 40\nNail Art | From AED 25"}
          disabled={pending}
          className={`${field} font-mono text-xs leading-relaxed`}
        />
        <p className="mt-1 text-xs text-ink-500">
          A plain number shows as &quot;AED 40&quot;. Write it out in full to
          show something else, e.g. &quot;From AED 25&quot;. Order here sets the
          display order, and saving replaces the whole list for this group.
        </p>
      </div>

      <div>
        <label className={label}>BLURB (SHOWN ON THE HOME PAGE GRID)</label>
        <input
          name="blurb"
          defaultValue={group?.blurb ?? ""}
          placeholder="e.g. Manicure, Pedicure, Extensions & Nail Art"
          disabled={pending}
          className={field}
        />
      </div>

      <div>
        <label className={label}>NOTE (OPTIONAL FOOTNOTE)</label>
        <input
          name="note"
          defaultValue={group?.note ?? ""}
          placeholder="e.g. Using EVO, OPI, ESSIE, and ORLY."
          disabled={pending}
          className={field}
        />
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

export default function ServiceManager({
  groups,
}: {
  groups: MbcServiceGroup[];
}) {
  const [editing, setEditing] = useState<MbcServiceGroup | null>(null);
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
          <Plus size={16} /> New Service Group
        </button>
      )}

      {(creating || editing) && (
        <Modal
          maxWidth="max-w-2xl"
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
        >
          <GroupForm
            group={editing}
            nextSortOrder={Math.max(0, ...groups.map((g) => g.sort_order)) + 1}
            onDone={() => {
              setCreating(false);
              setEditing(null);
            }}
          />
        </Modal>
      )}

      <div className="space-y-3">
        {groups.map((g) => {
          const items = g.mbc_services
            .slice()
            .sort((a, b) => a.sort_order - b.sort_order);

          return (
            <div
              key={g.id}
              className={`card-premium p-4 ${g.is_active ? "" : "opacity-50"}`}
            >
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
                    {items.length} service{items.length === 1 ? "" : "s"}
                  </p>
                </div>

                {confirmId === g.id ? (
                  <span className="flex shrink-0 items-center gap-2 text-xs">
                    <span className="text-ink-500">Delete?</span>
                    <button
                      disabled={pending}
                      onClick={() =>
                        startTransition(async () => {
                          await deleteServiceGroup(g.id);
                          setConfirmId(null);
                        })
                      }
                      className="font-medium text-red-600 hover:text-red-800"
                    >
                      Yes
                    </button>
                    <button
                      onClick={() => setConfirmId(null)}
                      className="text-ink-500"
                    >
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

              {items.length > 0 && (
                <ul className="mt-3 grid gap-x-8 gap-y-1 border-t border-pink-50 pt-3 text-xs sm:grid-cols-2">
                  {items.map((item) => (
                    <li
                      key={item.id}
                      className={`flex items-baseline justify-between gap-3 ${
                        item.is_active ? "" : "opacity-50"
                      }`}
                    >
                      <span className="text-ink-700">{item.name}</span>
                      <span className="shrink-0 font-medium text-ink-900">
                        {item.price_label ??
                          `AED ${Number(item.price).toLocaleString()}`}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>

      {groups.length === 0 && (
        <p className="card-premium px-6 py-12 text-center text-sm text-ink-500">
          No service groups yet.
        </p>
      )}
    </div>
  );
}
