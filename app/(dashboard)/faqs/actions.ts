"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidateSitePath } from "@/lib/revalidateSite";

export async function saveFaq(formData: FormData) {
  await requireAdmin();
  const supabase = createAdminClient();

  const get = (k: string) => String(formData.get(k) ?? "").trim();

  const id = get("id");
  const pageKey = get("pageKey") || "vouchers";
  const question = get("question");
  const answer = get("answer");

  if (!question || !answer) {
    throw new Error("Question and answer are required");
  }

  const row = {
    page_key: pageKey,
    question,
    answer,
    sort_order: parseInt(get("sortOrder") || "0", 10),
    is_active: formData.get("isActive") === "on",
  };

  const { error } = id
    ? await supabase.from("mbc_faqs").update(row).eq("id", id)
    : await supabase.from("mbc_faqs").insert(row);

  if (error) throw new Error(error.message);
  revalidatePath("/faqs");
  revalidateSitePath("/services/vouchers");
}

export async function deleteFaq(id: string) {
  await requireAdmin();
  const supabase = createAdminClient();

  const { error } = await supabase.from("mbc_faqs").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/faqs");
  revalidateSitePath("/services/vouchers");
}
