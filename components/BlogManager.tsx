"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { format } from "date-fns";
import { Plus, Pencil, Trash2, X, Upload } from "lucide-react";
import { saveBlogPost, deleteBlogPost } from "@/app/(dashboard)/blog/actions";
import { BLOG_CATEGORIES, type BlogPost } from "@/lib/types";
import Modal from "@/components/Modal";

const field =
  "w-full rounded-lg border border-black/10 bg-white px-3 py-2.5 text-sm outline-none transition-colors focus:border-pink-400 disabled:bg-pink-50/50";
const label = "mb-1.5 block text-xs font-semibold tracking-[0.1em] text-ink-900";

const META_TITLE_MAX = 60;
const META_DESC_MAX = 160;

function PostForm({
  post,
  onDone,
}: {
  post: BlogPost | null;
  onDone: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [preview, setPreview] = useState(post?.image ?? "");
  const [metaTitle, setMetaTitle] = useState(post?.meta_title ?? "");
  const [metaDesc, setMetaDesc] = useState(post?.meta_description ?? "");

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    setPreview(file ? URL.createObjectURL(file) : post?.image ?? "");
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      try {
        await saveBlogPost(formData);
        onDone();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not save post");
      }
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5 rounded-xl bg-white p-5"
    >
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg text-ink-900">
          {post ? "Edit Post" : "New Post"}
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

      {post && <input type="hidden" name="id" value={post.id} />}
      <input type="hidden" name="image" value={post?.image ?? ""} />

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="sm:col-span-2">
          <label className={label}>TITLE</label>
          <input
            name="title"
            required
            defaultValue={post?.title ?? ""}
            disabled={pending}
            className={field}
          />
        </div>
        <div>
          <label className={label}>CATEGORY</label>
          <select
            name="category"
            required
            defaultValue={post?.category ?? ""}
            disabled={pending}
            className={field}
          >
            <option value="" disabled>
              Choose…
            </option>
            {BLOG_CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className={label}>URL SLUG</label>
        <input
          name="slug"
          defaultValue={post?.slug ?? ""}
          placeholder="Leave blank to generate from the title"
          disabled={pending}
          className={field}
        />
        <p className="mt-1 text-[11px] text-ink-500">
          Changing this on a published post breaks its existing links.
        </p>
      </div>

      <div>
        <label className={label}>EXCERPT</label>
        <textarea
          name="excerpt"
          rows={2}
          required
          defaultValue={post?.excerpt ?? ""}
          placeholder="One or two sentences shown on the blog listing."
          disabled={pending}
          className={field}
        />
      </div>

      <div>
        <label className={label}>CONTENT</label>
        <textarea
          name="content"
          rows={12}
          required
          defaultValue={post?.content ?? ""}
          placeholder="Write the article. Leave a blank line between paragraphs."
          disabled={pending}
          className={`${field} font-mono text-[13px] leading-relaxed`}
        />
      </div>

      <div className="flex flex-wrap items-start gap-5">
        <div className="relative h-28 w-40 shrink-0 overflow-hidden rounded-lg border border-black/10 bg-black/[0.02]">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={preview}
              alt="Cover preview"
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="flex h-full items-center justify-center text-xs text-ink-500">
              No cover
            </span>
          )}
        </div>

        <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-pink-300 px-4 py-3 text-sm text-pink-500 hover:bg-pink-50">
          <Upload size={16} />
          {post ? "Replace cover" : "Choose cover"}
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

      <div className="rounded-lg border border-black/10 bg-black/[0.015] p-4">
        <p className="mb-3 text-xs font-semibold tracking-[0.1em] text-pink-500">
          SEO
        </p>

        <div className="space-y-4">
          <div>
            <label className={label}>
              META TITLE{" "}
              <span
                className={
                  metaTitle.length > META_TITLE_MAX
                    ? "text-red-600"
                    : "text-ink-500"
                }
              >
                ({metaTitle.length}/{META_TITLE_MAX})
              </span>
            </label>
            <input
              name="metaTitle"
              value={metaTitle}
              onChange={(e) => setMetaTitle(e.target.value)}
              placeholder="Falls back to the post title"
              disabled={pending}
              className={field}
            />
          </div>

          <div>
            <label className={label}>
              META DESCRIPTION{" "}
              <span
                className={
                  metaDesc.length > META_DESC_MAX
                    ? "text-red-600"
                    : "text-ink-500"
                }
              >
                ({metaDesc.length}/{META_DESC_MAX})
              </span>
            </label>
            <textarea
              name="metaDescription"
              rows={2}
              value={metaDesc}
              onChange={(e) => setMetaDesc(e.target.value)}
              placeholder="Falls back to the excerpt"
              disabled={pending}
              className={field}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={label}>AUTHOR</label>
              <input
                name="author"
                defaultValue={post?.author ?? ""}
                placeholder="Maricel Beauty Center"
                disabled={pending}
                className={field}
              />
            </div>
            <div>
              <label className={label}>TAGS (COMMA SEPARATED)</label>
              <input
                name="tags"
                defaultValue={post?.tags?.join(", ") ?? ""}
                placeholder="facial, skincare, dubai"
                disabled={pending}
                className={field}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={label}>PUBLISH DATE</label>
          <input
            name="publishedAt"
            type="date"
            defaultValue={
              post?.published_at ?? new Date().toISOString().slice(0, 10)
            }
            disabled={pending}
            className={field}
          />
        </div>
        <div>
          <label className={label}>SORT ORDER</label>
          <input
            name="sortOrder"
            type="number"
            defaultValue={post?.sort_order ?? 0}
            disabled={pending}
            className={field}
          />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm text-ink-700">
        <input
          type="checkbox"
          name="isActive"
          defaultChecked={post?.is_active ?? true}
          disabled={pending}
          className="h-4 w-4 accent-pink-500"
        />
        Publish on the website
      </label>

      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-pink-500 px-6 py-2.5 text-sm font-medium text-white hover:bg-pink-600 disabled:opacity-60"
      >
        {pending ? "SAVING…" : "Save Post"}
      </button>
    </form>
  );
}

