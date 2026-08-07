"use client";

import { useState, useTransition } from "react";
import { Plus, Pencil, Trash2, X, Upload, Star } from "lucide-react";
import { saveReview, deleteReview } from "@/app/(dashboard)/reviews/actions";
import type { MbcReview } from "@/lib/types";

const field =
  "w-full rounded-lg border border-black/10 bg-white px-3 py-2.5 text-sm outline-none transition-colors focus:border-pink-400 disabled:bg-pink-50/50";
const label = "mb-1.5 block text-xs font-semibold tracking-[0.1em] text-ink-900";

function ReviewForm({
  review,
  nextSortOrder,
  onDone,
}: {
  review: MbcReview | null;
  nextSortOrder: number;
  onDone: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [preview, setPreview] = useState(review?.image ?? "");

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    setPreview(file ? URL.createObjectURL(file) : review?.image ?? "");
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      try {
        await saveReview(formData);
        onDone();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not save review");
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
          {review ? "Edit Review" : "New Review"}
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

      {review && <input type="hidden" name="id" value={review.id} />}
      <input type="hidden" name="image" value={review?.image ?? ""} />

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
          {review?.image ? "Replace photo" : "Choose photo (optional)"}
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
          <label className={label}>NAME</label>
          <input name="name" required defaultValue={review?.name ?? ""} disabled={pending} className={field} />
        </div>
        <div>
          <label className={label}>SERVICE / ROLE (OPTIONAL)</label>
          <input
            name="role"
            defaultValue={review?.role ?? ""}
            placeholder="e.g. Hair Color & Spa"
            disabled={pending}
            className={field}
          />
        </div>
      </div>

      <div>
        <label className={label}>REVIEW TEXT</label>
        <textarea
          name="quote"
          required
          rows={4}
          defaultValue={review?.quote ?? ""}
          disabled={pending}
          className={field}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className={label}>RATING</label>
          <select name="rating" required defaultValue={review?.rating ?? 5} disabled={pending} className={field}>
            {[5, 4, 3, 2, 1].map((n) => (
              <option key={n} value={n}>
                {n} star{n === 1 ? "" : "s"}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={label}>SORT ORDER</label>
          <input
            name="sortOrder"
            type="number"
            defaultValue={review?.sort_order ?? nextSortOrder}
            disabled={pending}
            className={field}
          />
        </div>
        <label className="flex items-center gap-2 self-end pb-2.5 text-sm text-ink-700">
          <input
            type="checkbox"
            name="isActive"
            defaultChecked={review?.is_active ?? true}
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
        {pending ? "SAVING…" : "Save Review"}
      </button>
    </form>
  );
}

export default function ReviewsManager({ reviews }: { reviews: MbcReview[] }) {
  const [editing, setEditing] = useState<MbcReview | null>(null);
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
          <Plus size={16} /> New Review
        </button>
      )}

      {(creating || editing) && (
        <ReviewForm
          review={editing}
          nextSortOrder={Math.max(0, ...reviews.map((r) => r.sort_order)) + 1}
          onDone={() => {
            setCreating(false);
            setEditing(null);
          }}
        />
      )}

      <div className="space-y-3">
        {reviews.map((r) => (
          <div key={r.id} className={`card-premium p-4 ${r.is_active ? "" : "opacity-50"}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full bg-pink-50">
                  {r.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={r.image} alt={r.name} className="h-full w-full object-cover" />
                  ) : (
                    <span className="flex h-full items-center justify-center text-sm font-semibold text-pink-500">
                      {r.name.charAt(0)}
                    </span>
                  )}
                </div>
                <div>
                  <p className="font-medium text-ink-900">
                    {r.name}
                    {!r.is_active && (
                      <span className="ml-2 rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-600">
                        Hidden
                      </span>
                    )}
                  </p>
                  {r.role && <p className="text-xs text-ink-500">{r.role}</p>}
                  <div className="mt-1 flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        size={12}
                        className={i < r.rating ? "fill-pink-400 text-pink-400" : "fill-none text-pink-200"}
                      />
                    ))}
                  </div>
                  <p className="mt-1.5 max-w-xl text-xs text-ink-500">&ldquo;{r.quote}&rdquo;</p>
                </div>
              </div>

              {confirmId === r.id ? (
                <span className="flex shrink-0 items-center gap-2 text-xs">
                  <span className="text-ink-500">Delete?</span>
                  <button
                    disabled={pending}
                    onClick={() =>
                      startTransition(async () => {
                        await deleteReview(r.id);
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
                      setEditing(r);
                    }}
                    className="text-ink-500 hover:text-pink-500"
                    title={`Edit ${r.name}`}
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    onClick={() => setConfirmId(r.id)}
                    className="text-red-500 hover:text-red-700"
                    title={`Delete ${r.name}`}
                  >
                    <Trash2 size={15} />
                  </button>
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {reviews.length === 0 && (
        <p className="card-premium px-6 py-12 text-center text-sm text-ink-500">
          No reviews yet — the public site shows a curated sample set until you add some.
        </p>
      )}
    </div>
  );
}
