import { redirect } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient, hasAdminCredentials } from "@/lib/supabase/admin";

export type StaffRole = "admin" | "therapist";

export type StaffProfile = {
  role: StaffRole;
  full_name: string | null;
};

/**
 * Bootstrap rule: while no profile carries a role, nobody can reach /staff to
 * grant one, so the first account to authenticate claims admin. Once a single
 * admin exists this is a no-op and later signups sit role-less until an admin
 * grants them access on /staff.
 */
export async function claimAdminIfUnclaimed(
  admin: SupabaseClient,
  userId: string,
  fullName: string | null
): Promise<StaffProfile | null> {
  const { count, error } = await admin
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .not("role", "is", null);

  if (error || count !== 0) return null;

  // Upsert rather than insert: a `handle_new_user` trigger may already have
  // written a role-less row for this account at signup.
  const { data, error: claimError } = await admin
    .from("profiles")
    .upsert(
      { id: userId, full_name: fullName, role: "admin" },
      { onConflict: "id" }
    )
    .select("role, full_name")
    .single();

  if (claimError) return null;
  return { role: data.role as StaffRole, full_name: data.full_name };
}

/**
 * MBC staff membership is defined by having a row in `profiles` with a role.
 */
export async function requireStaff() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Without the service-role key every lookup below fails. Checked up front so
  // a misconfigured deployment says so instead of looking like a rejected login.
  if (!hasAdminCredentials()) redirect("/login?error=config");

  const admin = createAdminClient();
  const { data: profile, error } = await admin
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .maybeSingle();

  // A failed query is a server fault, not a permission one — reporting it as
  // "you aren't staff" sends the person chasing entirely the wrong problem.
  if (error) redirect("/login?error=lookup_failed");

  const staffProfile: StaffProfile | null = profile?.role
    ? { role: profile.role as StaffRole, full_name: profile.full_name }
    : await claimAdminIfUnclaimed(
        admin,
        user.id,
        profile?.full_name ??
          (user.user_metadata?.full_name as string | undefined) ??
          null
      );

  if (!staffProfile) redirect("/login?error=not_staff");

  return {
    user,
    role: staffProfile.role,
    fullName: staffProfile.full_name,
  };
}

export async function requireAdmin() {
  const staff = await requireStaff();
  if (staff.role !== "admin") redirect("/");
  return staff;
}
