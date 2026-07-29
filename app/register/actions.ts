"use server";

import { claimAdminIfUnclaimed } from "@/lib/auth";
import { createAdminClient, hasAdminCredentials } from "@/lib/supabase/admin";

export type RegisterResult =
  | { ok: true; role: "admin" | null }
  | { ok: false; error: string };

/**
 * Creates the account server-side rather than via `supabase.auth.signUp`.
 *
 * This project has email confirmation switched on, and Supabase builds those
 * confirmation links from the project's Site URL — so on any deployment whose
 * origin differs from that setting, the new account can never be confirmed and
 * the person is locked out with no way to tell why. Minting the user with the
 * service-role key and `email_confirm: true` removes that dependency.
 */
export async function registerStaff(
  formData: FormData
): Promise<RegisterResult> {
  if (!hasAdminCredentials()) {
    return {
      ok: false,
      error:
        "The server is missing its Supabase keys. Add NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to the deployment, then redeploy.",
    };
  }

  const fullName = String(formData.get("fullName") ?? "").trim();
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!fullName) return { ok: false, error: "Full name is required." };
  if (!email) return { ok: false, error: "Email is required." };
  if (password.length < 6) {
    return { ok: false, error: "Password must be at least 6 characters." };
  }

  const supabase = createAdminClient();

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });

  if (error) {
    if (error.status === 422 || /already/i.test(error.message)) {
      return {
        ok: false,
        error: "An account with that email already exists — sign in instead.",
      };
    }
    return { ok: false, error: error.message };
  }

  const claimed = await claimAdminIfUnclaimed(supabase, data.user.id, fullName);

  if (!claimed) {
    // Not the first account, so it joins with no role. Recorded anyway so the
    // person shows up for an admin to promote instead of being invisible.
    const { error: profileError } = await supabase
      .from("profiles")
      .upsert({ id: data.user.id, full_name: fullName }, { onConflict: "id" });

    if (profileError) {
      // Don't leave behind an account that can sign in but has no profile.
      await supabase.auth.admin.deleteUser(data.user.id);
      return { ok: false, error: profileError.message };
    }
  }

  return { ok: true, role: claimed ? "admin" : null };
}
