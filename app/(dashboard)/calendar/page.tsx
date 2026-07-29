import Link from "next/link";
import {
  format,
  parseISO,
  isValid,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  addMonths,
  subMonths,
  isSameMonth,
  isToday,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { requireStaff } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Booking } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; day?: string }>;
}) {
  const { role, user } = await requireStaff();
  const params = await searchParams;

  const parsed = params.month ? parseISO(`${params.month}-01`) : new Date();
  const cursor = isValid(parsed) ? parsed : new Date();

  const supabase = createAdminClient();
  const monthStart = startOfMonth(cursor);
  const monthEnd = endOfMonth(cursor);

  const { data } = await supabase
    .from("mbc_bookings")
    .select("*")
    .gte("booking_date", format(monthStart, "yyyy-MM-dd"))
    .lte("booking_date", format(monthEnd, "yyyy-MM-dd"));

  let bookings = (data ?? []) as Booking[];
  if (role === "therapist") {
    bookings = bookings.filter(
      (b) => b.assigned_therapist_id === user.id || b.assigned_therapist_id === null
    );
  }

  const countByDay = new Map<string, number>();
  for (const b of bookings) {
    if (b.status === "cancelled") continue;
    countByDay.set(b.booking_date, (countByDay.get(b.booking_date) ?? 0) + 1);
  }

  const days = eachDayOfInterval({
    start: startOfWeek(monthStart),
    end: endOfWeek(monthEnd),
  });

  const selected = params.day;
  const dayBookings = selected
    ? bookings
        .filter((b) => b.booking_date === selected)
        .sort((a, b) => a.time_slot.localeCompare(b.time_slot))
    : [];

  const prev = format(subMonths(cursor, 1), "yyyy-MM");
  const next = format(addMonths(cursor, 1), "yyyy-MM");
  const monthParam = format(cursor, "yyyy-MM");

  return (
    <div>
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-display text-2xl text-ink-900 sm:text-3xl">Calendar</h1>
          <p className="mt-1 text-sm text-ink-500">
            Tap a day to see its appointments.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Link
            href={`/calendar?month=${prev}`}
            className="rounded-lg border border-black/10 p-2 text-ink-700 hover:bg-black/[0.03]"
          >
            <ChevronLeft size={16} />
          </Link>
          <span className="min-w-36 text-center font-display text-base text-ink-900 sm:text-lg">
            {format(cursor, "MMMM yyyy")}
          </span>
          <Link
            href={`/calendar?month=${next}`}
            className="rounded-lg border border-black/10 p-2 text-ink-700 hover:bg-black/[0.03]"
          >
            <ChevronRight size={16} />
          </Link>
        </div>
      </div>

      <div className="overflow-hidden card-premium">
        <div className="grid grid-cols-7 border-b border-black/[0.06] bg-black/[0.015]">
          {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
            <div
              key={i}
              className="py-2.5 text-center text-[11px] font-semibold tracking-wide text-ink-500"
            >
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {days.map((day) => {
            const key = format(day, "yyyy-MM-dd");
            const count = countByDay.get(key) ?? 0;
            const inMonth = isSameMonth(day, cursor);
            const isSelected = selected === key;

            return (
              <Link
                key={key}
                href={`/calendar?month=${monthParam}&day=${key}`}
                className={`relative min-h-16 border-b border-r border-pink-50 p-2 transition-colors sm:min-h-24 ${
                  inMonth ? "bg-white hover:bg-pink-50/60" : "bg-blush-50/40"
                } ${isSelected ? "ring-2 ring-inset ring-pink-400" : ""}`}
              >
                <span
                  className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                    isToday(day)
                      ? "bg-pink-500 font-medium text-white"
                      : inMonth
                        ? "text-ink-900"
                        : "text-ink-500/40"
                  }`}
                >
                  {format(day, "d")}
                </span>

                {count > 0 && (
                  <span className="mt-1 block text-[10px] font-medium text-pink-500 sm:text-[11px]">
                    {count} appt{count > 1 ? "s" : ""}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </div>

      {selected && (
        <div className="mt-6">
          <h2 className="mb-3 font-display text-lg text-ink-900">
            {format(parseISO(selected), "EEEE d MMMM")}
          </h2>

          {dayBookings.length === 0 ? (
            <p className="card-premium px-5 py-8 text-center text-sm text-ink-500">
              No appointments this day.
            </p>
          ) : (
            <ul className="space-y-2">
              {dayBookings.map((b) => (
                <li
                  key={b.id}
                  className="flex items-center justify-between gap-4 card-premium px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink-900">
                      {b.full_name}
                    </p>
                    <p className="truncate text-xs text-ink-500">{b.service_label}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-xs text-ink-700">{b.time_slot}</p>
                    <p className="text-xs capitalize text-pink-500">{b.status}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
