import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import FaqManager from "@/components/FaqManager";
import { TABLE_MISSING, type MbcFaq } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function FaqsPage() {
  await requireAdmin();
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("mbc_faqs")
    .select("id, page_key, question, answer, sort_order, is_active")
    .eq("page_key", "vouchers")
    .order("sort_order", { ascending: true });

  const needsMigration = error ? TABLE_MISSING.has(error.code) : false;
  const faqs = (data ?? []) as MbcFaq[];

  return (
    <div>
      <h1 className="font-display text-2xl text-ink-900 sm:text-3xl">FAQs</h1>
      <p className="mb-6 mt-1 text-sm text-ink-500">
        {faqs.length} question{faqs.length === 1 ? "" : "s"} — these feed the
        "Frequently Asked Questions" section on the public Gift Vouchers page.
      </p>

      {needsMigration && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Run <code>supabase/migrations/0015_mbc_faqs.sql</code> in Supabase
          first.
        </div>
      )}

      {error && !needsMigration && (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error.message}
        </p>
      )}

      <FaqManager faqs={faqs} />
    </div>
  );
}
