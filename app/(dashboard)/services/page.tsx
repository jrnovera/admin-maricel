import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import ServiceManager from "@/components/ServiceManager";
import { TABLE_MISSING, type MbcService } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function ServicesPage() {
  await requireAdmin();
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("mbc_services")
    .select("id, category, name, price, price_label, duration_minutes, sort_order, is_active")
    .order("sort_order", { ascending: true });

  const needsMigration = error ? TABLE_MISSING.has(error.code) : false;
  const services = (data ?? []) as MbcService[];

  return (
    <div>
      <h1 className="font-display text-2xl text-ink-900 sm:text-3xl">Services</h1>
      <p className="mb-6 mt-1 text-sm text-ink-500">
        {services.length} service{services.length === 1 ? "" : "s"} — these feed the
        public price list and the booking form.
      </p>

      {needsMigration && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Run <code>supabase/migrations/0001_mbc.sql</code> in Supabase first.
        </div>
      )}

      <ServiceManager services={services} />
    </div>
  );
}
