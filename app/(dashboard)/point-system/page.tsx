import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import PointSystemManager from "@/components/PointSystemManager";
import { TABLE_MISSING, type MbcPointGroup, type MbcRedemptionTier } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function PointSystemPage() {
  await requireAdmin();
  const supabase = createAdminClient();

  const [{ data: groupsData, error: groupsError }, { data: tiersData, error: tiersError }] =
    await Promise.all([
      supabase
        .from("mbc_point_groups")
        .select("id, slug, title, icon, note, sort_order, is_active, mbc_point_items(id, group_id, name, points, sort_order)")
        .order("sort_order", { ascending: true }),
      supabase
        .from("mbc_redemption_tiers")
        .select("id, price, points, sort_order")
        .order("sort_order", { ascending: true }),
    ]);

  // Either table missing means the migration hasn't run. Checked independently
  // so a non-migration error on one query can't mask a missing table on the other.
  const needsMigration =
    TABLE_MISSING.has(groupsError?.code ?? "") ||
    TABLE_MISSING.has(tiersError?.code ?? "");

  const groups = (groupsData ?? []) as MbcPointGroup[];
  const tiers = (tiersData ?? []) as MbcRedemptionTier[];

  return (
    <div>
      <h1 className="font-display text-2xl text-ink-900 sm:text-3xl">Point System</h1>
      <p className="mb-6 mt-1 text-sm text-ink-500">
        Manage the loyalty point values shown on the public &quot;Point System&quot; page.
      </p>

      {needsMigration && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Run <code>supabase/migrations/0012_mbc_point_system.sql</code> in Supabase first.
        </div>
      )}

      <PointSystemManager groups={groups} tiers={tiers} />
    </div>
  );
}
