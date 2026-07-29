"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

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

  const { error } = await supabase.from("profiles").upsert(
    {
      id: match.id,
      full_name: fullName || (match.user_metadata?.full_name as string) || null,
      role,
    },
    { onConflict: "id" }
  );

  if (error) throw new Error(error.message);
  revalidatePath("/staff");
}
