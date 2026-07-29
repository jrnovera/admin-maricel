import Link from "next/link";
import { format, startOfMonth } from "date-fns";
import { CalendarCheck, Inbox, Wallet, AlertCircle, ChevronRight } from "lucide-react";
import { requireStaff } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { TABLE_MISSING, type Booking } from "@/lib/types";

export const dynamic = "force-dynamic";

function Stat({
  label,
  value,
  Icon,
}: {
  label: string;
  value: string;
  Icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
}) {
  return (
    <div className="card-premium p-5 transition-shadow hover:shadow-[0_1px_2px_rgba(0,0,0,0.04),0_16px_32px_-16px_rgba(0,0,0,0.18)]">
      <div className="flex items-start justify-between">
        <p className="text-xs font-medium tracking-wide text-ink-500">{label}</p>
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-pink-50">
          <Icon size={16} strokeWidth={1.75} className="text-pink-500" />
        </div>
      </div>
      <p className="mt-4 font-display text-3xl tracking-tight text-ink-900">{value}</p>
    </div>
  );
}

export default async function DashboardPage() {
  const { fullName, role, user } = await requireStaff();
  const supabase = createAdminClient();

  const today = format(new Date(), "yyyy-MM-dd");
  const monthStart = format(startOfMonth(new Date()), "yyyy-MM-dd");

  const { data, error } = await supabase
    .from("mbc_bookings")
    .select("*")
    .order("booking_date", { ascending: false });

  const needsMigration = error ? TABLE_MISSING.has(error.code) : false;
  let bookings = (data ?? []) as Booking[];

  if (role === "therapist") {
    bookings = bookings.filter(
      (b) => b.assigned_therapist_id === user.id || b.assigned_therapist_id === null
    );
  }

  const todays = bookings.filter((b) => b.booking_date === today);
  const enquiries = bookings.filter((b) => b.status === "pending");
  const monthRevenue = bookings
    .filter((b) => b.booking_date >= monthStart && b.payment_status === "paid")
    .reduce((sum, b) => sum + Number(b.amount ?? 0), 0);
  const outstanding = bookings.filter(
    (b) => b.status !== "cancelled" && b.payment_status !== "paid"
  );

  const upcoming = bookings
    .filter((b) => b.booking_date >= today && b.status !== "cancelled")
    .sort((a, b) => a.booking_date.localeCompare(b.booking_date))
    .slice(0, 6);

  return (
    <div>
      <h1 className="font-display text-2xl text-ink-900 sm:text-3xl">
        Welcome back{fullName ? `, ${fullName.split(" ")[0]}` : ""}
      </h1>
      <p className="mt-1 text-sm text-ink-500">
        Here&apos;s what&apos;s happening at Maricel Beauty Center today.
      </p>

      {needsMigration && (
        <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          The MBC tables aren&apos;t set up yet. Run{" "}
          <code>supabase/migrations/0001_mbc.sql</code> and{" "}
          <code>0002_mbc_admin.sql</code> in Supabase.
        </div>
      )}

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Today's Bookings" value={String(todays.length)} Icon={CalendarCheck} />
        <Stat label="Open Enquiries" value={String(enquiries.length)} Icon={Inbox} />
        <Stat
          label="Revenue This Month"
          value={`AED ${monthRevenue.toLocaleString()}`}
          Icon={Wallet}
        />
        <Stat label="Awaiting Payment" value={String(outstanding.length)} Icon={AlertCircle} />
      </div>

      <div className="mt-8 card-premium">
        <div className="flex items-center justify-between border-b border-black/[0.06] px-5 py-4">
          <h2 className="font-display text-lg text-ink-900">Upcoming</h2>
          <Link
            href="/bookings"
            className="flex items-center gap-1 text-xs font-medium text-pink-500 hover:text-pink-600"
          >
            All bookings <ChevronRight size={14} />
          </Link>
        </div>

        {upcoming.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-ink-500">
            No upcoming appointments.
          </p>
        ) : (
          <ul className="divide-y divide-pink-50">
            {upcoming.map((b) => (
              <li
                key={b.id}
                className="flex items-center justify-between gap-4 px-5 py-3.5"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ink-900">
                    {b.full_name}
                  </p>
                  <p className="truncate text-xs text-ink-500">{b.service_label}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-xs text-ink-700">
                    {format(new Date(`${b.booking_date}T00:00:00`), "d MMM")} ·{" "}
                    {b.time_slot}
                  </p>
                  <p className="text-xs text-pink-500">
                    AED {Number(b.amount).toLocaleString()}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
