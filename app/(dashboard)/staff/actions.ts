"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { uploadImage } from "@/lib/upload";

export async function setStaffRole(
  userId: string,
  role: "admin" | "therapist" | null
) {
  const { user } = await requireAdmin();

  // Guard against an admin locking themselves out of the portal.
  if (userId === user.id && role !== "admin") {
    throw new Error("You can't remove your own admin access.");
  }

  const supabase = createAdminClient();

  if (role === null) {
    const { error } = await supabase.from("profiles").delete().eq("id", userId);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase
      .from("profiles")
      .update({ role })
      .eq("id", userId);
    if (error) throw new Error(error.message);
  }

  revalidatePath("/staff");
  revalidatePath("/");
}

/**
 * Adds an existing auth user as MBC staff by email. Deliberately does not
 * create accounts — the person signs up themselves, then an admin grants
 * access, so no password is ever handled here.
 */
export async function addStaffByEmail(formData: FormData) {
  await requireAdmin();
  const supabase = createAdminClient();

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const fullName = String(formData.get("fullName") ?? "").trim();
  const role = String(formData.get("role") ?? "therapist");
  const displayRole = String(formData.get("displayRole") ?? "").trim();
  const bio = String(formData.get("bio") ?? "").trim();
  const showOnSite = formData.get("showOnSite") === "on";
  const sortOrder = Number(formData.get("sortOrder") ?? 0);
  const teamCategories = formData.getAll("teamCategories").map(String);
  const file = formData.get("file");

  if (!email) throw new Error("Email is required");
  if (role !== "admin" && role !== "therapist") throw new Error("Invalid role");

  const { data: list, error: listError } = await supabase.auth.admin.listUsers({
    perPage: 1000,
  });
  if (listError) throw new Error(listError.message);

  const match = list.users.find((u) => u.email?.toLowerCase() === email);
  if (!match) {
    throw new Error(
      "No account with that email. Ask them to sign up on the website first, then add them here."
    );
  }

  let photoUrl: string | null = null;
  if (file instanceof File && file.size > 0) {
    photoUrl = await uploadImage(file, "staff");
  }

  const { error } = await supabase.from("profiles").upsert(
    {
      id: match.id,
      full_name: fullName || (match.user_metadata?.full_name as string) || null,
      role,
      display_role: displayRole || null,
      bio: bio || null,
      show_on_site: showOnSite,
      sort_order: Number.isFinite(sortOrder) ? sortOrder : 0,
      team_categories: teamCategories,
      ...(photoUrl ? { photo_url: photoUrl } : {}),
    },
    { onConflict: "id" }
  );

  if (error) throw new Error(error.message);
  revalidatePath("/staff");
  revalidatePath("/");
}

/** Edits the public-facing profile (photo, title, bio, visibility) for an existing staff member. */
export async function updateStaffProfile(formData: FormData) {
  await requireAdmin();
  const supabase = createAdminClient();

  const id = String(formData.get("id") ?? "");
  const fullName = String(formData.get("fullName") ?? "").trim();
  const displayRole = String(formData.get("displayRole") ?? "").trim();
  const bio = String(formData.get("bio") ?? "").trim();
  const showOnSite = formData.get("showOnSite") === "on";
  const sortOrder = Number(formData.get("sortOrder") ?? 0);
  const teamCategories = formData.getAll("teamCategories").map(String);
  const file = formData.get("file");

  if (!id) throw new Error("Missing staff id");

  let photoUrl: string | null = null;
  if (file instanceof File && file.size > 0) {
    photoUrl = await uploadImage(file, "staff");
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: fullName || null,
      display_role: displayRole || null,
      bio: bio || null,
      show_on_site: showOnSite,
      sort_order: Number.isFinite(sortOrder) ? sortOrder : 0,
      team_categories: teamCategories,
      ...(photoUrl ? { photo_url: photoUrl } : {}),
    })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/staff");
  revalidatePath("/");
}
