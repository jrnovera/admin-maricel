import Link from "next/link";
import { format, startOfMonth } from "date-fns";
import { Inbox, MailOpen, CalendarDays, ChevronRight } from "lucide-react";
import { requireStaff } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { TABLE_MISSING, type Enquiry } from "@/lib/types";

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
  const { fullName } = await requireStaff();
  const supabase = createAdminClient();

  const monthStart = format(startOfMonth(new Date()), "yyyy-MM-dd");

  const { data, error } = await supabase
    .from("mbc_enquiries")
    .select("*")
    .order("created_at", { ascending: false });

  const needsMigration = error ? TABLE_MISSING.has(error.code) : false;
  const enquiries = (data ?? []) as Enquiry[];

  const unread = enquiries.filter((e) => !e.is_read);
  const thisMonth = enquiries.filter((e) => e.created_at >= monthStart);
  const recent = enquiries.slice(0, 6);

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
          <code>supabase/migrations/0004_mbc_enquiries.sql</code> in Supabase.
        </div>
      )}

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-3">
        <Stat label="Total Enquiries" value={String(enquiries.length)} Icon={Inbox} />
        <Stat label="Unread" value={String(unread.length)} Icon={MailOpen} />
        <Stat label="This Month" value={String(thisMonth.length)} Icon={CalendarDays} />
      </div>

      <div className="mt-8 card-premium">
        <div className="flex items-center justify-between border-b border-black/[0.06] px-5 py-4">
          <h2 className="font-display text-lg text-ink-900">Recent Enquiries</h2>
          <Link
            href="/enquiries"
            className="flex items-center gap-1 text-xs font-medium text-pink-500 hover:text-pink-600"
          >
            All enquiries <ChevronRight size={14} />
          </Link>
        </div>

        {recent.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-ink-500">
            No enquiries yet.
          </p>
        ) : (
          <ul className="divide-y divide-pink-50">
            {recent.map((e) => (
              <li
                key={e.id}
                className="flex items-center justify-between gap-4 px-5 py-3.5"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ink-900">
                    {e.full_name}
                    {!e.is_read && (
                      <span className="ml-2 rounded-full bg-pink-100 px-2 py-0.5 text-[10px] font-medium text-pink-600">
                        New
                      </span>
                    )}
                  </p>
                  <p className="truncate text-xs text-ink-500">
                    {e.subject || e.service || e.message}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-xs text-ink-700">
                    {format(new Date(e.created_at), "d MMM")}
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
