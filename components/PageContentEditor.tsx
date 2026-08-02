"use client";

import { useState, useTransition } from "react";
import { RotateCcw, Check, ChevronDown, Upload } from "lucide-react";
import { savePageContent } from "@/app/(dashboard)/hero-images/actions";
import { uploadImage } from "@/lib/upload";
import type { ContentField, ContentSection } from "@/lib/content-schema";

const field =
  "w-full rounded-lg border border-black/10 bg-white px-3 py-2.5 text-sm outline-none transition-colors focus:border-pink-400 disabled:bg-pink-50/50";
const label = "mb-1.5 block text-xs font-semibold tracking-[0.1em] text-ink-900";

/** A `prefix.itemN.title` / `prefix.itemN.desc` pair — the repeated icon
 *  cards several sections render (Our Values, Why Choose Us, ...). Grouping
 *  them lets the editor show "Card 2" as one box instead of two loose,
 *  identically-styled inputs the staff has to match up by reading the label. */
type CardGroup = { index: number; title: ContentField; desc: ContentField };

function groupFields(fields: ContentField[]): {
  images: ContentField[];
  standalone: ContentField[];
  cards: CardGroup[];
} {
  const cardMap = new Map<number, Partial<CardGroup>>();
  const images: ContentField[] = [];
  const standalone: ContentField[] = [];

  for (const f of fields) {
    if (f.type === "image") {
      images.push(f);
      continue;
    }
    const m = f.key.match(/\.item(\d+)\.(title|desc)$/);
    if (!m) {
      standalone.push(f);
      continue;
    }
    const index = Number(m[1]);
    const entry = cardMap.get(index) ?? { index };
    if (m[2] === "title") entry.title = f;
    else entry.desc = f;
    cardMap.set(index, entry);
  }

  const cards = [...cardMap.values()]
    .filter((g): g is CardGroup => !!g.title && !!g.desc)
    .sort((a, b) => a.index - b.index);

  return { images, standalone, cards };
}

function Field({
  f,
  value,
  onChange,
  pending,
}: {
  f: ContentField;
  value: string;
  onChange: (v: string) => void;
  pending: boolean;
}) {
  const overridden = value.trim().length > 0;

  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <label className={label} htmlFor={f.key}>
          {f.label.toUpperCase()}
        </label>
        {overridden && (
          <button
            type="button"
            onClick={() => onChange("")}
            disabled={pending}
            title="Reset to the original wording"
            className="mb-1.5 flex items-center gap-1 text-[11px] text-ink-500 hover:text-pink-500"
          >
            <RotateCcw size={11} /> Reset
          </button>
        )}
      </div>

      {f.multiline ? (
        <textarea
          id={f.key}
          rows={3}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={pending}
          placeholder={f.placeholder}
          className={field}
        />
      ) : (
        <input
          id={f.key}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={pending}
          placeholder={f.placeholder}
          className={field}
        />
      )}
    </div>
  );
}

/** A photo picker: shows the live photo (or the uploaded replacement),
 *  uploads straight to storage on selection, and stores the resulting URL in
 *  the same draft/form-field flow as every text field — "Save Content" still
 *  submits it as one plain string, same as the rest of the page. */
