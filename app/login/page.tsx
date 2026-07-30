"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Logo from "@/components/Logo";
import { createClient } from "@/lib/supabase/client";

const field =
  "w-full rounded-lg border border-pink-200 bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-pink-400 disabled:bg-pink-50/50";

// A rejected sign-in and a misconfigured server look identical from the login
// screen, so each redirect reason gets its own message.
const REDIRECT_ERRORS: Record<string, string> = {
  not_staff:
    "That account isn't registered as MBC staff. Ask an admin to grant you access on the Staff page.",
  config:
    "The server is missing its Supabase keys. Add NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY to the deployment's environment variables, then redeploy.",
  lookup_failed:
    "Signed in, but the staff profile lookup failed. Check the server's Supabase service-role key and that the profiles table exists.",
};

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [error, setError] = useState(
    REDIRECT_ERRORS[params.get("error") ?? ""] ?? ""
  );
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setPending(true);

    const data = new FormData(e.currentTarget);
    const supabase = createClient();

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: String(data.get("email")),
      password: String(data.get("password")),
    });

    if (signInError) {
      setError(signInError.message);
      setPending(false);
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <div>
        <label className="mb-1.5 block text-xs font-semibold tracking-[0.12em] text-ink-900">
          EMAIL
        </label>
        <input name="email" type="email" required disabled={pending} className={field} />
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-semibold tracking-[0.12em] text-ink-900">
          PASSWORD
        </label>
        <input
          name="password"
          type="password"
          required
          disabled={pending}
          className={field}
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-full bg-pink-500 px-6 py-3.5 text-sm font-medium text-white transition-colors hover:bg-pink-600 disabled:opacity-60"
      >
        {pending ? "SIGNING IN…" : "SIGN IN"}
      </button>

      <p className="text-center text-xs text-ink-500">
        New here?{" "}
        <Link href="/register" className="font-medium text-pink-500 hover:text-pink-600">
          Create an account
        </Link>
      </p>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-pink-50 via-blush-100 to-pink-100 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <Logo className="mx-auto h-16 w-auto sm:h-20" />
          <p className="mt-3 text-[9px] font-medium tracking-[0.25em] text-pink-400">
            STAFF PORTAL
          </p>
        </div>

        <div className="rounded-2xl border border-pink-100 bg-white p-6 shadow-sm">
          <Suspense fallback={null}>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
