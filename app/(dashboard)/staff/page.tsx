import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import StaffManager, { type StaffRow } from "@/components/StaffManager";
import { TABLE_MISSING } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function StaffPage() {
  const { user } = await requireAdmin();
  const supabase = createAdminClient();

  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("id, full_name, role")
    .not("role", "is", null);

  const needsMigration = error ? TABLE_MISSING.has(error.code) : false;

  // Emails live in auth.users, not the profile row — join them here.
  let staff: StaffRow[] = [];
  if (profiles?.length) {
    const { data: list } = await supabase.auth.admin.listUsers({ perPage: 1000 });
    const emailById = new Map(list?.users.map((u) => [u.id, u.email ?? ""]) ?? []);

    staff = profiles.map((p) => ({
      id: p.id,
      email: emailById.get(p.id) ?? "—",
      full_name: p.full_name,
      role: p.role as "admin" | "therapist",
    }));
  }

  return (
    <div>
      <h1 className="font-display text-2xl text-ink-900 sm:text-3xl">Staff</h1>
      <p className="mb-6 mt-1 text-sm text-ink-500">
        Who can sign in to this portal.
      </p>

      {needsMigration && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Run <code>supabase/migrations/0002_mbc_admin.sql</code> in Supabase first.
        </div>
      )}

      <StaffManager staff={staff} currentUserId={user.id} />
    </div>
  );
}
