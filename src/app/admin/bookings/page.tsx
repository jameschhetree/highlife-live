"use client";

// /admin/bookings — operational booking list (Phase 3.9 Scope 5).
// Visible to all agents (no AgentStagedNotice). Agents see only bookings on
// their assigned artists; owners see all. Status column removed per Liam's
// "Booking.status retired as workflow truth" lock.

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Inbox, Search, RefreshCw, Plus } from "lucide-react";
import { getAdminSession, type AdminSession } from "@/lib/admin-auth";

interface BookingRow {
  id: string;
  artistName: string;
  artistId: string | null;
  venueName: string;
  venueAddress: string;
  venueId: string | null;
  eventDate: string;
  eventTitle: string | null;
  finalOffer: string | null;
  proposedOffer: string;
  ticketUrl: string | null;
  ticketsSold: number;
  contactName: string;
  contactEmail: string;
  inquiryId: string | null;
  eventId: string | null;
  source: string;
  submittedAt: string;
  canOpen: boolean;
}

function formatDate(d: string): string {
  if (!d) return "—";
  const m = d.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[2]}/${m[3]}/${m[1].slice(2)}`;
  return d;
}

export default function AdminBookingsPage() {
  const router = useRouter();
  const [session, setSession] = useState<AdminSession | null>(null);
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    setSession(getAdminSession());
  }, []);

  const fetchBookings = () => {
    if (!session) return;
    setLoading(true);
    fetch("/api/admin/bookings", { headers: { "x-admin-email": session.email } })
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setBookings(Array.isArray(data) ? data : []))
      .catch(() => setBookings([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (session) fetchBookings();
  }, [session]); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = bookings.filter((b) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      b.artistName.toLowerCase().includes(s) ||
      b.venueName.toLowerCase().includes(s) ||
      (b.eventTitle ?? "").toLowerCase().includes(s) ||
      b.contactName.toLowerCase().includes(s) ||
      b.contactEmail.toLowerCase().includes(s)
    );
  });

  return (
    <div className="min-h-screen text-foreground">
      <div className="border-b border-white/8 px-4 sm:px-6 lg:px-10 py-6">
        <p className="text-[10px] tracking-[0.3em] uppercase text-zinc-500 mb-1">
          HighLife Live · Operational Bookings
        </p>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h1 className="font-display uppercase text-3xl tracking-tight">Bookings</h1>
          <div className="flex items-center gap-2">
            <Link
              href="/admin/bookings/new"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl btn-gradient text-[10px] tracking-[0.18em] uppercase font-bold"
            >
              <Plus size={12} /> New Booking
            </Link>
            <button
              onClick={fetchBookings}
              className="p-2.5 rounded-xl border border-white/8 hover:border-white/20 bg-white/4 hover:bg-white/8 text-zinc-400 hover:text-foreground transition-colors"
              title="Refresh"
            >
              <RefreshCw size={14} />
            </button>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-10 py-6 space-y-6">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Search artist, venue, event title, or contact..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white/4 border border-white/8 text-sm text-foreground placeholder:text-zinc-500 focus:outline-none focus:border-pink-500/40"
          />
        </div>

        <p className="text-[10px] tracking-[0.18em] uppercase text-zinc-500">
          {filtered.length} booking{filtered.length === 1 ? "" : "s"}
        </p>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <span className="text-[10px] tracking-[0.3em] uppercase text-zinc-500">Loading...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="glass-card rounded-2xl p-12 text-center">
            <Inbox size={32} strokeWidth={1} className="text-zinc-600 mx-auto mb-4" />
            <p className="text-sm text-zinc-400">No bookings yet. Create one from a booked inquiry or directly via &ldquo;New Booking.&rdquo;</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/8">
                  <th className="text-left text-[9px] tracking-[0.18em] uppercase text-zinc-600 pb-3 px-2.5 sm:px-4 font-medium">Event Title</th>
                  <th className="text-left text-[9px] tracking-[0.18em] uppercase text-zinc-600 pb-3 px-2.5 sm:px-4 font-medium">Artist</th>
                  <th className="text-left text-[9px] tracking-[0.18em] uppercase text-zinc-600 pb-3 px-2.5 sm:px-4 font-medium hidden md:table-cell">Venue</th>
                  <th className="text-left text-[9px] tracking-[0.18em] uppercase text-zinc-600 pb-3 px-2.5 sm:px-4 font-medium">Date</th>
                  <th className="text-left text-[9px] tracking-[0.18em] uppercase text-zinc-600 pb-3 px-2.5 sm:px-4 font-medium hidden lg:table-cell">Final Offer</th>
                  <th className="text-left text-[9px] tracking-[0.18em] uppercase text-zinc-600 pb-3 px-2.5 sm:px-4 font-medium hidden lg:table-cell">Tix Sold</th>
                  <th className="text-left text-[9px] tracking-[0.18em] uppercase text-zinc-600 pb-3 px-2.5 sm:px-4 font-medium">Public</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((b, i) => (
                  <motion.tr
                    key={b.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: i * 0.015 }}
                    onClick={() => router.push(`/admin/bookings/${b.id}`)}
                    className="border-b border-white/4 hover:bg-white/[0.04] transition-colors cursor-pointer"
                  >
                    <td className="py-3 px-2.5 sm:px-4 text-foreground font-medium">
                      {b.eventTitle || <span className="text-zinc-500 italic">Untitled</span>}
                    </td>
                    <td className="py-3 px-2.5 sm:px-4 text-zinc-200">{b.artistName}</td>
                    <td className="py-3 px-2.5 sm:px-4 text-zinc-300 hidden md:table-cell break-words">{b.venueName}</td>
                    <td className="py-3 px-2.5 sm:px-4 text-zinc-300">{formatDate(b.eventDate)}</td>
                    <td className="py-3 px-2.5 sm:px-4 text-zinc-300 hidden lg:table-cell">{b.finalOffer || b.proposedOffer || "—"}</td>
                    <td className="py-3 px-2.5 sm:px-4 text-zinc-300 hidden lg:table-cell">{b.ticketsSold}</td>
                    <td className="py-3 px-2.5 sm:px-4">
                      {b.eventId ? (
                        <span className="inline-block w-fit text-[9px] tracking-[0.18em] uppercase border rounded-full px-2 py-0.5 text-emerald-300 bg-emerald-400/10 border-emerald-400/20">
                          Promoted
                        </span>
                      ) : (
                        <span className="text-[9px] text-zinc-500 italic">internal</span>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
