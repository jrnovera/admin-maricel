"use server";

import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { uploadImage } from "@/lib/upload";
import { revalidateSitePath } from "@/lib/revalidateSite";

/** No "set a password" field on the add-staff form — this mints one so the
 *  account is usable immediately. Shown once in the success state so the
 *  admin can hand it to the new hire. */
function generateTempPassword(): string {
  return randomBytes(9).toString("base64url");
}

/** The public title is just the picked Our Team section(s), joined — no
 *  separate free-text field to keep in sync with the checkboxes. */
function titleFromCategories(categories: string[]): string | null {
  return categories.length > 0 ? categories.join(" & ") : null;
}

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
  revalidatePath("/our-team");
  revalidateSitePath("/our-team");
}

/**
 * Blocks or restores sign-in for an account at the Supabase Auth layer
 * itself (via a ban), independent of the profile row or its role. This is
 * how a "team member" profile can exist purely for the public Our Team page
 * with no portal access at all — the account technically exists (a profile
 * row must reference a real auth user), but it can never authenticate.
 */
export async function setPortalAccess(userId: string, canLogin: boolean) {
  const { user } = await requireAdmin();

  if (userId === user.id && !canLogin) {
    throw new Error("You can't disable your own login access.");
  }

  const supabase = createAdminClient();
  const { error } = await supabase.auth.admin.updateUserById(userId, {
    ban_duration: canLogin ? "none" : "876000h",
  });
  if (error) throw new Error(error.message);

  revalidatePath("/staff");
}

/**
 * Adds staff by email — if an account with that email already exists it's
 * granted access as before; otherwise one is created on the spot with an
 * auto-generated password (no password field in the form), using the same
 * service-role approach `/register` uses so it isn't tripped up by the
 * confirmation-email/Site URL issue documented there. Either way, no
 * separate sign-up step is required.
 *
 * `portalAccess` off means this is purely a public Our Team profile: the
 * underlying account still has to exist (a profile row must reference a
 * real auth user), but it's immediately banned at the Auth layer so it can
 * never actually sign in — no password is generated for anyone to see.
 *
 * Returns the generated password when a new, login-enabled account was
 * created, so the caller can show it once — this is the only place it's
 * ever visible.
 */
export async function addStaffByEmail(
  formData: FormData
): Promise<{ tempPassword: string | null }> {
  await requireAdmin();
  const supabase = createAdminClient();

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const fullName = String(formData.get("fullName") ?? "").trim();
  const role = String(formData.get("role") ?? "therapist");
  const portalAccess = formData.get("portalAccess") === "on";
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

  let userId: string;
  let metadataFullName: string | null = null;
  let tempPassword: string | null = null;

  const match = list.users.find((u) => u.email?.toLowerCase() === email);
  if (match) {
    userId = match.id;
    metadataFullName = (match.user_metadata?.full_name as string) || null;
  } else {
    // A password is required to create the account either way — it's just
    // never surfaced when there's no portal access to use it for.
    const generated = generateTempPassword();
    const { data: created, error: createError } =
      await supabase.auth.admin.createUser({
        email,
        password: generated,
        email_confirm: true,
        user_metadata: fullName ? { full_name: fullName } : undefined,
      });
    if (createError) throw new Error(createError.message);
    userId = created.user.id;
    if (portalAccess) tempPassword = generated;
  }

  // Applied for both new and existing matches, so toggling this on an
  // already-registered email still takes effect.
  const { error: banError } = await supabase.auth.admin.updateUserById(userId, {
    ban_duration: portalAccess ? "none" : "876000h",
  });
  if (banError) throw new Error(banError.message);

  let photoUrl: string | null = null;
  if (file instanceof File && file.size > 0) {
    photoUrl = await uploadImage(file, "staff");
  }

  const { error } = await supabase.from("profiles").upsert(
    {
      id: userId,
      full_name: fullName || metadataFullName,
      role,
      display_role: titleFromCategories(teamCategories),
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
  revalidatePath("/our-team");
  revalidateSitePath("/our-team");

  return { tempPassword };
}

/** Edits the public-facing profile (photo, title, bio, visibility) for an existing staff member. */
export async function updateStaffProfile(formData: FormData) {
  await requireAdmin();
  const supabase = createAdminClient();

  const id = String(formData.get("id") ?? "");
  const fullName = String(formData.get("fullName") ?? "").trim();
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
      display_role: titleFromCategories(teamCategories),
      bio: bio || null,
      show_on_site: showOnSite,
      sort_order: Number.isFinite(sortOrder) ? sortOrder : 0,
      team_categories: teamCategories,
      ...(photoUrl ? { photo_url: photoUrl } : {}),
    })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/staff");
  revalidatePath("/our-team");
  revalidateSitePath("/our-team");
}
