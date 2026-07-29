/**
 * Callers pass the literal `process.env.X` expression rather than a key, so the
 * `NEXT_PUBLIC_*` reads stay statically analysable and keep getting inlined into
 * the client bundle at build time.
 */
export function requireEnv(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `Missing environment variable ${name}. Locally it belongs in .env.local; ` +
        `on Vercel add it under Project Settings → Environment Variables and redeploy ` +
        `(.env.local is gitignored, so it never ships with a deployment).`
    );
  }
  return value;
}
