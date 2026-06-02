"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
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
} from "lucide-react";
import { adminLogout, canViewAuditions, getAdminSession, type AdminSession } from "@/lib/admin-auth";

const nav = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/bookings", label: "Bookings", icon: Inbox },
  { href: "/admin/auditions", label: "Auditions", icon: Mic },
  { href: "/admin/artists", label: "Artists", icon: Users },
  { href: "/admin/venues", label: "Venues", icon: MapPinned },
  { href: "/admin/campaigns", label: "Campaigns", icon: Megaphone },
  { href: "/admin/pipeline", label: "Pipeline", icon: KanbanSquare },
  { href: "/admin/epks", label: "EPKs", icon: FileImage },
  { href: "/admin/research", label: "Research Queue", icon: ClipboardList },
  { href: "/admin/reports", label: "Reports", icon: BarChart3 },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [session, setSession] = useState<AdminSession | null>(null);

  useEffect(() => {
    setSession(getAdminSession());
  }, []);

  const handleLogout = () => {
    adminLogout();
    router.push("/admin/login");
  };

  const visibleNav = nav.filter((item) => item.href !== "/admin/auditions" || canViewAuditions(session));

  return (
    <aside className="hidden lg:flex flex-col w-64 shrink-0 border-r border-white/8 bg-[#07080c] sticky top-0 h-screen">
      <Link
        href="/admin"
        className="flex items-center gap-3 px-5 py-5 border-b border-white/8"
      >
        <span className="relative w-9 h-9 inline-block shrink-0">
          <Image src="/logo.png" alt="" fill sizes="36px" className="object-contain" />
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

      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-0.5 px-2">
          {visibleNav.map((item) => {
            const Icon = item.icon;
            const active =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname?.startsWith(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                    active
                      ? "bg-white/8 text-foreground border-l-2 border-pink-400"
                      : "text-zinc-400 hover:text-foreground hover:bg-white/4"
                  }`}
                >
                  <Icon size={15} strokeWidth={1.6} />
                  <span className="tracking-wide">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-white/8 p-3">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-zinc-400 hover:text-foreground hover:bg-white/4 transition-colors"
        >
          <LogOut size={15} strokeWidth={1.6} />
          <span className="tracking-wide">Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
