"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireStaff, requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  BOOKING_STATUSES,
  PAYMENT_STATUSES,
  type BookingStatus,
  type PaymentStatus,
} from "@/lib/types";

export async function updateBookingStatus(
  bookingId: string,
  status: BookingStatus
) {
  if (!BOOKING_STATUSES.includes(status)) throw new Error("Invalid status");
  await requireStaff();

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("mbc_bookings")
    .update({ status })
    .eq("id", bookingId);

  if (error) throw new Error(error.message);
  revalidatePath("/bookings");
  revalidatePath("/");
}

export async function updatePaymentStatus(
  bookingId: string,
  paymentStatus: PaymentStatus
) {
  if (!PAYMENT_STATUSES.includes(paymentStatus)) {
    throw new Error("Invalid payment status");
  }
  await requireStaff();

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("mbc_bookings")
    .update({ payment_status: paymentStatus })
    .eq("id", bookingId);

  if (error) throw new Error(error.message);
  revalidatePath("/bookings");
  revalidatePath("/");
}

export async function assignTherapist(
  bookingId: string,
  therapistId: string | null
) {
  await requireStaff();

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("mbc_bookings")
    .update({ assigned_therapist_id: therapistId })
    .eq("id", bookingId);

  if (error) throw new Error(error.message);
  revalidatePath("/bookings");
}

export async function deleteBooking(bookingId: string) {
  await requireAdmin();

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("mbc_bookings")
    .delete()
    .eq("id", bookingId);

  if (error) throw new Error(error.message);
  revalidatePath("/bookings");
}

/** Walk-in / phone booking taken by staff at the counter. */
export async function createManualBooking(formData: FormData) {
  await requireStaff();
  const supabase = createAdminClient();

  const get = (k: string) => String(formData.get(k) ?? "").trim();

  const fullName = get("fullName");
  const phone = get("phone");
  const serviceId = get("serviceId");
  const bookingDate = get("bookingDate");
  const timeSlot = get("timeSlot");

  if (!fullName || !phone || !serviceId || !bookingDate || !timeSlot) {
    throw new Error("Name, phone, service, date and time are required");
  }

  // Price is read from the database, never trusted from the form.
  const { data: service, error: serviceError } = await supabase
    .from("mbc_services")
    .select("id, name, price, price_label")
    .eq("id", serviceId)
    .single();

  if (serviceError || !service) throw new Error("Service not found");

  const label =
    service.price_label ?? `AED ${Number(service.price).toLocaleString()}`;

  const { error } = await supabase.from("mbc_bookings").insert({
    service_id: service.id,
    full_name: fullName,
    phone,
    email: get("email") || null,
    service_label: `${service.name} — ${label}`,
    booking_date: bookingDate,
    time_slot: timeSlot,
    notes: get("notes") || null,
    amount: service.price,
    status: get("status") || "confirmed",
    payment_status: get("paymentStatus") || "unpaid",
    assigned_therapist_id: get("therapistId") || null,
  });

  if (error) throw new Error(error.message);

  revalidatePath("/bookings");
  redirect("/bookings");
}
