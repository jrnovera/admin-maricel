"use client";

import { useState, useTransition } from "react";
import { createManualBooking } from "@/app/(dashboard)/bookings/actions";
import type { MbcService, Staff } from "@/lib/types";

const field =
  "w-full rounded-lg border border-black/10 bg-white px-3 py-2.5 text-sm outline-none transition-colors focus:border-pink-400 disabled:bg-pink-50/50";
const label = "mb-1.5 block text-xs font-semibold tracking-[0.1em] text-ink-900";

const times = [
  "10:00 AM", "11:00 AM", "12:00 PM", "1:00 PM", "2:00 PM",
  "3:00 PM", "4:00 PM", "5:00 PM", "6:00 PM", "7:00 PM",
];

export default function CreateBookingForm({
  services,
  therapists,
}: {
  services: MbcService[];
  therapists: Staff[];
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");

  const byCategory = services.reduce<Record<string, MbcService[]>>((acc, s) => {
    (acc[s.category] ??= []).push(s);
    return acc;
  }, {});

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      try {
        await createManualBooking(formData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not create booking");
      }
    });
  }

  const today = new Date().toISOString().split("T")[0];

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={label}>CUSTOMER NAME</label>
          <input name="fullName" required disabled={pending} className={field} />
        </div>
        <div>
          <label className={label}>PHONE</label>
          <input name="phone" type="tel" required disabled={pending} className={field} />
        </div>
      </div>

      <div>
        <label className={label}>EMAIL (OPTIONAL)</label>
        <input name="email" type="email" disabled={pending} className={field} />
      </div>

      <div>
        <label className={label}>SERVICE</label>
        <select name="serviceId" required defaultValue="" disabled={pending} className={field}>
          <option value="" disabled>Choose a service</option>
          {Object.entries(byCategory).map(([category, items]) => (
            <optgroup key={category} label={category}>
              {items.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} — {s.price_label ?? `AED ${Number(s.price).toLocaleString()}`}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={label}>DATE</label>
          <input
            name="bookingDate"
            type="date"
            required
            defaultValue={today}
            disabled={pending}
            className={field}
          />
        </div>
        <div>
          <label className={label}>TIME</label>
          <select name="timeSlot" required defaultValue="" disabled={pending} className={field}>
            <option value="" disabled>Choose a time</option>
            {times.map((t) => <option key={t}>{t}</option>)}
          </select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={label}>STATUS</label>
          <select name="status" defaultValue="confirmed" disabled={pending} className={field}>
            <option value="pending">Enquiry</option>
            <option value="confirmed">Confirmed</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
        </div>
        <div>
          <label className={label}>PAYMENT</label>
          <select name="paymentStatus" defaultValue="unpaid" disabled={pending} className={field}>
            <option value="unpaid">Unpaid</option>
            <option value="partial">Partial</option>
            <option value="paid">Paid</option>
          </select>
        </div>
      </div>

      {therapists.length > 0 && (
        <div>
          <label className={label}>ASSIGN THERAPIST (OPTIONAL)</label>
          <select name="therapistId" defaultValue="" disabled={pending} className={field}>
            <option value="">— Unassigned —</option>
            {therapists.map((t) => (
              <option key={t.id} value={t.id}>{t.full_name || "Therapist"}</option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label className={label}>NOTES (OPTIONAL)</label>
        <textarea name="notes" rows={3} disabled={pending} className={field} />
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-pink-500 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-pink-600 disabled:opacity-60"
        >
          {pending ? "CREATING…" : "Create Booking"}
        </button>
        <a
          href="/bookings"
          className="rounded-full border border-pink-300 px-6 py-3 text-sm font-medium text-pink-500 transition-colors hover:bg-pink-50"
        >
          Cancel
        </a>
      </div>
    </form>
  );
}
