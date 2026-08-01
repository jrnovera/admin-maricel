"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { uploadImage } from "@/lib/upload";
import { revalidateSitePath } from "@/lib/revalidateSite";

export async function saveGalleryItem(formData: FormData) {
  await requireAdmin();

  const get = (k: string) => String(formData.get(k) ?? "").trim();
  const id = get("id");
  const caption = get("caption");
  const category = get("category");

  if (!caption || !category) throw new Error("Caption and category are required");

  const file = formData.get("file");
  let image = get("image");

  if (file instanceof File && file.size > 0) {
    image = await uploadImage(file, "gallery");
  }

  if (!image) throw new Error("Choose an image to upload");

  const row = {
    image,
    caption,
    category,
    sort_order: Number(get("sortOrder")) || 0,
    is_active: formData.get("isActive") === "on",
  };

  const supabase = createAdminClient();
  const { error } = id
    ? await supabase.from("mbc_gallery").update(row).eq("id", id)
    : await supabase.from("mbc_gallery").insert(row);

  if (error) throw new Error(error.message);
  revalidatePath("/gallery");
  revalidateSitePath("/gallery");
}

export async function deleteGalleryItem(id: string) {
  await requireAdmin();

  const { error } = await createAdminClient()
    .from("mbc_gallery")
    .delete()
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/gallery");
  revalidateSitePath("/gallery");
}
