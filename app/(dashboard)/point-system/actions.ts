"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidateSitePath } from "@/lib/revalidateSite";

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function touchSite() {
  revalidatePath("/point-system");
  revalidateSitePath("/services/point-system");
}

export async function saveGroupMeta(formData: FormData) {
  await requireAdmin();
  const supabase = createAdminClient();

  const get = (k: string) => String(formData.get(k) ?? "").trim();

  const id = get("id");
  const title = get("title");
  const slug = slugify(get("slug") || title);
  const icon = get("icon") || "sparkle";
  const note = get("note") || null;
  const sortOrder = parseInt(get("sortOrder") || "0", 10);
  const isActive = formData.get("isActive") === "on";

  if (!title) throw new Error("Title is required");
  if (!slug) throw new Error("Could not build a URL slug from that title");

  const row = { slug, title, icon, note, sort_order: sortOrder, is_active: isActive };

  if (id) {
    const { error } = await supabase.from("mbc_point_groups").update(row).eq("id", id);
    if (error) {
      if (error.code === "23505") {
        throw new Error(`The slug "${slug}" is already used by another group`);
      }
      throw new Error(error.message);
    }
    touchSite();
    return id;
  }

  const { data, error } = await supabase
    .from("mbc_point_groups")
    .insert(row)
    .select("id")
    .single();
  if (error) {
    if (error.code === "23505") {
      throw new Error(`The slug "${slug}" is already used by another group`);
    }
    throw new Error(error.message);
  }

  touchSite();
  return data.id as string;
}

export async function deletePointGroup(id: string) {
  await requireAdmin();
  const supabase = createAdminClient();

  const { error } = await supabase.from("mbc_point_groups").delete().eq("id", id);
  if (error) throw new Error(error.message);

  touchSite();
}

export async function addPointItem(groupId: string, name: string, points: number) {
  await requireAdmin();
  const supabase = createAdminClient();

  const trimmedName = name.trim();
  if (!trimmedName) throw new Error("Item name is required");
  if (!Number.isFinite(points)) throw new Error("Points must be a number");

  const { data: last, error: lastError } = await supabase
    .from("mbc_point_items")
    .select("sort_order")
    .eq("group_id", groupId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (lastError) throw new Error(lastError.message);

  const { error } = await supabase.from("mbc_point_items").insert({
    group_id: groupId,
    name: trimmedName,
    points,
    sort_order: (last?.sort_order ?? 0) + 1,
  });
  if (error) throw new Error(error.message);

  touchSite();
}

export async function updatePointItem(id: string, name: string, points: number) {
  await requireAdmin();
  const supabase = createAdminClient();

  const trimmedName = name.trim();
  if (!trimmedName) throw new Error("Item name is required");
  if (!Number.isFinite(points)) throw new Error("Points must be a number");

  const { error } = await supabase
    .from("mbc_point_items")
    .update({ name: trimmedName, points })
    .eq("id", id);
  if (error) throw new Error(error.message);

  touchSite();
}

export async function deletePointItem(id: string) {
  await requireAdmin();
  const supabase = createAdminClient();

  const { error } = await supabase.from("mbc_point_items").delete().eq("id", id);
  if (error) throw new Error(error.message);

  touchSite();
}

/** Swaps sort_order with the adjacent item in the same group. No-op at the edge of the list. */
export async function reorderPointItem(id: string, direction: "up" | "down") {
  await requireAdmin();
  const supabase = createAdminClient();

  const { data: item, error: itemError } = await supabase
    .from("mbc_point_items")
    .select("id, group_id, sort_order")
    .eq("id", id)
    .single();
  if (itemError) throw new Error(itemError.message);

  const neighborQuery = supabase
    .from("mbc_point_items")
    .select("id, sort_order")
    .eq("group_id", item.group_id);

  const { data: neighbor, error: neighborError } =
    direction === "up"
      ? await neighborQuery
          .lt("sort_order", item.sort_order)
          .order("sort_order", { ascending: false })
          .limit(1)
          .maybeSingle()
      : await neighborQuery
          .gt("sort_order", item.sort_order)
          .order("sort_order", { ascending: true })
          .limit(1)
          .maybeSingle();
  if (neighborError) throw new Error(neighborError.message);
  if (!neighbor) return;

  const { error: e1 } = await supabase
    .from("mbc_point_items")
    .update({ sort_order: neighbor.sort_order })
    .eq("id", item.id);
  if (e1) throw new Error(e1.message);

  const { error: e2 } = await supabase
    .from("mbc_point_items")
    .update({ sort_order: item.sort_order })
    .eq("id", neighbor.id);
  if (e2) throw new Error(e2.message);

  touchSite();
}

export async function saveRedemptionTier(formData: FormData) {
  await requireAdmin();
  const supabase = createAdminClient();

  const get = (k: string) => String(formData.get(k) ?? "").trim();

  const id = get("id");
  const price = get("price");
  const points = parseFloat(get("points"));
  const sortOrder = parseInt(get("sortOrder") || "0", 10);

  if (!price) throw new Error("Price label is required");
  if (Number.isNaN(points)) throw new Error("Points must be a number");

  const row = { price, points, sort_order: sortOrder };

  const { error } = id
    ? await supabase.from("mbc_redemption_tiers").update(row).eq("id", id)
    : await supabase.from("mbc_redemption_tiers").insert(row);

  if (error) throw new Error(error.message);
  touchSite();
}

export async function deleteRedemptionTier(id: string) {
  await requireAdmin();
  const supabase = createAdminClient();

  const { error } = await supabase.from("mbc_redemption_tiers").delete().eq("id", id);
  if (error) throw new Error(error.message);

  touchSite();
}
