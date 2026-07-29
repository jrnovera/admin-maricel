import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireStaff } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import CreateBookingForm from "@/components/CreateBookingForm";
import type { MbcService, Staff } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function CreateBookingPage() {
  await requireStaff();
  const supabase = createAdminClient();

  const [servicesRes, therapistsRes] = await Promise.all([
    supabase
      .from("mbc_services")
      .select("id, category, name, price, price_label, duration_minutes, sort_order, is_active")
      .eq("is_active", true)
      .order("sort_order", { ascending: true }),
    supabase.from("profiles").select("id, full_name, role").eq("role", "therapist"),
  ]);

  return (
    <div>
      <Link
        href="/bookings"
        className="mb-4 inline-flex items-center gap-2 text-sm text-ink-500 hover:text-ink-900"
      >
        <ArrowLeft size={16} /> Bookings
      </Link>

      <h1 className="font-display text-2xl text-ink-900 sm:text-3xl">New Booking</h1>
      <p className="mb-6 mt-1 text-sm text-ink-500">
        Take a walk-in or phone booking at the counter.
      </p>

      <div className="max-w-2xl card-premium p-5 sm:p-6">
        <CreateBookingForm
          services={(servicesRes.data ?? []) as MbcService[]}
          therapists={(therapistsRes.data ?? []) as Staff[]}
        />
      </div>
    </div>
  );
}
