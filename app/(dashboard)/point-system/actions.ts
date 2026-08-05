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

/** Each line is "Item name | points" — the last "|" splits name from points. */
function parseItems(text: string) {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, i) => {
      const idx = line.lastIndexOf("|");
      if (idx === -1) {
        throw new Error(`Line "${line}" is missing a "|" before the points value`);
      }
      const name = line.slice(0, idx).trim();
      const points = parseFloat(line.slice(idx + 1).trim());
      if (!name) throw new Error(`Line "${line}" is missing an item name`);
      if (Number.isNaN(points)) throw new Error(`Line "${line}" has an invalid points value`);
      return { name, points, sort_order: i + 1 };
    });
}

export async function savePointGroup(formData: FormData) {
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
  const items = parseItems(get("itemsText"));

  if (!title) throw new Error("Title is required");
  if (!slug) throw new Error("Could not build a URL slug from that title");
  if (items.length === 0) throw new Error("List at least one point item");

  const row = { slug, title, icon, note, sort_order: sortOrder, is_active: isActive };

  let groupId = id;
  if (id) {
    const { error } = await supabase.from("mbc_point_groups").update(row).eq("id", id);
    if (error) {
      if (error.code === "23505") {
        throw new Error(`The slug "${slug}" is already used by another group`);
      }
      throw new Error(error.message);
    }
  } else {
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
    groupId = data.id;
  }

  const { error: deleteError } = await supabase
    .from("mbc_point_items")
    .delete()
    .eq("group_id", groupId);
  if (deleteError) throw new Error(deleteError.message);

  const { error: insertError } = await supabase
    .from("mbc_point_items")
    .insert(items.map((item) => ({ ...item, group_id: groupId })));
  if (insertError) throw new Error(insertError.message);

  revalidatePath("/point-system");
  revalidateSitePath("/services/point-system");
}

export async function deletePointGroup(id: string) {
  await requireAdmin();
  const supabase = createAdminClient();

  const { error } = await supabase.from("mbc_point_groups").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/point-system");
  revalidateSitePath("/services/point-system");
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
  revalidatePath("/point-system");
  revalidateSitePath("/services/point-system");
}

export async function deleteRedemptionTier(id: string) {
  await requireAdmin();
  const supabase = createAdminClient();

  const { error } = await supabase.from("mbc_redemption_tiers").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/point-system");
  revalidateSitePath("/services/point-system");
}
