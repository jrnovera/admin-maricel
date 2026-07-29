"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Logo from "@/components/Logo";
import { createClient } from "@/lib/supabase/client";

const field =
  "w-full rounded-lg border border-pink-200 bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-pink-400 disabled:bg-pink-50/50";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [error, setError] = useState(
    params.get("error") === "not_staff"
      ? "That account isn't registered as MBC staff."
      : ""
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
          <Logo variant="mark" className="mx-auto h-14 w-14" />
          <p className="mt-3 font-display text-2xl font-bold text-pink-500">MBC</p>
          <p className="text-[9px] font-medium tracking-[0.25em] text-pink-400">
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
