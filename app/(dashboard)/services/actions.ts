"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidateSitePath } from "@/lib/revalidateSite";

export async function saveService(formData: FormData) {
  await requireAdmin();
  const supabase = createAdminClient();

  const get = (k: string) => String(formData.get(k) ?? "").trim();

  const id = get("id");
  const name = get("name");
  const category = get("category");
  const price = parseFloat(get("price"));
  const duration = parseInt(get("durationMinutes") || "60", 10);

  if (!name || !category || Number.isNaN(price)) {
    throw new Error("Name, category and price are required");
  }

  const row = {
    name,
    category,
    price,
    // Only set when the price is a floor ("From AED 25"), otherwise the
    // formatted price is derived from `price` at render time.
    price_label: get("priceLabel") || null,
    duration_minutes: Number.isNaN(duration) ? 60 : duration,
    sort_order: parseInt(get("sortOrder") || "0", 10),
    is_active: formData.get("isActive") === "on",
  };

  const { error } = id
    ? await supabase.from("mbc_services").update(row).eq("id", id)
    : await supabase.from("mbc_services").insert(row);

  if (error) throw new Error(error.message);
  revalidatePath("/services");
  revalidateSitePath("/services");
}

export async function deleteService(id: string) {
  await requireAdmin();
  const supabase = createAdminClient();

  const { error } = await supabase.from("mbc_services").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/services");
  revalidateSitePath("/services");
}
