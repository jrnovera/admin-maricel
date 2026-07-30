import { requireStaff } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import EnquiryInbox from "@/components/EnquiryInbox";
import { TABLE_MISSING, type Enquiry } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function EnquiriesPage() {
  const { role } = await requireStaff();

  const { data, error } = await createAdminClient()
    .from("mbc_enquiries")
    .select("*")
    .order("created_at", { ascending: false });

  const needsMigration = error ? TABLE_MISSING.has(error.code) : false;
  const enquiries = (data ?? []) as Enquiry[];
  const unread = enquiries.filter((e) => !e.is_read).length;

  return (
    <div>
      <h1 className="font-display text-2xl text-ink-900 sm:text-3xl">Enquiries</h1>
      <p className="mb-6 mt-1 text-sm text-ink-500">
        Messages sent through the website contact form — {unread} unread.
      </p>

      {needsMigration && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Run <code>supabase/migrations/0004_mbc_enquiries.sql</code> in Supabase
          first.
        </div>
      )}

      {error && !needsMigration && (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error.message}
        </p>
      )}

      <EnquiryInbox enquiries={enquiries} canDelete={role === "admin"} />
    </div>
  );
}
