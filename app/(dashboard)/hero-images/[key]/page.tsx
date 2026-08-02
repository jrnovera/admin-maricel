import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import HeroPageEditor from "@/components/HeroPageEditor";
import PageContentEditor from "@/components/PageContentEditor";
import { sectionsFor } from "@/lib/content-schema";
import { TABLE_MISSING, HERO_PAGES, type HeroImage } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function HeroPagePage({
  params,
}: {
  params: Promise<{ key: string }>;
}) {
  await requireAdmin();
  const { key } = await params;

  const page = HERO_PAGES.find((p) => p.key === key);
  if (!page) notFound();

  const supabase = createAdminClient();
  const [{ data, error }, { data: copyRows, error: copyError }] =
    await Promise.all([
      supabase
        .from("mbc_hero_images")
        .select(
          "id, page_key, sort_order, eyebrow, title_lead, title_accent, body, image, is_active"
        )
        .eq("page_key", key)
        .order("sort_order", { ascending: true }),
      supabase
        .from("mbc_page_content")
        .select("field_key, value")
        .eq("page_key", key),
    ]);

  const needsMigration = error ? TABLE_MISSING.has(error.code) : false;
  const needsContentMigration = copyError
    ? TABLE_MISSING.has(copyError.code)
    : false;
  const rows = (data ?? []) as HeroImage[];

  const sections = sectionsFor(key);
  const values = Object.fromEntries(
    (copyRows ?? []).map((r) => [String(r.field_key), String(r.value ?? "")])
  );

  return (
    <div>
      <Link
        href="/hero-images"
        className="mb-4 flex items-center gap-1 text-sm font-medium text-ink-500 hover:text-pink-500"
      >
        <ChevronLeft size={16} /> All Pages
      </Link>

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

      <HeroPageEditor
        pageKey={page.key}
        label={page.label}
        multi={page.multi}
        items={rows}
      />

      {needsContentMigration ? (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Run <code>supabase/migrations/0008_mbc_page_content.sql</code> in
          Supabase to edit the rest of this page&apos;s copy.
        </div>
      ) : sections.length === 0 ? (
        // Otherwise the editor renders nothing at all and the page reads as
        // broken rather than as "the banner is all there is to edit here".
        <div className="mb-10 rounded-xl border border-black/10 bg-white px-5 py-4 text-sm text-ink-500">
          Only the banner above is editable on the {page.label} page. Ask your
          developer if you need to change the wording further down it.
        </div>
      ) : (
        <PageContentEditor
          pageKey={page.key}
          sections={sections}
          values={values}
        />
      )}
    </div>
  );
}
