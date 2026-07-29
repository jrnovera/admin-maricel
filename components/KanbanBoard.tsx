"use client";

import { useState, useTransition } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { format } from "date-fns";
import { Phone, Clock, GripVertical, CheckCircle2 } from "lucide-react";
import { updateBookingStatus } from "@/app/(dashboard)/bookings/actions";
import {
  BOOKING_STATUSES,
  STATUS_LABEL,
  type Booking,
  type BookingStatus,
} from "@/lib/types";

const COLUMN_TINT: Record<BookingStatus, string> = {
  pending: "border-t-amber-400",
  confirmed: "border-t-pink-400",
  in_progress: "border-t-violet-400",
  completed: "border-t-emerald-400",
  cancelled: "border-t-gray-300",
};

const PAYMENT_TINT: Record<string, string> = {
  paid: "bg-emerald-50 text-emerald-700",
  partial: "bg-amber-50 text-amber-700",
  unpaid: "bg-gray-100 text-gray-600",
  refunded: "bg-rose-50 text-rose-700",
};

function Card({ booking, overlay = false }: { booking: Booking; overlay?: boolean }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: booking.id,
  });

  return (
    <div
      ref={overlay ? undefined : setNodeRef}
      {...(overlay ? {} : attributes)}
      {...(overlay ? {} : listeners)}
      className={`touch-none rounded-lg border border-black/[0.06] bg-white p-3 shadow-sm transition-shadow ${
        overlay
          ? "rotate-2 cursor-grabbing shadow-xl"
          : "cursor-grab hover:shadow-md active:cursor-grabbing"
      } ${isDragging && !overlay ? "opacity-30" : ""}`}
    >
      <div className="flex items-start gap-2">
        <span className="mt-0.5 shrink-0 text-pink-300">
          <GripVertical size={14} />
        </span>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-ink-900">
            {booking.full_name}
          </p>
          <p className="truncate text-xs text-ink-500">{booking.service_label}</p>

          <p className="mt-2 flex items-center gap-1.5 text-[11px] text-ink-500">
            <Clock size={11} />
            {format(new Date(`${booking.booking_date}T00:00:00`), "d MMM")} ·{" "}
            {booking.time_slot}
          </p>
          <a
            href={`tel:${booking.phone}`}
            className="mt-0.5 flex items-center gap-1.5 text-[11px] text-ink-500 hover:text-pink-500"
          >
            <Phone size={11} /> {booking.phone}
          </a>

          <div className="mt-2 flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-ink-900">
              AED {Number(booking.amount).toLocaleString()}
            </span>
            <span
              className={`rounded px-1.5 py-0.5 text-[10px] capitalize ${
                PAYMENT_TINT[booking.payment_status] ?? PAYMENT_TINT.unpaid
              }`}
            >
              {booking.payment_status}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

const STATUS_DOT: Record<BookingStatus, string> = {
  pending: "bg-amber-400",
  confirmed: "bg-pink-400",
  in_progress: "bg-violet-400",
  completed: "bg-emerald-400",
  cancelled: "bg-gray-300",
};

function MobileCard({
  booking,
  onMove,
}: {
  booking: Booking;
  onMove: (id: string, status: BookingStatus) => void;
}) {
  return (
    <div className="card-premium p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-ink-900">
            {booking.full_name}
          </p>
          <p className="truncate text-xs text-ink-500">{booking.service_label}</p>
        </div>
        <span className="text-xs font-medium text-ink-900">
          AED {Number(booking.amount).toLocaleString()}
        </span>
      </div>

      <p className="mt-2.5 flex items-center gap-1.5 text-[11px] text-ink-500">
        <Clock size={11} />
        {format(new Date(`${booking.booking_date}T00:00:00`), "d MMM")} ·{" "}
        {booking.time_slot}
      </p>
      <a
        href={`tel:${booking.phone}`}
        className="mt-0.5 flex items-center gap-1.5 text-[11px] text-ink-500 hover:text-pink-500"
      >
        <Phone size={11} /> {booking.phone}
      </a>

      <div className="mt-3 flex items-center justify-between gap-2 border-t border-black/[0.06] pt-3">
        <span
          className={`rounded px-1.5 py-0.5 text-[10px] capitalize ${
            PAYMENT_TINT[booking.payment_status] ?? PAYMENT_TINT.unpaid
          }`}
        >
          {booking.payment_status}
        </span>

        <select
          value={booking.status}
          onChange={(e) => onMove(booking.id, e.target.value as BookingStatus)}
          className="rounded-full border border-black/10 bg-white py-1.5 pl-3 pr-7 text-xs font-medium text-ink-900 outline-none focus:border-pink-400"
        >
          {BOOKING_STATUSES.map((s) => (
            <option key={s} value={s}>
              Move to {STATUS_LABEL[s]}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

function Column({
  status,
  bookings,
}: {
  status: BookingStatus;
  bookings: Booking[];
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div
      ref={setNodeRef}
      className={`flex w-72 shrink-0 flex-col rounded-xl border border-t-4 border-pink-400 bg-black/[0.02] ${
        COLUMN_TINT[status]
      } ${isOver ? "ring-2 ring-pink-300" : ""}`}
    >
      <div className="flex items-center justify-between px-4 py-3">
        <h2 className="text-xs font-semibold tracking-[0.1em] text-ink-900">
          {STATUS_LABEL[status].toUpperCase()}
        </h2>
        <span className="rounded-full bg-white px-2 py-0.5 text-[11px] text-ink-500">
          {bookings.length}
        </span>
      </div>

      <div className="flex-1 space-y-2 px-3 pb-3">
        {bookings.map((b) => (
          <Card key={b.id} booking={b} />
        ))}
        {bookings.length === 0 && (
          <p className="py-8 text-center text-xs text-ink-500/60">Nothing here</p>
        )}
      </div>
    </div>
  );
}

export default function KanbanBoard({ initial }: { initial: Booking[] }) {
  const [bookings, setBookings] = useState(initial);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [mobileTab, setMobileTab] = useState<BookingStatus>("pending");
  const [, startTransition] = useTransition();

  function moveBooking(bookingId: string, newStatus: BookingStatus) {
    const previous = bookings;
    const current = bookings.find((b) => b.id === bookingId);
    if (!current || current.status === newStatus) return;

    // Optimistic move, rolled back if the server rejects it.
    setBookings((prev) =>
      prev.map((b) => (b.id === bookingId ? { ...b, status: newStatus } : b))
    );
    setError("");
    setConfirmation("");

    startTransition(async () => {
      try {
        await updateBookingStatus(bookingId, newStatus);
        setConfirmation(
          `${current.full_name} moved to ${STATUS_LABEL[newStatus]}`
        );
        setTimeout(() => setConfirmation(""), 2500);
      } catch (err) {
        setBookings(previous);
        setError(err instanceof Error ? err.message : "Could not move booking");
      }
    });
  }

  // Pointer needs a small drag threshold so clicks still work; touch needs a
  // hold delay so the board can still be scrolled with a finger.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 6 },
    })
  );

  function handleDragStart(e: DragStartEvent) {
    setActiveId(String(e.active.id));
  }

  function handleDragEnd(e: DragEndEvent) {
    setActiveId(null);
    const { active, over } = e;
    if (!over) return;

    const bookingId = String(active.id);
    const newStatus = String(over.id) as BookingStatus;
    if (!BOOKING_STATUSES.includes(newStatus)) return;

    moveBooking(bookingId, newStatus);
  }

  const active = bookings.find((b) => b.id === activeId) ?? null;
  const mobileBookings = bookings.filter((b) => b.status === mobileTab);

  return (
    <div>
      {error && (
        <p className="mb-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {/* Mobile / tablet: status tabs + a plain list, no drag needed. */}
      <div className="lg:hidden">
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-3 sm:mx-0 sm:px-0">
          {BOOKING_STATUSES.map((status) => {
            const count = bookings.filter((b) => b.status === status).length;
            const isActive = status === mobileTab;
            return (
              <button
                key={status}
                onClick={() => setMobileTab(status)}
                className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-medium transition-colors ${
                  isActive
                    ? "border-pink-500 bg-pink-500 text-white"
                    : "border-black/10 bg-white text-ink-700"
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT[status]}`}
                />
                {STATUS_LABEL[status]}
                <span
                  className={`rounded-full px-1.5 text-[10px] ${
                    isActive ? "bg-white/20" : "bg-black/[0.04]"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="space-y-2.5">
          {mobileBookings.map((b) => (
            <MobileCard key={b.id} booking={b} onMove={moveBooking} />
          ))}
          {mobileBookings.length === 0 && (
            <p className="card-premium py-10 text-center text-sm text-ink-500">
              Nothing in {STATUS_LABEL[mobileTab].toLowerCase()}.
            </p>
          )}
        </div>
      </div>

      {/* Desktop: full drag-and-drop kanban. */}
      <div className="hidden lg:block">
        <DndContext
          id="bookings-board"
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-4 overflow-x-auto pb-4">
            {BOOKING_STATUSES.map((status) => (
              <Column
                key={status}
                status={status}
                bookings={bookings.filter((b) => b.status === status)}
              />
            ))}
          </div>

          <DragOverlay>{active ? <Card booking={active} overlay /> : null}</DragOverlay>
        </DndContext>
      </div>

      {confirmation && (
        <div className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-4">
          <div className="flex items-center gap-2 rounded-full bg-ink-900 px-4 py-2.5 text-sm text-white shadow-xl">
            <CheckCircle2 size={16} className="text-emerald-400" />
            {confirmation}
          </div>
        </div>
      )}
    </div>
  );
}
