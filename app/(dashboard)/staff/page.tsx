import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import StaffManager, { type StaffRow } from "@/components/StaffManager";
import { TABLE_MISSING, COLUMN_MISSING } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function StaffPage() {
  const { user } = await requireAdmin();
  const supabase = createAdminClient();

  const { data: profiles, error } = await supabase
    .from("profiles")
    .select(
      "id, full_name, role, photo_url, display_role, bio, show_on_site, sort_order, team_categories"
    )
    .not("role", "is", null);

  const needsMigration = error
    ? TABLE_MISSING.has(error.code) || COLUMN_MISSING.has(error.code)
    : false;

  // Emails (and login-ban state) live in auth.users, not the profile row —
  // join them here.
  let staff: StaffRow[] = [];
  if (profiles?.length) {
    const { data: list } = await supabase.auth.admin.listUsers({ perPage: 1000 });
    const usersById = new Map(list?.users.map((u) => [u.id, u]) ?? []);

    staff = profiles.map((p) => {
      const authUser = usersById.get(p.id);
      const bannedUntil = authUser?.banned_until;
      const canLogin = !bannedUntil || new Date(bannedUntil) <= new Date();

      return {
        id: p.id,
        email: authUser?.email ?? "—",
        full_name: p.full_name,
        role: p.role as "admin" | "therapist",
        photo_url: p.photo_url,
        display_role: p.display_role,
        bio: p.bio,
        show_on_site: p.show_on_site ?? false,
        sort_order: p.sort_order ?? 0,
        team_categories: (p.team_categories as string[] | null) ?? [],
        canLogin,
      };
    });
  }

  return (
    <div>
      <h1 className="font-display text-2xl text-ink-900 sm:text-3xl">Staff</h1>
      <p className="mb-6 mt-1 text-sm text-ink-500">
        Who can sign in to this portal, and who shows up on the public Our
        Team page.
      </p>

      {needsMigration && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Run <code>supabase/migrations/0002_mbc_admin.sql</code>,{" "}
          <code>supabase/migrations/0007_staff_public_profile.sql</code>, and{" "}
          <code>supabase/migrations/0009_mbc_staff_team_categories.sql</code>{" "}
          in Supabase first.
        </div>
      )}

      <StaffManager staff={staff} currentUserId={user.id} />
    </div>
  );
}
