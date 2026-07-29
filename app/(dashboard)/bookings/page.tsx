import Link from "next/link";
import { Plus } from "lucide-react";
import { requireStaff } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import KanbanBoard from "@/components/KanbanBoard";
import DateFilter from "@/components/DateFilter";
import { TABLE_MISSING, type Booking } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function BookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { date } = await searchParams;
  const { role, user } = await requireStaff();
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("mbc_bookings")
    .select("*")
    .order("booking_date", { ascending: true });

  const needsMigration = error ? TABLE_MISSING.has(error.code) : false;
  let bookings = (data ?? []) as Booking[];

  if (role === "therapist") {
    bookings = bookings.filter(
      (b) => b.assigned_therapist_id === user.id || b.assigned_therapist_id === null
    );
  }

  if (date) {
    bookings = bookings.filter((b) => b.booking_date === date);
  }

  return (
    <div>
      <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-display text-2xl text-ink-900 sm:text-3xl">Bookings</h1>
          <p className="mt-1 text-sm text-ink-500">
            <span className="hidden lg:inline">Drag a card to move it between stages.</span>
            <span className="lg:hidden">Tap a stage tab, then use the menu on a card to move it.</span>
          </p>
        </div>
        <Link
          href="/bookings/create"
          className="flex items-center gap-2 whitespace-nowrap rounded-full bg-pink-500 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-pink-600"
        >
          <Plus size={16} /> New Booking
        </Link>
      </div>

      <div className="mb-5 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <DateFilter />
        {date && (
          <p className="text-xs text-ink-500">
            Showing {bookings.length} booking{bookings.length === 1 ? "" : "s"} on{" "}
            {new Date(`${date}T00:00:00`).toLocaleDateString(undefined, {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </p>
        )}
      </div>

      {needsMigration && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          The MBC tables aren&apos;t set up yet. Run{" "}
          <code>supabase/migrations/0001_mbc.sql</code> and{" "}
          <code>0002_mbc_admin.sql</code> in Supabase.
        </div>
      )}

      {error && !needsMigration && (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Could not load bookings: {error.message}
        </p>
      )}

      <KanbanBoard key={date ?? "all"} initial={bookings} />
    </div>
  );
}
