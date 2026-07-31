"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { uploadImage } from "@/lib/upload";

function publicPath(pageKey: string) {
  return pageKey === "home" ? "/" : `/${pageKey}`;
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

  const row = {
    page_key: pageKey,
    eyebrow: get("eyebrow") || null,
    title_lead: titleLead,
    title_accent: get("titleAccent") || null,
    body: get("body") || null,
    image,
    sort_order: Number(get("sortOrder")) || 0,
    is_active: formData.get("isActive") === "on",
  };

  const supabase = createAdminClient();
  const { error } = id
    ? await supabase.from("mbc_hero_images").update(row).eq("id", id)
    : await supabase.from("mbc_hero_images").insert(row);

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
