"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Logo from "@/components/Logo";
import { createClient } from "@/lib/supabase/client";
import { registerStaff } from "./actions";

const field =
  "w-full rounded-lg border border-pink-200 bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-pink-400 disabled:bg-pink-50/50";

function RegisterForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setPending(true);

    const data = new FormData(e.currentTarget);
    const email = String(data.get("email")).trim();
    const password = String(data.get("password"));

    if (password !== String(data.get("confirmPassword"))) {
      setError("Passwords don't match.");
      setPending(false);
      return;
    }

    const result = await registerStaff(data);

    if (!result.ok) {
      setError(result.error);
      setPending(false);
      return;
    }

    // Role-less accounts have nowhere to land, so only the bootstrap admin is
    // signed straight in; everyone else waits to be granted access.
    if (!result.role) {
      setDone(true);
      setPending(false);
      return;
    }

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(`${signInError.message} — try signing in from the login page.`);
      setPending(false);
      return;
    }

    router.push("/");
    router.refresh();
  }

  if (done) {
    return (
      <div className="space-y-4 text-center">
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          Account created. Ask an admin to grant you staff access, then sign in.
        </p>
        <Link
          href="/login"
          className="inline-block text-sm font-medium text-pink-500 hover:text-pink-600"
        >
          Back to sign in
        </Link>
      </div>
    );
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
          FULL NAME
        </label>
        <input name="fullName" type="text" required disabled={pending} className={field} />
      </div>

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
          minLength={6}
          disabled={pending}
          className={field}
        />
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-semibold tracking-[0.12em] text-ink-900">
          CONFIRM PASSWORD
        </label>
        <input
          name="confirmPassword"
          type="password"
          required
          minLength={6}
          disabled={pending}
          className={field}
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-full bg-pink-500 px-6 py-3.5 text-sm font-medium text-white transition-colors hover:bg-pink-600 disabled:opacity-60"
      >
        {pending ? "CREATING ACCOUNT…" : "CREATE ACCOUNT"}
      </button>

      <p className="text-center text-xs text-ink-500">
        Already have access?{" "}
        <Link href="/login" className="font-medium text-pink-500 hover:text-pink-600">
          Sign in
        </Link>
      </p>
    </form>
  );
}

export default function RegisterPage() {
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
          <p className="mb-5 text-center text-sm text-ink-500">
            Create an account, then ask an admin to grant you staff access.
          </p>
          <RegisterForm />
        </div>
      </div>
    </div>
  );
}