function ImageField({
  f,
  value,
  onChange,
  pending,
}: {
  f: ContentField;
  value: string;
  onChange: (v: string) => void;
  pending: boolean;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [showUrlBox, setShowUrlBox] = useState(false);
  const [urlDraft, setUrlDraft] = useState("");
  const overridden = value.trim().length > 0;
  const preview = value || f.placeholder;

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setError("");
    setUploading(true);
    try {
      const url = await uploadImage(file, "content");
      onChange(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not upload photo");
    } finally {
      setUploading(false);
    }
  }

  function applyUrl() {
    const url = urlDraft.trim();
    if (!url) return;
    setError("");
    onChange(url);
    setUrlDraft("");
    setShowUrlBox(false);
  }

  const busy = pending || uploading;

  return (
    <div className="flex items-start gap-3 rounded-lg border border-black/10 bg-blush-50/40 p-3">
      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md border border-black/10 bg-black/[0.02]">
        {preview ? (
          // Arbitrary storage hosts bypass next/image config here.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="flex h-full items-center justify-center text-[10px] text-ink-500">
            No photo
          </span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold tracking-[0.1em] text-ink-900">
            {f.label.toUpperCase()}
          </span>
          {overridden && (
            <button
              type="button"
              onClick={() => onChange("")}
              disabled={busy}
              title="Use the original photo"
              className="flex items-center gap-1 text-[11px] text-ink-500 hover:text-pink-500"
            >
              <RotateCcw size={11} /> Reset
            </button>
          )}
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-2">
          <label
            className={`flex items-center gap-1.5 rounded-lg border border-dashed border-pink-300 px-3 py-2 text-xs text-pink-500 hover:bg-pink-50 ${
              busy ? "cursor-wait opacity-60" : "cursor-pointer"
            }`}
          >
            <Upload size={13} />
            {uploading ? "Uploading…" : overridden ? "Replace photo" : "Upload photo"}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif"
              onChange={handleFile}
              disabled={busy}
              className="hidden"
            />
          </label>

          <button
            type="button"
            onClick={() => setShowUrlBox((v) => !v)}
            disabled={busy}
            className="text-[11px] text-ink-500 underline decoration-dotted hover:text-pink-500"
          >
            or paste an image link
          </button>
        </div>

        {showUrlBox && (
          <div className="mt-2 flex flex-wrap gap-2">
            <input
              type="url"
              value={urlDraft}
              onChange={(e) => setUrlDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  applyUrl();
                }
              }}
              disabled={busy}
              placeholder="https://example.com/photo.jpg"
              className="min-w-[14rem] flex-1 rounded-lg border border-black/10 bg-white px-3 py-2 text-xs outline-none focus:border-pink-400"
            />
            <button
              type="button"
              onClick={applyUrl}
              disabled={busy || !urlDraft.trim()}
              className="rounded-lg bg-pink-500 px-3 py-2 text-xs font-medium text-white hover:bg-pink-600 disabled:opacity-40"
            >
              Use Link
            </button>
          </div>
        )}

        {error && <p className="mt-1.5 text-[11px] text-red-600">{error}</p>}
      </div>
    </div>
  );
}

/** One numbered icon-card's Title + Description, boxed together so it reads
 *  as a single unit instead of two fields the staff has to line up by label. */
function CardGroupBox({
  group,
  draft,
  set,
  pending,
}: {
  group: CardGroup;
  draft: Record<string, string>;
  set: (key: string, value: string) => void;
  pending: boolean;
}) {
  const titleValue = draft[group.title.key] ?? "";
  const descValue = draft[group.desc.key] ?? "";
  const overridden = titleValue.trim().length > 0 || descValue.trim().length > 0;

  return (
    <div className="rounded-lg border border-black/10 bg-blush-50/40 p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-pink-500 text-[11px] font-semibold text-white">
            {group.index}
          </span>
          <span className="text-xs font-semibold tracking-[0.1em] text-ink-900">
            CARD {group.index}
          </span>
        </div>
        {overridden && (
          <button
            type="button"
            onClick={() => {
              set(group.title.key, "");
              set(group.desc.key, "");
            }}
            disabled={pending}
            title="Reset to the original wording"
            className="flex items-center gap-1 text-[11px] text-ink-500 hover:text-pink-500"
          >
            <RotateCcw size={11} /> Reset
          </button>
        )}
      </div>

      <div className="space-y-3">
        <div>
          <label className="mb-1 block text-[11px] font-medium text-ink-500">
            Title
          </label>
          <input
            id={group.title.key}
            value={titleValue}
            onChange={(e) => set(group.title.key, e.target.value)}
            disabled={pending}
            placeholder={group.title.placeholder}
            className={field}
          />
        </div>
        <div>
          <label className="mb-1 block text-[11px] font-medium text-ink-500">
            Description
          </label>
          <textarea
            id={group.desc.key}
            rows={2}
            value={descValue}
            onChange={(e) => set(group.desc.key, e.target.value)}
            disabled={pending}
            placeholder={group.desc.placeholder}
            className={field}
          />
        </div>
      </div>
    </div>
  );
}

function Section({
  section,
  open,
  onToggle,
  draft,
  set,
  pending,
}: {
  section: ContentSection;
  open: boolean;
  onToggle: () => void;
  draft: Record<string, string>;
  set: (key: string, value: string) => void;
  pending: boolean;
}) {
  const { images, standalone, cards } = groupFields(section.fields);
  const customizedCount = section.fields.filter(
    (f) => (draft[f.key] ?? "").trim().length > 0
  ).length;

  return (
    <section className="overflow-hidden rounded-xl border border-black/10 bg-white">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
      >
        <div>
          <h3 className="text-sm font-semibold text-ink-900">
            {section.label}
          </h3>
          {section.hint && (
            <p className="mt-0.5 text-xs text-ink-500">{section.hint}</p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-3">
          {customizedCount > 0 && (
            <span className="rounded-full bg-pink-50 px-2.5 py-1 text-[11px] font-medium text-pink-600">
              {customizedCount} customized
            </span>
          )}
          <ChevronDown
            size={18}
            className={`text-ink-500 transition-transform ${
              open ? "rotate-180" : ""
            }`}
          />
        </div>
      </button>

      {open && (
        <div className="border-t border-black/5 p-5">
          {images.length > 0 && (
            <div
              className={`grid gap-3 sm:grid-cols-2 ${
                standalone.length > 0 || cards.length > 0 ? "mb-5" : ""
              }`}
            >
              {images.map((f) => (
                <ImageField
                  key={f.key}
                  f={f}
                  value={draft[f.key] ?? ""}
                  onChange={(v) => set(f.key, v)}
                  pending={pending}
                />
              ))}
            </div>
          )}

          {standalone.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2">
              {standalone.map((f) => (
                <div
                  key={f.key}
                  className={f.multiline ? "sm:col-span-2" : undefined}
                >
                  <Field
                    f={f}
                    value={draft[f.key] ?? ""}
                    onChange={(v) => set(f.key, v)}
                    pending={pending}
                  />
                </div>
              ))}
            </div>
          )}

          {cards.length > 0 && (
            <div
              className={`grid gap-3 sm:grid-cols-2 ${
                standalone.length > 0 ? "mt-5" : ""
              }`}
            >
              {cards.map((g) => (
                <CardGroupBox
                  key={g.index}
                  group={g}
                  draft={draft}
                  set={set}
                  pending={pending}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

export default function PageContentEditor({
  pageKey,
  sections,
  values,
}: {
  pageKey: string;
  sections: ContentSection[];
  values: Record<string, string>;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  // Controlled so "Reset to default" can clear a box without a form remount.
  const [draft, setDraft] = useState<Record<string, string>>(values);
  // Only the first section opens by default — a page's full field list is
  // long, and an all-expanded form reads as a wall of boxes to scroll past.
  const [openKeys, setOpenKeys] = useState<Set<string>>(
    () => new Set(sections.slice(0, 1).map((s) => s.key))
  );

  if (sections.length === 0) return null;

  const dirty = sections
    .flatMap((s) => s.fields)
    .some((f) => (draft[f.key] ?? "") !== (values[f.key] ?? ""));

  function set(key: string, value: string) {
    setSaved(false);
    setDraft((d) => ({ ...d, [key]: value }));
  }

  function toggle(key: string) {
    setOpenKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    // Built from `draft`, never from the form's DOM: collapsed sections are
    // unmounted, so `new FormData(form)` would omit their inputs and the save
    // would blank every field the editor happens not to be showing.
    const formData = new FormData();
    formData.set("pageKey", pageKey);
    for (const f of sections.flatMap((s) => s.fields)) {
      formData.set(`f:${f.key}`, draft[f.key] ?? "");
    }

    startTransition(async () => {
      try {
        await savePageContent(formData);
        setSaved(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not save content");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="mb-10">
      <div className="sticky top-0 z-10 mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-black/5 bg-white/90 py-3 backdrop-blur">
        <div>
          <h2 className="font-display text-lg text-ink-900">Page Content</h2>
          <p className="mt-0.5 text-sm text-ink-500">
            Every headline and paragraph on this page. Leave a box empty to keep
            the original wording.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {saved && !dirty && (
            <span className="flex items-center gap-1.5 text-sm text-green-700">
              <Check size={15} /> Saved
            </span>
          )}
          <button
            type="submit"
            disabled={pending || !dirty}
            className="rounded-full bg-pink-500 px-6 py-2.5 text-sm font-medium text-white hover:bg-pink-600 disabled:opacity-40"
          >
            {pending ? "SAVING…" : "Save Content"}
          </button>
        </div>
      </div>

      {error && (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="flex flex-col gap-3">
        {sections.map((section) => (
          <Section
            key={section.key}
            section={section}
            open={openKeys.has(section.key)}
            onToggle={() => toggle(section.key)}
            draft={draft}
            set={set}
            pending={pending}
          />
        ))}
      </div>
    </form>
  );
}
