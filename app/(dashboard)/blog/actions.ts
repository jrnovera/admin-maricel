"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { uploadImage } from "@/lib/upload";
import { revalidateSitePath } from "@/lib/revalidateSite";

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export async function saveBlogPost(formData: FormData) {
  await requireAdmin();

  const get = (k: string) => String(formData.get(k) ?? "").trim();
  const id = get("id");
  const title = get("title");
  const category = get("category");
  const excerpt = get("excerpt");
  const content = get("content");

  if (!title || !category || !excerpt || !content) {
    throw new Error("Title, category, excerpt and content are required");
  }

  const file = formData.get("file");
  let image = get("image");
  if (file instanceof File && file.size > 0) {
    image = await uploadImage(file, "blog");
  }
  if (!image) throw new Error("Choose a cover image");

  const slug = slugify(get("slug") || title);
  if (!slug) throw new Error("Could not build a URL slug from that title");

  const tags = get("tags")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  const row = {
    slug,
    title,
    category,
    excerpt,
    content,
    image,
    published_at: get("publishedAt") || new Date().toISOString().slice(0, 10),
    sort_order: Number(get("sortOrder")) || 0,
    is_active: formData.get("isActive") === "on",
    meta_title: get("metaTitle") || null,
    meta_description: get("metaDescription") || null,
    author: get("author") || null,
    tags,
    updated_at: new Date().toISOString(),
  };

  const supabase = createAdminClient();
  const { error } = id
    ? await supabase.from("mbc_blog_posts").update(row).eq("id", id)
    : await supabase.from("mbc_blog_posts").insert(row);

  if (error) {
    // 23505 = unique violation on `slug`.
    if (error.code === "23505") {
      throw new Error(`The URL slug "${slug}" is already used by another post`);
    }
    throw new Error(error.message);
  }

  revalidatePath("/blog");
  revalidatePath(`/blog/${slug}`);
  revalidateSitePath("/blog");
  revalidateSitePath(`/blog/${slug}`);
}

export async function deleteBlogPost(id: string) {
  await requireAdmin();

  const { error } = await createAdminClient()
    .from("mbc_blog_posts")
    .delete()
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/blog");
  revalidateSitePath("/blog");
}
