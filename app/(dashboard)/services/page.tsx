import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import ServiceManager from "@/components/ServiceManager";
import { TABLE_MISSING, COLUMN_MISSING, type MbcServiceGroup } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function ServicesPage() {
  await requireAdmin();
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("mbc_service_groups")
    .select(
      "id, slug, title, icon, blurb, note, sort_order, is_active, mbc_services(id, name, price, price_label, sort_order, is_active)"
    )
    .order("sort_order", { ascending: true });

  const needsMigration = error
    ? TABLE_MISSING.has(error.code) || COLUMN_MISSING.has(error.code)
    : false;

  const groups = (data ?? []) as MbcServiceGroup[];
  const itemCount = groups.reduce((n, g) => n + g.mbc_services.length, 0);

  return (
    <div>
      <h1 className="font-display text-2xl text-ink-900 sm:text-3xl">Services</h1>
      <p className="mb-6 mt-1 text-sm text-ink-500">
        {groups.length} group{groups.length === 1 ? "" : "s"}, {itemCount}{" "}
        service{itemCount === 1 ? "" : "s"} — this is the price list on the
        public Services page.
      </p>

      {needsMigration && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Run <code>supabase/migrations/0013_mbc_service_groups.sql</code> in
          Supabase first — until then the site shows its built-in price list and
          edits here have nothing to save to.
        </div>
      )}

      <ServiceManager groups={groups} />
    </div>
  );
}
