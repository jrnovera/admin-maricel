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

/**
 * Each line is "Service name | price" — the last "|" splits name from price.
 * A bare number ("250") is a fixed price the site renders as "AED 250";
 * anything else ("From AED 25") is kept verbatim as the price label, with the
 * first number in it stored as the sortable numeric price.
 */
function parseItems(text: string) {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, i) => {
      const idx = line.lastIndexOf("|");
      if (idx === -1) {
        throw new Error(`Line "${line}" is missing a "|" before the price`);
      }
      const name = line.slice(0, idx).trim();
      const raw = line.slice(idx + 1).trim();
      if (!name) throw new Error(`Line "${line}" is missing a service name`);

      const isPlainNumber = /^[\d.]+$/.test(raw);
      const price = parseFloat(isPlainNumber ? raw : raw.replace(/[^\d.]/g, ""));
      if (Number.isNaN(price)) {
        throw new Error(`Line "${line}" has an invalid price`);
      }

      return {
        name,
        price,
        price_label: isPlainNumber ? null : raw,
        sort_order: i + 1,
        is_active: true,
      };
    });
}

/** Both public surfaces that render the price list. */
function revalidateEverywhere() {
  revalidatePath("/services");
  revalidateSitePath("/services");
  // The home page's service grid renders the first six groups.
  revalidateSitePath("/");
}

export async function saveServiceGroup(formData: FormData) {
  await requireAdmin();
  const supabase = createAdminClient();

  const get = (k: string) => String(formData.get(k) ?? "").trim();

  const id = get("id");
  const title = get("title");
  const slug = slugify(get("slug") || title);
  const icon = get("icon") || "sparkle";
  const blurb = get("blurb") || null;
  const note = get("note") || null;
  const sortOrder = parseInt(get("sortOrder") || "0", 10);
  const isActive = formData.get("isActive") === "on";
  const items = parseItems(get("itemsText"));

  if (!title) throw new Error("Title is required");
  if (!slug) throw new Error("Could not build a URL slug from that title");
  if (items.length === 0) throw new Error("List at least one service");

  const row = {
    slug,
    title,
    icon,
    blurb,
    note,
    sort_order: Number.isNaN(sortOrder) ? 0 : sortOrder,
    is_active: isActive,
  };

  let groupId = id;
  if (id) {
    const { error } = await supabase
      .from("mbc_service_groups")
      .update(row)
      .eq("id", id);
    if (error) {
      if (error.code === "23505") {
        throw new Error(`The slug "${slug}" is already used by another group`);
      }
      throw new Error(error.message);
    }
  } else {
    const { data, error } = await supabase
      .from("mbc_service_groups")
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

  // Same replace-the-whole-list approach as the point system: the textarea is
  // the source of truth, so ordering and removals need no per-row bookkeeping.
  const { error: deleteError } = await supabase
    .from("mbc_services")
    .delete()
    .eq("group_id", groupId);
  if (deleteError) throw new Error(deleteError.message);

  const { error: insertError } = await supabase.from("mbc_services").insert(
    items.map((item) => ({
      ...item,
      group_id: groupId,
      // `category` predates groups and is still NOT NULL — keep it mirroring
      // the group title so the column stays meaningful.
      category: title,
    }))
  );
  if (insertError) throw new Error(insertError.message);

  revalidateEverywhere();
}

export async function deleteServiceGroup(id: string) {
  await requireAdmin();
  const supabase = createAdminClient();

  // mbc_services.group_id is ON DELETE CASCADE, so the lines go with it.
  const { error } = await supabase
    .from("mbc_service_groups")
    .delete()
    .eq("id", id);
  if (error) throw new Error(error.message);

  revalidateEverywhere();
}
