import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import HeroImagesManager from "@/components/HeroImagesManager";
import { TABLE_MISSING, type HeroImage } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function HeroImagesPage() {
  await requireAdmin();

  const { data, error } = await createAdminClient()
    .from("mbc_hero_images")
    .select(
      "id, page_key, sort_order, eyebrow, title_lead, title_accent, body, image, is_active"
    )
    .order("page_key", { ascending: true })
    .order("sort_order", { ascending: true });

  const needsMigration = error ? TABLE_MISSING.has(error.code) : false;
  const rows = (data ?? []) as HeroImage[];

  return (
    <div>
      <h1 className="font-display text-2xl text-ink-900 sm:text-3xl">
        Hero Images
      </h1>
      <p className="mb-6 mt-1 text-sm text-ink-500">
        Manage the banner photo and headline shown at the top of each public
        page. Home supports multiple slides; every other page shows one.
      </p>

      {needsMigration && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Run <code>supabase/migrations/0006_mbc_hero_images.sql</code> in
          Supabase first.
        </div>
      )}

      {error && !needsMigration && (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error.message}
        </p>
      )}

      <HeroImagesManager rows={rows} />
    </div>
  );
}
