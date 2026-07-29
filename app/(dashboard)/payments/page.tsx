import { format } from "date-fns";
import { requireAdmin } from "@/lib/auth";
import { getStripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Booking } from "@/lib/types";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  created: number;
  amount: number;
  received: number;
  refunded: number;
  currency: string;
  status: string;
  label: "Paid" | "Partial" | "Refunded" | "Failed";
  customer: string | null;
};

function classify(pi: {
  status: string;
  amount: number;
  amount_received: number;
  amount_refunded: number;
}): Row["label"] {
  if (pi.amount_refunded > 0) {
    return pi.amount_refunded >= pi.amount_received ? "Refunded" : "Partial";
  }
  if (pi.status !== "succeeded") return "Failed";
  return pi.amount_received >= pi.amount ? "Paid" : "Partial";
}

const TINT: Record<Row["label"], string> = {
  Paid: "bg-emerald-50 text-emerald-700",
  Partial: "bg-amber-50 text-amber-700",
  Refunded: "bg-rose-50 text-rose-700",
  Failed: "bg-gray-100 text-gray-600",
};

export default async function PaymentsPage() {
  await requireAdmin();

  // MBC bookings carry their Stripe payment-intent id, which is how these
  // charges are separated from the other business sharing this Stripe account.
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("mbc_bookings")
    .select("*")
    .not("stripe_payment_intent_id", "is", null);

  const bookings = (data ?? []) as Booking[];
  const mbcIntentIds = new Set(
    bookings.map((b) => b.stripe_payment_intent_id).filter(Boolean) as string[]
  );
  const nameByIntent = new Map(
    bookings
      .filter((b) => b.stripe_payment_intent_id)
      .map((b) => [b.stripe_payment_intent_id as string, b.full_name])
  );

  let rows: Row[] = [];
  let stripeError = "";

  try {
    const stripe = getStripe();
    const allIntents = [];
    let startingAfter: string | undefined;

    // Paginate past Stripe's 100-per-page cap to pull the full history.
    for (;;) {
      const page = await stripe.paymentIntents.list({
        limit: 100,
        starting_after: startingAfter,
      });
      allIntents.push(...page.data);
      if (!page.has_more) break;
      startingAfter = page.data[page.data.length - 1].id;
    }

    rows = allIntents
      .filter((pi) => mbcIntentIds.has(pi.id) && pi.status === "succeeded")
      .map((pi) => {
        const refunded =
          pi.latest_charge && typeof pi.latest_charge !== "string"
            ? (pi.latest_charge.amount_refunded ?? 0)
            : 0;

        return {
          id: pi.id,
          created: pi.created,
          amount: pi.amount,
          received: pi.amount_received,
          refunded,
          currency: pi.currency.toUpperCase(),
          status: pi.status,
          label: classify({
            status: pi.status,
            amount: pi.amount,
            amount_received: pi.amount_received,
            amount_refunded: refunded,
          }),
          customer: nameByIntent.get(pi.id) ?? null,
        };
      });
  } catch (err) {
    stripeError = err instanceof Error ? err.message : "Could not reach Stripe";
  }

  const collected = rows
    .filter((r) => r.label === "Paid" || r.label === "Partial")
    .reduce((sum, r) => sum + (r.received - r.refunded), 0);

  return (
    <div>
      <h1 className="font-display text-2xl text-ink-900 sm:text-3xl">Payments</h1>
      <p className="mb-6 mt-1 text-sm text-ink-500">
        Successful card payments taken through the website, reconciled against Stripe.
      </p>

      {stripeError && (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {stripeError}
        </p>
      )}

      <div className="mb-6 grid grid-cols-2 gap-4 sm:max-w-md">
        <div className="card-premium p-5">
          <p className="text-xs text-ink-500">Net Collected</p>
          <p className="mt-2 font-display text-2xl text-ink-900">
            AED {(collected / 100).toLocaleString()}
          </p>
        </div>
        <div className="card-premium p-5">
          <p className="text-xs text-ink-500">Transactions</p>
          <p className="mt-2 font-display text-2xl text-ink-900">{rows.length}</p>
        </div>
      </div>

      <div className="overflow-x-auto card-premium">
        <table className="w-full text-sm">
          <thead className="border-b border-black/[0.06] bg-black/[0.015] text-left">
            <tr className="text-[11px] tracking-[0.1em] text-ink-500">
              <th className="px-4 py-3 font-semibold">DATE</th>
              <th className="px-4 py-3 font-semibold">CUSTOMER</th>
              <th className="px-4 py-3 text-right font-semibold">AMOUNT</th>
              <th className="px-4 py-3 text-right font-semibold">STATUS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-pink-50">
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="whitespace-nowrap px-4 py-3 text-xs text-ink-500">
                  {format(new Date(r.created * 1000), "d MMM yyyy")}
                </td>
                <td className="px-4 py-3">{r.customer ?? "—"}</td>
                <td className="whitespace-nowrap px-4 py-3 text-right font-medium">
                  {r.currency} {(r.received / 100).toLocaleString()}
                  {r.refunded > 0 && (
                    <span className="ml-1 text-xs text-rose-600">
                      −{(r.refunded / 100).toLocaleString()}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <span className={`rounded px-2 py-0.5 text-[11px] ${TINT[r.label]}`}>
                    {r.label}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {rows.length === 0 && !stripeError && (
          <p className="px-6 py-12 text-center text-sm text-ink-500">
            No card payments yet. Bookings paid at the salon won&apos;t appear here.
          </p>
        )}
      </div>
    </div>
  );
}
