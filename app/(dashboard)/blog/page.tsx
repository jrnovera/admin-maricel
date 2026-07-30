import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import BlogManager from "@/components/BlogManager";
import { TABLE_MISSING, COLUMN_MISSING, type BlogPost } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function BlogPage() {
  await requireAdmin();

  const { data, error } = await createAdminClient()
    .from("mbc_blog_posts")
    .select("*")
    .order("published_at", { ascending: false })
    .order("sort_order", { ascending: true });

  const needsBlogMigration = error ? TABLE_MISSING.has(error.code) : false;
  const needsSeoMigration = error ? COLUMN_MISSING.has(error.code) : false;
  const posts = (data ?? []) as BlogPost[];

  return (
    <div>
      <h1 className="font-display text-2xl text-ink-900 sm:text-3xl">Blog</h1>
      <p className="mb-6 mt-1 text-sm text-ink-500">
        {posts.length} post{posts.length === 1 ? "" : "s"} — these publish
        straight to the website blog.
      </p>

      {needsBlogMigration && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Run <code>supabase/migrations/0003_mbc_blog.sql</code> in Supabase
          first.
        </div>
      )}

      {needsSeoMigration && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Run <code>supabase/migrations/0005_mbc_gallery_and_blog_seo.sql</code>{" "}
          in Supabase to add the SEO fields.
        </div>
      )}

      {error && !needsBlogMigration && !needsSeoMigration && (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error.message}
        </p>
      )}

      <BlogManager posts={posts} />
    </div>
  );
}
