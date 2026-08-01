import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import PackageManager from "@/components/PackageManager";
import { TABLE_MISSING, type MbcPackage } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function PackagesPage() {
  await requireAdmin();
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("mbc_packages")
    .select("id, name, icon, includes, duration, price, price_label, sort_order, is_active")
    .order("sort_order", { ascending: true });

  const needsMigration = error ? TABLE_MISSING.has(error.code) : false;
  const packages = (data ?? []) as MbcPackage[];

  return (
    <div>
      <h1 className="font-display text-2xl text-ink-900 sm:text-3xl">Packages</h1>
      <p className="mb-6 mt-1 text-sm text-ink-500">
        {packages.length} package{packages.length === 1 ? "" : "s"} — these feed the
        public "Our Packages" grid.
      </p>

      {needsMigration && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Run <code>supabase/migrations/0010_mbc_packages.sql</code> in Supabase first.
        </div>
      )}

      <PackageManager packages={packages} />
    </div>
  );
}
