import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { TABLE_MISSING, HERO_PAGES } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function HeroImagesPage() {
  await requireAdmin();

  const { error } = await createAdminClient()
    .from("mbc_hero_images")
    .select("page_key")
    .limit(1);

  const needsMigration = error ? TABLE_MISSING.has(error.code) : false;

  return (
    <div>
      <h1 className="font-display text-2xl text-ink-900 sm:text-3xl">
        Pages
      </h1>
      <p className="mb-6 mt-1 text-sm text-ink-500">
        Select a page to customize its banner photo and headline. Home
        supports multiple slides; every other page shows one.
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

      <ul className="flex flex-col gap-2">
        {HERO_PAGES.map((p) => (
          <li key={p.key}>
            <Link
              href={`/hero-images/${p.key}`}
              className="card-premium flex items-center justify-between gap-3 px-4 py-3.5 text-sm font-medium text-ink-900 transition-colors hover:bg-pink-50/60"
            >
              <span>{p.label}</span>
              <ChevronRight size={16} className="text-ink-500" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
