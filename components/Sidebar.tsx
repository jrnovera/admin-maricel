"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  KanbanSquare,
  CalendarDays,
  Sparkles,
  Users,
  UserCog,
  CreditCard,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import Logo from "@/components/Logo";
import { createClient } from "@/lib/supabase/client";
import type { StaffRole } from "@/lib/auth";

type Item =
  | { section: string }
  | {
      href: string;
      label: string;
      Icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
      adminOnly: boolean;
    };

const links: Item[] = [
  { href: "/", label: "Dashboard", Icon: LayoutDashboard, adminOnly: false },
  { href: "/bookings", label: "Bookings", Icon: KanbanSquare, adminOnly: false },
  { href: "/calendar", label: "Calendar", Icon: CalendarDays, adminOnly: false },
  { section: "Manage" },
  { href: "/services", label: "Services", Icon: Sparkles, adminOnly: true },
  { href: "/customers", label: "Customers", Icon: Users, adminOnly: true },
  { href: "/staff", label: "Staff", Icon: UserCog, adminOnly: true },
  { href: "/payments", label: "Payments", Icon: CreditCard, adminOnly: true },
];

export default function Sidebar({
  role,
  fullName,
  email,
}: {
  role: StaffRole;
  fullName: string | null;
  email: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  useEffect(() => setOpen(false), [pathname]);

  const visible = links.filter(
    (l) => "section" in l || !l.adminOnly || role === "admin"
  );

  async function signOut() {
    await createClient().auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const nav = (
    <nav className="flex flex-col gap-1">
      {visible.map((l) => {
        if ("section" in l) {
          return (
            <p
              key={l.section}
              className="mt-4 mb-1 px-3 text-[10px] font-semibold tracking-[0.15em] text-white/30"
            >
              {l.section.toUpperCase()}
            </p>
          );
        }

        const active =
          l.href === "/"
            ? pathname === "/"
            : pathname === l.href || pathname.startsWith(`${l.href}/`);

        return (
          <Link
            key={l.href}
            href={l.href}
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all ${
              active
                ? "bg-white/[0.08] font-medium text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
                : "text-white/50 hover:bg-white/[0.05] hover:text-white/90"
            }`}
          >
            <l.Icon
              size={18}
              strokeWidth={1.6}
              className={active ? "text-pink-400" : ""}
            />
            {l.label}
          </Link>
        );
      })}
    </nav>
  );

  const footer = (
    <div className="border-t border-white/10 pt-4">
      <p className="truncate text-sm text-white">{fullName || email}</p>
      <p className="mb-3 text-xs capitalize text-white/40">{role}</p>
      <button
        onClick={signOut}
        className="flex items-center gap-2 text-xs text-white/50 transition-colors hover:text-white"
      >
        <LogOut size={14} /> Sign out
      </button>
    </div>
  );

  return (
    <>
      {/* Mobile / tablet bar */}
      <div className="glass-sidebar sticky top-0 z-40 flex items-center justify-between px-4 py-3 text-white lg:hidden">
        <div className="flex items-center gap-2">
          <Logo variant="mark" className="h-7 w-7" color="#ffffff" />
          <span className="font-display text-lg font-bold">MBC</span>
        </div>
        <button onClick={() => setOpen((o) => !o)} aria-label="Toggle menu">
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {open && (
        <div className="glass-sidebar max-h-[calc(100vh-3.5rem)] overflow-y-auto px-4 pb-4 text-white lg:hidden">
          {nav}
          <div className="mt-4">{footer}</div>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="glass-sidebar sticky top-0 hidden min-h-screen w-60 shrink-0 flex-col overflow-y-auto border-r border-white/5 p-5 text-white lg:flex">
        <div className="mb-8 flex items-center gap-2.5">
          <Logo variant="mark" className="h-10 w-10" color="#ffffff" />
          <span className="leading-tight">
            <span className="block font-display text-xl font-bold">MBC</span>
            <span className="block text-[8px] tracking-[0.18em] text-white/40">
              STAFF PORTAL
            </span>
          </span>
        </div>

        {nav}

        <div className="mt-auto pt-6">{footer}</div>
      </aside>
    </>
  );
}
