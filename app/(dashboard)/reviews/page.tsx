import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import ReviewsManager from "@/components/ReviewsManager";
import { TABLE_MISSING, type MbcReview } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function ReviewsPage() {
  await requireAdmin();

  const { data, error } = await createAdminClient()
    .from("mbc_reviews")
    .select("id, name, role, quote, rating, image, sort_order, is_active")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  const needsMigration = error ? TABLE_MISSING.has(error.code) : false;
  const reviews = (data ?? []) as MbcReview[];

  return (
    <div>
      <h1 className="font-display text-2xl text-ink-900 sm:text-3xl">Reviews</h1>
      <p className="mb-6 mt-1 text-sm text-ink-500">
        {reviews.length} review{reviews.length === 1 ? "" : "s"} — shown on the
        public reviews page until real Google reviews are connected.
      </p>

      {needsMigration && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Run <code>supabase/migrations/0014_mbc_reviews.sql</code> in Supabase
          first.
        </div>
      )}

      {error && !needsMigration && (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error.message}
        </p>
      )}

      <ReviewsManager reviews={reviews} />
    </div>
  );
}