export default function BlogManager({ posts }: { posts: BlogPost[] }) {
  const [editing, setEditing] = useState<BlogPost | null>(null);
  const [creating, setCreating] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const closeForm = () => {
    setCreating(false);
    setEditing(null);
  };

  return (
    <div>
      <button
        onClick={() => setCreating(true)}
        className="mb-6 flex items-center gap-2 rounded-full bg-pink-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-pink-600"
      >
        <Plus size={16} /> New Post
      </button>

      {(creating || editing) && (
        <Modal onClose={closeForm} maxWidth="max-w-2xl">
          <PostForm post={editing} onDone={closeForm} />
        </Modal>
      )}

      <div className="space-y-3">
        {posts.map((p) => (
          <div
            key={p.id}
            className={`card-premium flex gap-4 p-4 ${
              p.is_active ? "" : "opacity-50"
            }`}
          >
            <div className="relative h-20 w-28 shrink-0 overflow-hidden rounded-lg">
              <Image
                src={p.image}
                alt={p.title}
                fill
                sizes="112px"
                className="object-cover"
                unoptimized
              />
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold tracking-[0.1em] text-pink-500">
                {p.category.toUpperCase()}
              </p>
              <p className="mt-0.5 truncate text-sm font-medium text-ink-900">
                {p.title}
                {!p.is_active && (
                  <span className="ml-2 rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-600">
                    Draft
                  </span>
                )}
              </p>
              <p className="mt-1 line-clamp-1 text-xs text-ink-500">
                {p.excerpt}
              </p>
              <p className="mt-1.5 text-[11px] text-ink-500">
                /blog/{p.slug} ·{" "}
                {format(new Date(`${p.published_at}T00:00:00`), "d MMM yyyy")}
              </p>
            </div>

            <div className="flex shrink-0 items-start gap-3">
              {confirmId === p.id ? (
                <span className="flex items-center gap-2 text-xs">
                  <span className="text-ink-500">Delete?</span>
                  <button
                    disabled={pending}
                    onClick={() =>
                      startTransition(async () => {
                        await deleteBlogPost(p.id);
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
                      setEditing(p);
                    }}
                    className="text-ink-500 hover:text-pink-500"
                    title={`Edit ${p.title}`}
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    onClick={() => setConfirmId(p.id)}
                    className="text-red-500 hover:text-red-700"
                    title={`Delete ${p.title}`}
                  >
                    <Trash2 size={15} />
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {posts.length === 0 && (
        <p className="card-premium px-6 py-12 text-center text-sm text-ink-500">
          No posts yet.
        </p>
      )}
    </div>
  );
}
