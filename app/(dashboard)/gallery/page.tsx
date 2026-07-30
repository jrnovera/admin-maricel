import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import GalleryManager from "@/components/GalleryManager";
import { TABLE_MISSING, type GalleryItem } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function GalleryPage() {
  await requireAdmin();

  const { data, error } = await createAdminClient()
    .from("mbc_gallery")
    .select("id, image, caption, category, sort_order, is_active")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  const needsMigration = error ? TABLE_MISSING.has(error.code) : false;
  const items = (data ?? []) as GalleryItem[];

  return (
    <div>
      <h1 className="font-display text-2xl text-ink-900 sm:text-3xl">Gallery</h1>
      <p className="mb-6 mt-1 text-sm text-ink-500">
        {items.length} photo{items.length === 1 ? "" : "s"} — these appear on the
        public gallery page.
      </p>

      {needsMigration && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Run <code>supabase/migrations/0005_mbc_gallery_and_blog_seo.sql</code>{" "}
          in Supabase first.
        </div>
      )}

      {error && !needsMigration && (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error.message}
        </p>
      )}

      <GalleryManager items={items} />
    </div>
  );
}
