"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { ListFilter, CalendarDays, X } from "lucide-react";

function fmt(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export default function DateFilter() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const date = params.get("date") ?? "";

  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  function setDate(value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set("date", value);
    else next.delete("date");
    router.push(`${pathname}?${next.toString()}`);
  }

  const today = new Date().toISOString().slice(0, 10);
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-medium transition-colors ${
          date
            ? "border-pink-500 bg-pink-500 text-white"
            : "border-black/10 bg-white text-ink-700 hover:bg-black/[0.03]"
        }`}
      >
        <ListFilter size={15} />
        {date ? fmt(date) : "Filter by date"}
        {date && (
          <span
            role="button"
            onClick={(e) => {
              e.stopPropagation();
              setDate("");
            }}
            className="rounded-full p-0.5 hover:bg-white/20"
          >
            <X size={13} />
          </span>
        )}
      </button>

      {open && (
        <div className="absolute left-0 top-full z-20 mt-2 w-64 card-premium p-3">
          <p className="mb-2 px-1 text-[11px] font-semibold tracking-[0.1em] text-ink-500">
            QUICK PICKS
          </p>
          <div className="mb-3 flex flex-wrap gap-1.5">
            <button
              onClick={() => {
                setDate(today);
                setOpen(false);
              }}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium ${
                date === today
                  ? "border-pink-500 bg-pink-50 text-pink-600"
                  : "border-black/10 text-ink-700 hover:bg-black/[0.03]"
              }`}
            >
              Today
            </button>
            <button
              onClick={() => {
                setDate(tomorrow);
                setOpen(false);
              }}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium ${
                date === tomorrow
                  ? "border-pink-500 bg-pink-50 text-pink-600"
                  : "border-black/10 text-ink-700 hover:bg-black/[0.03]"
              }`}
            >
              Tomorrow
            </button>
            {date && (
              <button
                onClick={() => {
                  setDate("");
                  setOpen(false);
                }}
                className="rounded-full border border-black/10 px-3 py-1.5 text-xs font-medium text-ink-700 hover:bg-black/[0.03]"
              >
                All dates
              </button>
            )}
          </div>

          <p className="mb-2 px-1 text-[11px] font-semibold tracking-[0.1em] text-ink-500">
            PICK A DATE
          </p>
          <div className="relative">
            <CalendarDays
              size={15}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-500"
            />
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-lg border border-black/10 bg-white py-2 pl-9 pr-3 text-sm text-ink-900 outline-none focus:border-pink-400"
            />
          </div>
        </div>
      )}
    </div>
  );
}
