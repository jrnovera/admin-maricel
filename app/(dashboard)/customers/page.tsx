import { Search, Phone, Mail } from "lucide-react";
import { format, parseISO } from "date-fns";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Booking } from "@/lib/types";

export const dynamic = "force-dynamic";

type Row = {
  key: string;
  name: string;
  phone: string;
  email: string | null;
  visits: number;
  spent: number;
  last: string;
};

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await requireAdmin();
  const { q } = await searchParams;
  const query = (q ?? "").trim().toLowerCase();

  const supabase = createAdminClient();
  const { data } = await supabase.from("mbc_bookings").select("*");
  const bookings = (data ?? []) as Booking[];

  // Rolled up by phone — the booking form doesn't require an account, so
  // phone is the most reliable identity we have.
  const map = new Map<string, Row>();
  for (const b of bookings) {
    const key = b.phone || b.email || b.id;
    const row = map.get(key) ?? {
      key,
      name: b.full_name,
      phone: b.phone,
      email: b.email,
      visits: 0,
      spent: 0,
      last: "",
    };
    row.visits += 1;
    if (b.payment_status === "paid") row.spent += Number(b.amount ?? 0);
    if (b.booking_date > row.last) row.last = b.booking_date;
    map.set(key, row);
  }

  let rows = Array.from(map.values()).sort((a, b) => b.last.localeCompare(a.last));
  if (query) {
    rows = rows.filter(
      (r) =>
        r.name.toLowerCase().includes(query) ||
        r.phone.includes(query) ||
        (r.email ?? "").toLowerCase().includes(query)
    );
  }

  return (
    <div>
      <h1 className="font-display text-2xl text-ink-900 sm:text-3xl">Customers</h1>
      <p className="mb-5 mt-1 text-sm text-ink-500">
        {rows.length} customer{rows.length === 1 ? "" : "s"}
      </p>

      <form className="relative mb-5 max-w-md">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-500/50" />
        <input
          name="q"
          defaultValue={q ?? ""}
          placeholder="Search name, phone or email"
          className="w-full rounded-lg border border-black/10 bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-pink-400"
        />
      </form>

      <div className="overflow-x-auto card-premium">
        <table className="w-full text-sm">
          <thead className="border-b border-black/[0.06] bg-black/[0.015] text-left">
            <tr className="text-[11px] tracking-[0.1em] text-ink-500">
              <th className="px-4 py-3 font-semibold">CUSTOMER</th>
              <th className="px-4 py-3 font-semibold">CONTACT</th>
              <th className="px-4 py-3 text-right font-semibold">VISITS</th>
              <th className="px-4 py-3 text-right font-semibold">SPENT</th>
              <th className="px-4 py-3 text-right font-semibold">LAST</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-pink-50">
            {rows.map((r) => (
              <tr key={r.key}>
                <td className="px-4 py-3 font-medium text-ink-900">{r.name}</td>
                <td className="px-4 py-3">
                  <a
                    href={`tel:${r.phone}`}
                    className="flex items-center gap-1.5 text-xs text-ink-500 hover:text-pink-500"
                  >
                    <Phone size={12} /> {r.phone}
                  </a>
                  {r.email && (
                    <a
                      href={`mailto:${r.email}`}
                      className="mt-0.5 flex items-center gap-1.5 text-xs text-ink-500 hover:text-pink-500"
                    >
                      <Mail size={12} /> {r.email}
                    </a>
                  )}
                </td>
                <td className="px-4 py-3 text-right">{r.visits}</td>
                <td className="whitespace-nowrap px-4 py-3 text-right font-medium">
                  AED {r.spent.toLocaleString()}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right text-xs text-ink-500">
                  {r.last ? format(parseISO(r.last), "d MMM yyyy") : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {rows.length === 0 && (
          <p className="px-6 py-12 text-center text-sm text-ink-500">
            {query ? "No customers match that search." : "No customers yet."}
          </p>
        )}
      </div>
    </div>
  );
}
