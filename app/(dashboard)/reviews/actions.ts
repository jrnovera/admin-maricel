"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { uploadImage } from "@/lib/upload";
import { revalidateSitePath } from "@/lib/revalidateSite";

export async function saveReview(formData: FormData) {
  await requireAdmin();

  const get = (k: string) => String(formData.get(k) ?? "").trim();

  const id = get("id");
  const name = get("name");
  const role = get("role") || null;
  const quote = get("quote");
  const rating = parseInt(get("rating") || "5", 10);
  const sortOrder = parseInt(get("sortOrder") || "0", 10);
  const isActive = formData.get("isActive") === "on";

  if (!name) throw new Error("Name is required");
  if (!quote) throw new Error("Review text is required");
  if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
    throw new Error("Rating must be between 1 and 5");
  }

  const file = formData.get("file");
  let image = get("image") || null;

  if (file instanceof File && file.size > 0) {
    image = await uploadImage(file, "reviews");
  }

  const row = {
    name,
    role,
    quote,
    rating,
    image,
    sort_order: sortOrder,
    is_active: isActive,
  };

  const supabase = createAdminClient();
  const { error } = id
    ? await supabase.from("mbc_reviews").update(row).eq("id", id)
    : await supabase.from("mbc_reviews").insert(row);

  if (error) throw new Error(error.message);

  revalidatePath("/reviews");
  revalidateSitePath("/reviews");
}

export async function deleteReview(id: string) {
  await requireAdmin();

  const { error } = await createAdminClient()
    .from("mbc_reviews")
    .delete()
    .eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath("/reviews");
  revalidateSitePath("/reviews");
}
