"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Inbox,
  Search,
  Clock,
  Eye,
  Reply,
  CheckCircle,
  XCircle,
  ArrowRight,
  RefreshCw,
} from "lucide-react";

interface BookingRow {
  id: string;
  artistName: string;
  venueName: string;
  contactName: string;
  contactEmail: string;
  eventDate: string;
  status: string;
  source: string;
  submittedAt: string;
}

const statuses = ["All", "New", "Reviewed", "Replied", "Booked", "Lost"] as const;

const statusColor: Record<string, string> = {
  New: "text-amber-300 bg-amber-400/10 border-amber-400/20",
  Reviewed: "text-sky-300 bg-sky-400/10 border-sky-400/20",
  Replied: "text-violet-300 bg-violet-400/10 border-violet-400/20",
  Booked: "text-emerald-300 bg-emerald-400/10 border-emerald-400/20",
  Lost: "text-zinc-400 bg-zinc-400/10 border-zinc-400/20",
};

const statusIcon: Record<string, typeof Clock> = {
  New: Clock,
  Reviewed: Eye,
  Replied: Reply,
  Booked: CheckCircle,
  Lost: XCircle,
};

const sourceColor: Record<string, string> = {
  public: "text-zinc-400 bg-zinc-500/10 border-zinc-500/20",
  authenticated: "text-emerald-300 bg-emerald-400/10 border-emerald-400/20",
};

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("All");
  const [search, setSearch] = useState("");

  const fetchBookings = () => {
    setLoading(true);
    fetch("/api/bookings")
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setBookings(data))
      .catch(() => setBookings([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const newCount = bookings.filter((b) => b.status === "New").length;

  const filtered = bookings.filter((b) => {
    const matchesFilter = filter === "All" || b.status === filter;
    const matchesSearch =
      !search ||
      b.artistName.toLowerCase().includes(search.toLowerCase()) ||
      b.venueName.toLowerCase().includes(search.toLowerCase()) ||
      b.contactName.toLowerCase().includes(search.toLowerCase()) ||
      b.contactEmail.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="min-h-screen text-foreground">
      {/* Header */}
      <div className="border-b border-white/8 px-6 lg:px-10 py-6">
        <p className="text-[10px] tracking-[0.3em] uppercase text-zinc-500 mb-1">
          HighLife Live · Booking Pipeline
        </p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="font-display uppercase text-3xl tracking-tight">
              Bookings
            </h1>
            {newCount > 0 && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] tracking-[0.18em] uppercase font-bold bg-pink-500/20 text-pink-300 border border-pink-500/30">
                {newCount} new
              </span>
            )}
          </div>
          <button
            onClick={fetchBookings}
            className="p-2.5 rounded-xl border border-white/8 hover:border-white/20 bg-white/4 hover:bg-white/8 text-zinc-400 hover:text-foreground transition-colors"
            title="Refresh"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="px-6 lg:px-10 py-6 space-y-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
            />
            <input
              type="text"
              placeholder="Search by artist, venue, or contact..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white/4 border border-white/8 text-sm text-foreground placeholder:text-zinc-500 focus:outline-none focus:border-pink-500/40"
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {statuses.map((s) => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`chip cursor-pointer ${
                  filter === s
                    ? "!bg-white/12 !text-foreground !border-white/20"
                    : ""
                }`}
              >
                {s}
                {s === "New" && newCount > 0 && (
                  <span className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full bg-pink-500/30 text-[9px] font-bold text-pink-200">
                    {newCount}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        <p className="text-[10px] tracking-[0.18em] uppercase text-zinc-500">
          {filtered.length} booking{filtered.length !== 1 ? "s" : ""}
        </p>

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <span className="text-[10px] tracking-[0.3em] uppercase text-zinc-500">
              Loading...
            </span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="glass-card rounded-2xl p-12 text-center">
            <Inbox
              size={32}
              strokeWidth={1}
              className="text-zinc-600 mx-auto mb-4"
            />
            <p className="text-sm text-zinc-400">
              {bookings.length === 0
                ? "No booking inquiries yet."
                : "No bookings match your filters."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/8">
                  <th className="text-left text-[9px] tracking-[0.18em] uppercase text-zinc-600 pb-3 pr-4 font-medium">
                    Artist
                  </th>
                  <th className="text-left text-[9px] tracking-[0.18em] uppercase text-zinc-600 pb-3 pr-4 font-medium">
                    Venue
                  </th>
                  <th className="text-left text-[9px] tracking-[0.18em] uppercase text-zinc-600 pb-3 pr-4 font-medium">
                    Contact
                  </th>
                  <th className="text-left text-[9px] tracking-[0.18em] uppercase text-zinc-600 pb-3 pr-4 font-medium">
                    Event Date
                  </th>
                  <th className="text-left text-[9px] tracking-[0.18em] uppercase text-zinc-600 pb-3 pr-4 font-medium">
                    Status
                  </th>
                  <th className="text-left text-[9px] tracking-[0.18em] uppercase text-zinc-600 pb-3 pr-4 font-medium">
                    Source
                  </th>
                  <th className="text-left text-[9px] tracking-[0.18em] uppercase text-zinc-600 pb-3 pr-4 font-medium">
                    Submitted
                  </th>
                  <th className="pb-3"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((b, i) => {
                  const StatusIcon = statusIcon[b.status] || Clock;
                  return (
                    <motion.tr
                      key={b.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        duration: 0.3,
                        delay: i * 0.03,
                        ease: [0.32, 0.72, 0, 1],
                      }}
                      className="border-b border-white/4 hover:bg-white/[0.02] transition-colors group"
                    >
                      <td className="py-3.5 pr-4">
                        <span className="text-foreground font-medium">
                          {b.artistName}
                        </span>
                      </td>
                      <td className="py-3.5 pr-4 text-zinc-300">
                        {b.venueName}
                      </td>
                      <td className="py-3.5 pr-4">
                        <div className="text-zinc-300">{b.contactName}</div>
                        <div className="text-[11px] text-zinc-500">
                          {b.contactEmail}
                        </div>
                      </td>
                      <td className="py-3.5 pr-4 text-zinc-300">
                        {b.eventDate || "-"}
                      </td>
                      <td className="py-3.5 pr-4">
                        <span
                          className={`inline-flex items-center gap-1.5 text-[9px] tracking-[0.18em] uppercase font-semibold border rounded-full px-2.5 py-0.5 ${
                            statusColor[b.status] || "text-zinc-400"
                          }`}
                        >
                          <StatusIcon size={10} />
                          {b.status}
                        </span>
                      </td>
                      <td className="py-3.5 pr-4">
                        <span
                          className={`text-[9px] tracking-[0.18em] uppercase border rounded-full px-2 py-0.5 ${
                            sourceColor[b.source] || sourceColor.public
                          }`}
                        >
                          {b.source === "authenticated" ? "Signed In" : "Public"}
                        </span>
                      </td>
                      <td className="py-3.5 pr-4 text-zinc-500 text-xs">
                        {new Date(b.submittedAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </td>
                      <td className="py-3.5">
                        <Link
                          href={`/admin/bookings/${b.id}`}
                          className="opacity-0 group-hover:opacity-100 transition-opacity inline-flex items-center gap-1 text-[10px] tracking-[0.18em] uppercase text-zinc-400 hover:text-foreground"
                        >
                          View
                          <ArrowRight size={10} />
                        </Link>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
