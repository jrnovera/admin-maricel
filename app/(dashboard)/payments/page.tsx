import { format } from "date-fns";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { PAYMENT_STATUSES, type Booking, type PaymentStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

const TINT: Record<PaymentStatus, string> = {
  paid: "bg-emerald-50 text-emerald-700",
  partial: "bg-amber-50 text-amber-700",
  unpaid: "bg-gray-100 text-gray-600",
  refunded: "bg-rose-50 text-rose-700",
};

const LABEL: Record<PaymentStatus, string> = {
  paid: "Paid",
  partial: "Partial",
  unpaid: "Unpaid",
  refunded: "Refunded",
};

function isPaymentStatus(value: string): value is PaymentStatus {
  return (PAYMENT_STATUSES as readonly string[]).includes(value);
}

export default async function PaymentsPage() {
  await requireAdmin();

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("mbc_bookings")
    .select("*")
    .neq("status", "cancelled")
    .order("booking_date", { ascending: false });

  const bookings = (data ?? []) as Booking[];

  // Net collected counts fully-paid bookings only: a partial payment records no
  // amount of its own, so the booking total would overstate what came in.
  const collected = bookings
    .filter((b) => b.payment_status === "paid")
    .reduce((sum, b) => sum + Number(b.amount ?? 0), 0);

  const outstanding = bookings
    .filter((b) => b.payment_status === "unpaid" || b.payment_status === "partial")
    .reduce((sum, b) => sum + Number(b.amount ?? 0), 0);

  return (
    <div>
      <h1 className="font-display text-2xl text-ink-900 sm:text-3xl">Payments</h1>
      <p className="mb-6 mt-1 text-sm text-ink-500">
        Payment status for every active booking, as recorded on the booking itself.
      </p>

      {error && (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error.message}
        </p>
      )}

      <div className="mb-6 grid grid-cols-2 gap-4 sm:max-w-md">
        <div className="card-premium p-5">
          <p className="text-xs text-ink-500">Net Collected</p>
          <p className="mt-2 font-display text-2xl text-ink-900">
            AED {collected.toLocaleString()}
          </p>
        </div>
        <div className="card-premium p-5">
          <p className="text-xs text-ink-500">Outstanding</p>
          <p className="mt-2 font-display text-2xl text-ink-900">
            AED {outstanding.toLocaleString()}
          </p>
        </div>
      </div>

      <div className="overflow-x-auto card-premium">
        <table className="w-full text-sm">
          <thead className="border-b border-black/[0.06] bg-black/[0.015] text-left">
            <tr className="text-[11px] tracking-[0.1em] text-ink-500">
              <th className="px-4 py-3 font-semibold">DATE</th>
              <th className="px-4 py-3 font-semibold">CUSTOMER</th>
              <th className="px-4 py-3 font-semibold">SERVICE</th>
              <th className="px-4 py-3 text-right font-semibold">AMOUNT</th>
              <th className="px-4 py-3 text-right font-semibold">STATUS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-pink-50">
            {bookings.map((b) => {
              const status = isPaymentStatus(b.payment_status)
                ? b.payment_status
                : "unpaid";

              return (
                <tr key={b.id}>
                  <td className="whitespace-nowrap px-4 py-3 text-xs text-ink-500">
                    {format(new Date(b.booking_date), "d MMM yyyy")}
                  </td>
                  <td className="px-4 py-3">{b.full_name}</td>
                  <td className="px-4 py-3 text-ink-500">{b.service_label}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right font-medium">
                    AED {Number(b.amount ?? 0).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className={`rounded px-2 py-0.5 text-[11px] ${TINT[status]}`}>
                      {LABEL[status]}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {bookings.length === 0 && !error && (
          <p className="px-6 py-12 text-center text-sm text-ink-500">
            No bookings yet.
          </p>
        )}
      </div>
    </div>
  );
}
