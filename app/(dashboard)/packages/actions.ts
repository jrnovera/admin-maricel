"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidateSitePath } from "@/lib/revalidateSite";

export async function savePackage(formData: FormData) {
  await requireAdmin();
  const supabase = createAdminClient();

  const get = (k: string) => String(formData.get(k) ?? "").trim();

  const id = get("id");
  const name = get("name");
  const icon = get("icon") || "sparkle";
  const duration = get("duration");
  const price = parseFloat(get("price"));
  const includes = get("includes")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (!name || !duration || Number.isNaN(price)) {
    throw new Error("Name, duration and price are required");
  }
  if (includes.length === 0) {
    throw new Error("List at least one included treatment");
  }

  const row = {
    name,
    icon,
    includes,
    duration,
    price,
    // Only set when the price is a floor ("From AED 299"), otherwise the
    // formatted price is derived from `price` at render time.
    price_label: get("priceLabel") || null,
    sort_order: parseInt(get("sortOrder") || "0", 10),
    is_active: formData.get("isActive") === "on",
  };

  const { error } = id
    ? await supabase.from("mbc_packages").update(row).eq("id", id)
    : await supabase.from("mbc_packages").insert(row);

  if (error) throw new Error(error.message);
  revalidatePath("/packages");
  revalidateSitePath("/packages");
}

export async function deletePackage(id: string) {
  await requireAdmin();
  const supabase = createAdminClient();

  const { error } = await supabase.from("mbc_packages").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/packages");
  revalidateSitePath("/packages");
}
