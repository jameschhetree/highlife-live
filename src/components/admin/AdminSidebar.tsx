"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  LayoutDashboard,
  Inbox,
  Mic,
  Users,
  MapPinned,
  Megaphone,
  KanbanSquare,
  FileImage,
  ClipboardList,
  BarChart3,
  Settings,
  LogOut,
  KeyRound,
  Menu,
  X,
  MessageSquare,
  UserCog,
  Crown,
} from "lucide-react";
import { adminLogout, canViewAuditions, canManageVenueLogins, isOwnerAdmin, getAdminSession, type AdminSession } from "@/lib/admin-auth";

const nav = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, gate: "all" },
  { href: "/admin/inquiries", label: "Inquiries", icon: MessageSquare, gate: "all" },
  { href: "/admin/bookings", label: "Bookings", icon: Inbox, gate: "all" },
  { href: "/admin/auditions", label: "Auditions", icon: Mic, gate: "auditions" },
  { href: "/admin/assignments", label: "Assignments", icon: UserCog, gate: "owner" },
  { href: "/admin/venue-logins", label: "Venue Logins", icon: KeyRound, gate: "venue-logins" },
  { href: "/admin/agent-logins", label: "Agent Logins", icon: UserCog, gate: "owner" },
  { href: "/admin/artists", label: "Artists", icon: Users, gate: "all" },
  { href: "/admin/venues", label: "Venues", icon: MapPinned, gate: "all" },
  { href: "/admin/campaigns", label: "Campaigns", icon: Megaphone, gate: "all" },
  { href: "/admin/pipeline", label: "Pipeline", icon: KanbanSquare, gate: "all" },
  { href: "/admin/epks", label: "EPKs", icon: FileImage, gate: "all" },
  { href: "/admin/research", label: "Research Queue", icon: ClipboardList, gate: "all" },
  { href: "/admin/reports", label: "Reports", icon: BarChart3, gate: "all" },
  { href: "/admin/settings", label: "Settings", icon: Settings, gate: "all" },
  { href: "/admin/owner-special", label: "Owner Hub", icon: Crown, gate: "owner" },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [session, setSession] = useState<AdminSession | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setSession(getAdminSession());
  }, []);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (typeof document === "undefined") return;
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const handleLogout = () => {
    adminLogout();
    router.push("/admin/login");
  };

  const visibleNav = nav.filter((item) => {
    if (item.gate === "auditions") return canViewAuditions(session);
    if (item.gate === "venue-logins") return canManageVenueLogins(session);
    if (item.gate === "owner") return isOwnerAdmin(session);
    return true;
  });

  const navList = (onItemClick?: () => void) => (
    <ul className="space-y-0.5 px-2">
      {visibleNav.map((item) => {
        const Icon = item.icon;
        const active =
          item.href === "/admin"
            ? pathname === "/admin"
            : pathname?.startsWith(item.href);
        const isOwnerHub = item.gate === "owner" && item.href === "/admin/owner-special";
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              onClick={onItemClick}
              className={`flex items-center gap-3 px-3 py-3 rounded-lg text-sm transition-colors ${
                active
                  ? isOwnerHub
                    ? "bg-gradient-to-r from-pink-500/15 to-violet-500/15 text-foreground border-l-2 border-pink-400"
                    : "bg-white/8 text-foreground border-l-2 border-pink-400"
                  : isOwnerHub
                    ? "text-pink-300/80 hover:text-foreground hover:bg-pink-500/8"
                    : "text-zinc-400 hover:text-foreground hover:bg-white/4"
              }`}
            >
              <Icon size={16} strokeWidth={1.6} />
              <span className="tracking-wide">{item.label}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-64 shrink-0 border-r border-white/8 bg-[#07080c] sticky top-0 h-screen">
        <Link
          href="/admin"
          className="flex items-center gap-3 px-5 py-5 border-b border-white/8"
        >
          <span className="relative w-9 h-9 inline-block shrink-0">
            <Image src="/HighLifeLogo.png" alt="" fill sizes="36px" className="object-contain" />
          </span>
          <div className="leading-tight">
            <div className="font-display text-sm tracking-[0.18em] uppercase">
              HighLife Live
            </div>
            <div className="text-[9px] tracking-[0.25em] uppercase text-zinc-500">
              Admin Console
            </div>
          </div>
        </Link>

        <nav className="flex-1 overflow-y-auto py-4">{navList()}</nav>

        <div className="border-t border-white/8 p-3">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm text-zinc-400 hover:text-foreground hover:bg-white/4 transition-colors"
          >
            <LogOut size={16} strokeWidth={1.6} />
            <span className="tracking-wide">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 py-3 bg-[#07080c]/95 backdrop-blur-xl border-b border-white/8">
        <Link href="/admin" className="flex items-center gap-2.5">
          <span className="relative w-8 h-8 inline-block shrink-0">
            <Image src="/HighLifeLogo.png" alt="" fill sizes="32px" className="object-contain" />
          </span>
          <div className="leading-tight">
            <div className="font-display text-xs tracking-[0.18em] uppercase">
              HighLife Live
            </div>
            <div className="text-[9px] tracking-[0.25em] uppercase text-zinc-500">
              Admin
            </div>
          </div>
        </Link>
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2.5 rounded-lg bg-white/4 border border-white/10 text-zinc-300 hover:text-foreground active:bg-white/10"
          aria-label="Open menu"
        >
          <Menu size={18} strokeWidth={1.8} />
        </button>
      </header>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="lg:hidden fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              key="drawer"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
              className="lg:hidden fixed top-0 left-0 z-50 w-72 max-w-[85vw] h-screen flex flex-col bg-[#07080c] border-r border-white/8"
            >
              <div className="flex items-center justify-between px-4 py-4 border-b border-white/8">
                <Link
                  href="/admin"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2.5"
                >
                  <span className="relative w-9 h-9 inline-block shrink-0">
                    <Image src="/HighLifeLogo.png" alt="" fill sizes="36px" className="object-contain" />
                  </span>
                  <div className="leading-tight">
                    <div className="font-display text-sm tracking-[0.18em] uppercase">
                      HighLife Live
                    </div>
                    <div className="text-[9px] tracking-[0.25em] uppercase text-zinc-500">
                      Admin Console
                    </div>
                  </div>
                </Link>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="p-2 rounded-lg text-zinc-400 hover:text-foreground hover:bg-white/4"
                  aria-label="Close menu"
                >
                  <X size={18} strokeWidth={1.8} />
                </button>
              </div>

              <nav className="flex-1 overflow-y-auto py-4">{navList(() => setMobileOpen(false))}</nav>

              <div className="border-t border-white/8 p-3">
                <button
                  onClick={() => {
                    setMobileOpen(false);
                    handleLogout();
                  }}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm text-zinc-400 hover:text-foreground hover:bg-white/4 transition-colors"
                >
                  <LogOut size={16} strokeWidth={1.6} />
                  <span className="tracking-wide">Sign Out</span>
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
