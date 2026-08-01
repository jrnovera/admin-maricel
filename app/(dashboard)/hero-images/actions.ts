"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { uploadImage } from "@/lib/upload";
import { sectionsFor } from "@/lib/content-schema";

function publicPath(pageKey: string) {
  return pageKey === "home" ? "/" : `/${pageKey}`;
}

/** The position a newly created slide should land at — after every existing
 *  one, so new slides don't need a manual position typed in by hand. */
async function nextSortOrder(
  supabase: ReturnType<typeof createAdminClient>,
  pageKey: string
): Promise<number> {
  const { data, error } = await supabase
    .from("mbc_hero_images")
    .select("sort_order")
    .eq("page_key", pageKey)
    .order("sort_order", { ascending: false })
    .limit(1);

  if (error) throw new Error(error.message);
  return (data?.[0]?.sort_order ?? -1) + 1;
}

/** Upserts every editable string on a page in one round trip. Fields are
 *  namespaced in the form so they cannot collide with the hero inputs. */
export async function savePageContent(formData: FormData) {
  await requireAdmin();

  const pageKey = String(formData.get("pageKey") ?? "").trim();
  if (!pageKey) throw new Error("Page is required");

  const fields = sectionsFor(pageKey).flatMap((s) => s.fields);
  if (fields.length === 0) return;

  const rows = fields.map((f) => ({
    page_key: pageKey,
    field_key: f.key,
    value: String(formData.get(`f:${f.key}`) ?? "").trim(),
    updated_at: new Date().toISOString(),
  }));

  const { error } = await createAdminClient()
    .from("mbc_page_content")
    .upsert(rows, { onConflict: "page_key,field_key" });

  if (error) throw new Error(error.message);
  revalidatePath(publicPath(pageKey));
}

export async function saveHeroImage(formData: FormData) {
  await requireAdmin();

  const get = (k: string) => String(formData.get(k) ?? "").trim();
  const id = get("id");
  const pageKey = get("pageKey");
  const titleLead = get("titleLead");

  if (!pageKey || !titleLead) {
    throw new Error("Page and title are required");
  }

  const file = formData.get("file");
  let image = get("image");

  if (file instanceof File && file.size > 0) {
    image = await uploadImage(file, "hero");
  }

  if (!image) throw new Error("Choose an image to upload");

  const supabase = createAdminClient();
  // Editing keeps the slide's existing position (sent back as a hidden
  // field); creating appends it after every other slide on the page.
  const sortOrder = id
    ? Number(get("sortOrder")) || 0
    : await nextSortOrder(supabase, pageKey);

  const row = {
    page_key: pageKey,
    eyebrow: get("eyebrow") || null,
    title_lead: titleLead,
    title_accent: get("titleAccent") || null,
    body: get("body") || null,
    image,
    sort_order: sortOrder,
    is_active: formData.get("isActive") === "on",
  };

  const { error } = id
    ? await supabase.from("mbc_hero_images").update(row).eq("id", id)
    : await supabase.from("mbc_hero_images").insert(row);

  if (error) throw new Error(error.message);
  revalidatePath(publicPath(pageKey));
}

/**
 * Turns several photos picked in one go into that many carousel slides, so
 * staff aren't stuck opening "Add Slide" three separate times for a 3-photo
 * carousel. Each slide lands with a placeholder title — the admin edits the
 * wording afterward, same as any other slide.
 */
export async function addHeroSlidesBulk(formData: FormData) {
  await requireAdmin();

  const pageKey = String(formData.get("pageKey") ?? "").trim();
  if (!pageKey) throw new Error("Page is required");

  const files = formData
    .getAll("files")
    .filter((f): f is File => f instanceof File && f.size > 0);

  if (files.length === 0) throw new Error("Choose at least one image");

  const supabase = createAdminClient();
  let nextOrder = await nextSortOrder(supabase, pageKey);

  const rows = [];
  for (const file of files) {
    const image = await uploadImage(file, "hero");
    rows.push({
      page_key: pageKey,
      title_lead: "New Slide",
      image,
      sort_order: nextOrder++,
      is_active: true,
    });
  }

  const { error } = await supabase.from("mbc_hero_images").insert(rows);
  if (error) throw new Error(error.message);
  revalidatePath(publicPath(pageKey));
}

export async function deleteHeroImage(id: string, pageKey: string) {
  await requireAdmin();

  const { error } = await createAdminClient()
    .from("mbc_hero_images")
    .delete()
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath(publicPath(pageKey));
}

export async function reorderHeroImages(
  pageKey: string,
  updates: { id: string; sort_order: number }[]
) {
  await requireAdmin();

  const supabase = createAdminClient();
  for (const u of updates) {
    const { error } = await supabase
      .from("mbc_hero_images")
      .update({ sort_order: u.sort_order })
      .eq("id", u.id);
    if (error) throw new Error(error.message);
  }

  revalidatePath(publicPath(pageKey));
}
