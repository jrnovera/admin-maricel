"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { Plus, Pencil, Trash2, X, Upload } from "lucide-react";
import {
  saveGalleryItem,
  deleteGalleryItem,
} from "@/app/(dashboard)/gallery/actions";
import { GALLERY_CATEGORIES, type GalleryItem } from "@/lib/types";

const field =
  "w-full rounded-lg border border-black/10 bg-white px-3 py-2.5 text-sm outline-none transition-colors focus:border-pink-400 disabled:bg-pink-50/50";
const label = "mb-1.5 block text-xs font-semibold tracking-[0.1em] text-ink-900";

function ItemForm({
  item,
  onDone,
}: {
  item: GalleryItem | null;
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
        await saveGalleryItem(formData);
        onDone();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not save image");
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
          {item ? "Edit Photo" : "Upload Photo"}
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

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="sm:col-span-2">
          <label className={label}>CAPTION</label>
          <input
            name="caption"
            required
            defaultValue={item?.caption ?? ""}
            disabled={pending}
            className={field}
          />
        </div>
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
      </div>

      <div>
        <label className={label}>CATEGORY</label>
        <select
          name="category"
          required
          defaultValue={item?.category ?? ""}
          disabled={pending}
          className={field}
        >
          <option value="" disabled>
            Choose…
          </option>
          {GALLERY_CATEGORIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </div>

      <label className="flex items-center gap-2 text-sm text-ink-700">
        <input
          type="checkbox"
          name="isActive"
          defaultChecked={item?.is_active ?? true}
          disabled={pending}
          className="h-4 w-4 accent-pink-500"
        />
        Show on the public gallery
      </label>

      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-pink-500 px-6 py-2.5 text-sm font-medium text-white hover:bg-pink-600 disabled:opacity-60"
      >
        {pending ? "SAVING…" : "Save Photo"}
      </button>
    </form>
  );
}

export default function GalleryManager({ items }: { items: GalleryItem[] }) {
  const [editing, setEditing] = useState<GalleryItem | null>(null);
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
          <Plus size={16} /> Upload Photo
        </button>
      )}

      {(creating || editing) && (
        <ItemForm
          item={editing}
          onDone={() => {
            setCreating(false);
            setEditing(null);
          }}
        />
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {items.map((item) => (
          <div
            key={item.id}
            className={`card-premium overflow-hidden ${
              item.is_active ? "" : "opacity-50"
            }`}
          >
            <div className="relative aspect-square">
              <Image
                src={item.image}
                alt={item.caption}
                fill
                sizes="(max-width: 640px) 50vw, 25vw"
                className="object-cover"
                unoptimized
              />
            </div>
            <div className="p-3">
              <p className="truncate text-sm font-medium text-ink-900">
                {item.caption}
              </p>
              <p className="mt-0.5 text-[11px] text-ink-500">{item.category}</p>

              <div className="mt-3 flex items-center justify-end gap-3 border-t border-black/[0.06] pt-2.5">
                {confirmId === item.id ? (
                  <span className="flex items-center gap-2 text-xs">
                    <span className="text-ink-500">Delete?</span>
                    <button
                      disabled={pending}
                      onClick={() =>
                        startTransition(async () => {
                          await deleteGalleryItem(item.id);
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
                  <>
                    <button
                      onClick={() => {
                        setCreating(false);
                        setEditing(item);
                      }}
                      className="text-ink-500 hover:text-pink-500"
                      title={`Edit ${item.caption}`}
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      onClick={() => setConfirmId(item.id)}
                      className="text-red-500 hover:text-red-700"
                      title={`Delete ${item.caption}`}
                    >
                      <Trash2 size={15} />
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {items.length === 0 && (
        <p className="card-premium px-6 py-12 text-center text-sm text-ink-500">
          No photos yet.
        </p>
      )}
    </div>
  );
}
