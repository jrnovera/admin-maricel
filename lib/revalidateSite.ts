"use server";

/**
 * Tells the public site to drop its cached copy of a path right after an
 * admin save. The site and this portal are separate Next.js deployments, so
 * the `revalidatePath()` calls already in each action here only ever clear
 * *this app's* cache — they never reach the site's. Without this, a save
 * would sit invisible on the live site for up to its `revalidate` window
 * (currently 5 minutes) instead of showing immediately.
 *
 * Best-effort and non-blocking: if the site is unreachable or misconfigured,
 * this logs and returns rather than failing the save that triggered it — the
 * content is safely in the database either way, and the site's own
 * time-based revalidation is the fallback.
 */
export async function revalidateSitePath(path: string) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  const secret = process.env.REVALIDATE_SECRET;

  if (!siteUrl || !secret) {
    console.error(
      "revalidateSitePath: NEXT_PUBLIC_SITE_URL or REVALIDATE_SECRET is not set — the site won't be told about this change until its own revalidate window passes."
    );
    return;
  }

  try {
    const res = await fetch(`${siteUrl}/api/revalidate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path, secret }),
    });
    if (!res.ok) {
      console.error(
        `revalidateSitePath: site responded ${res.status} for ${path}`
      );
    }
  } catch (err) {
    console.error(`revalidateSitePath: failed to reach site for ${path}`, err);
  }
}
