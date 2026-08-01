"use client";

import Link from "next/link";
import { Bell } from "lucide-react";

export default function NotificationBell({
  unreadCount,
  variant = "dark",
}: {
  unreadCount: number;
  variant?: "dark" | "light";
}) {
  const iconClass = variant === "dark" ? "text-white/70" : "text-ink-900";

  return (
    <Link
      href="/enquiries"
      aria-label={
        unreadCount > 0
          ? `${unreadCount} unread enquir${unreadCount === 1 ? "y" : "ies"}`
          : "Enquiries"
      }
      className={`relative flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-white/10 ${iconClass}`}
    >
      <Bell size={18} strokeWidth={1.75} />
      {unreadCount > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-pink-500 px-1 text-[10px] font-semibold text-white">
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      )}
    </Link>
  );
}
