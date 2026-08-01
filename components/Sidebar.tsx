"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  Sparkles,
  UserCog,
  Inbox,
  Images,
  Image,
  Newspaper,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import Logo from "@/components/Logo";
import NotificationBell from "@/components/NotificationBell";
import { createClient } from "@/lib/supabase/client";
import type { StaffRole } from "@/lib/auth";

type Item =
  | { section: string }
  | {
      href: string;
      label: string;
      Icon: React.ComponentType<{
        size?: number;
        strokeWidth?: number;
        className?: string;
      }>;
      adminOnly: boolean;
    };

const links: Item[] = [
  { href: "/", label: "Dashboard", Icon: LayoutDashboard, adminOnly: false },
  { href: "/enquiries", label: "Enquiries", Icon: Inbox, adminOnly: false },
  { section: "Content" },
  { href: "/hero-images", label: "Pages", Icon: Image, adminOnly: true },
  { href: "/gallery", label: "Gallery", Icon: Images, adminOnly: true },
  { href: "/blog", label: "Blog", Icon: Newspaper, adminOnly: true },
  { section: "Manage" },
  { href: "/services", label: "Services", Icon: Sparkles, adminOnly: true },
  { href: "/staff", label: "Staff", Icon: UserCog, adminOnly: true },
];

export default function Sidebar({
  role,
  fullName,
  email,
  unreadCount,
}: {
  role: StaffRole;
  fullName: string | null;
  email: string;
  unreadCount: number;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [lastPath, setLastPath] = useState(pathname);

  // Close the drawer on navigation. Adjusted during render rather than in an
  // effect, so the menu is already closed on the first paint of the new route.
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(false);
  }

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
        <Logo variant="white" className="h-6 w-auto" />
        <div className="flex items-center gap-1">
          <NotificationBell unreadCount={unreadCount} />
          <button onClick={() => setOpen((o) => !o)} aria-label="Toggle menu">
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {open && (
        <div className="glass-sidebar fixed inset-x-0 top-14 z-40 max-h-[calc(100vh-3.5rem)] overflow-y-auto px-4 pb-4 text-white shadow-lg lg:hidden">
          {nav}
          <div className="mt-4">{footer}</div>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="glass-sidebar sticky top-0 hidden min-h-screen w-60 shrink-0 flex-col overflow-y-auto border-r border-white/5 p-5 text-white lg:flex">
        {/* Reversed-white lockup: the color logo's pinks lose contrast on
            this dark glass, so no plate is needed to prop it up. */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <Logo variant="white" className="h-8 w-auto" />
            <p className="mt-2.5 text-[8px] tracking-[0.18em] text-white/40">
              STAFF PORTAL
            </p>
          </div>
          <NotificationBell unreadCount={unreadCount} />
        </div>

        {nav}

        <div className="mt-auto pt-6">{footer}</div>
      </aside>
    </>
  );
}
