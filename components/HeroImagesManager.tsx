"use client";

import { useState, useTransition } from "react";
import { Plus, Pencil, Trash2, X, Upload, ArrowUp, ArrowDown } from "lucide-react";
import {
  saveHeroImage,
  deleteHeroImage,
  reorderHeroImages,
} from "@/app/(dashboard)/hero-images/actions";
import { HERO_PAGES, type HeroImage } from "@/lib/types";

const field =
  "w-full rounded-lg border border-black/10 bg-white px-3 py-2.5 text-sm outline-none transition-colors focus:border-pink-400 disabled:bg-pink-50/50";
const label = "mb-1.5 block text-xs font-semibold tracking-[0.1em] text-ink-900";

function HeroForm({
  pageKey,
  item,
  showSortOrder,
  onDone,
}: {
  pageKey: string;
  item: HeroImage | null;
  showSortOrder: boolean;
  onDone: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [preview, setPreview] = useState(item?.image ?? "");

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    setPreview(file ? URL.createObjectURL(file) : item?.image ?? "");
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      try {
        await saveHeroImage(formData);
        onDone();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not save hero image");
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
          {item ? "Edit Hero" : "Add Slide"}
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

      <input type="hidden" name="pageKey" value={pageKey} />
      {item && <input type="hidden" name="id" value={item.id} />}
      <input type="hidden" name="image" value={item?.image ?? ""} />

      <div className="flex flex-wrap items-start gap-5">
        <div className="relative h-32 w-32 shrink-0 overflow-hidden rounded-lg border border-black/10 bg-black/[0.02]">
          {preview ? (
            // Blob previews and arbitrary storage hosts bypass next/image.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={preview}
              alt="Preview"
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="flex h-full items-center justify-center text-xs text-ink-500">
              No image
            </span>
          )}
        </div>

        <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-pink-300 px-4 py-3 text-sm text-pink-500 hover:bg-pink-50">
          <Upload size={16} />
          {item ? "Replace image" : "Choose image"}
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

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={label}>EYEBROW</label>
          <input
            name="eyebrow"
            defaultValue={item?.eyebrow ?? ""}
            disabled={pending}
            className={field}
            placeholder="Welcome to"
          />
        </div>
        {showSortOrder && (
          <div>
            <label className={label}>SORT ORDER</label>
            <input
              name="sortOrder"
              type="number"
              defaultValue={item?.sort_order ?? 0}
              disabled={pending}
              className={field}
            />
          </div>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={label}>TITLE</label>
          <input
            name="titleLead"
            required
            defaultValue={item?.title_lead ?? ""}
            disabled={pending}
            className={field}
            placeholder="Luxury Beauty,"
          />
        </div>
        <div>
          <label className={label}>TITLE ACCENT (pink)</label>
          <input
            name="titleAccent"
            defaultValue={item?.title_accent ?? ""}
            disabled={pending}
            className={field}
            placeholder="Tailored For You"
          />
        </div>
      </div>

      <div>
        <label className={label}>BODY</label>
        <textarea
          name="body"
          rows={3}
          defaultValue={item?.body ?? ""}
          disabled={pending}
          className={field}
        />
      </div>

      <label className="flex items-center gap-2 text-sm text-ink-700">
        <input
          type="checkbox"
          name="isActive"
          defaultChecked={item?.is_active ?? true}
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
        {pending ? "SAVING…" : "Save Hero"}
      </button>
    </form>
  );
}

function PageSection({
  pageKey,
  label: pageLabel,
  multi,
  items,
}: {
  pageKey: string;
  label: string;
  multi: boolean;
  items: HeroImage[];
}) {
  const [editing, setEditing] = useState<HeroImage | null>(null);
  const [creating, setCreating] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const sorted = [...items].sort((a, b) => a.sort_order - b.sort_order);
  const showForm = creating || editing;

  function move(index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= sorted.length) return;
    const a = sorted[index];
    const b = sorted[target];
    startTransition(async () => {
      await reorderHeroImages(pageKey, [
        { id: a.id, sort_order: b.sort_order },
        { id: b.id, sort_order: a.sort_order },
      ]);
    });
  }

  return (
    <section className="mb-10">
      <h2 className="mb-3 font-display text-lg text-ink-900">{pageLabel}</h2>

      {!showForm && (multi || sorted.length === 0) && (
        <button
          onClick={() => setCreating(true)}
          className="mb-4 flex items-center gap-2 rounded-full bg-pink-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-pink-600"
        >
          <Plus size={16} /> {multi ? "Add Slide" : "Set Up Hero Image"}
        </button>
      )}

      {showForm && (
        <HeroForm
          pageKey={pageKey}
          item={editing}
          showSortOrder={multi}
          onDone={() => {
            setCreating(false);
            setEditing(null);
          }}
        />
      )}

      {!showForm && sorted.length > 0 && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {sorted.map((item, i) => (
            <div
              key={item.id}
              className={`card-premium flex gap-3 overflow-hidden p-3 ${
                item.is_active ? "" : "opacity-50"
              }`}
            >
              {/* Arbitrary storage hosts bypass next/image config here. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.image}
                alt=""
                className="h-20 w-20 shrink-0 rounded-lg object-cover"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-ink-900">
                  {item.title_lead} {item.title_accent}
                </p>
                {item.eyebrow && (
                  <p className="mt-0.5 truncate text-[11px] text-ink-500">
                    {item.eyebrow}
                  </p>
                )}

                <div className="mt-2 flex items-center gap-3">
                  {multi && (
                    <>
                      <button
                        onClick={() => move(i, -1)}
                        disabled={pending || i === 0}
                        className="text-ink-500 hover:text-pink-500 disabled:opacity-30"
                        title="Move up"
                      >
                        <ArrowUp size={14} />
                      </button>
                      <button
                        onClick={() => move(i, 1)}
                        disabled={pending || i === sorted.length - 1}
                        className="text-ink-500 hover:text-pink-500 disabled:opacity-30"
                        title="Move down"
                      >
                        <ArrowDown size={14} />
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => {
                      setCreating(false);
                      setEditing(item);
                    }}
                    className="text-ink-500 hover:text-pink-500"
                    title="Edit"
                  >
                    <Pencil size={14} />
                  </button>
                  {multi &&
                    (confirmId === item.id ? (
                      <span className="flex items-center gap-1.5 text-xs">
                        <span className="text-ink-500">Delete?</span>
                        <button
                          disabled={pending}
                          onClick={() =>
                            startTransition(async () => {
                              await deleteHeroImage(item.id, pageKey);
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
                      <button
                        onClick={() => setConfirmId(item.id)}
                        className="text-red-500 hover:text-red-700"
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default function HeroImagesManager({ rows }: { rows: HeroImage[] }) {
  return (
    <div>
      {HERO_PAGES.map((p) => (
        <PageSection
          key={p.key}
          pageKey={p.key}
          label={p.label}
          multi={p.multi}
          items={rows.filter((r) => r.page_key === p.key)}
        />
      ))}
    </div>
  );
}
