"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  MessageSquare,
  Search,
  RefreshCw,
  Clock,
  Eye,
  Reply,
  CheckCircle,
  XCircle,
  Archive,
  FileText,
  Briefcase,
} from "lucide-react";
import { getAdminSession, type AdminSession } from "@/lib/admin-auth";

interface InquiryRow {
  id: string;
  inquiryNumber: string;
  source: string;
  artistName: string;
  venueName: string;
  venueLoginId: string | null;
  venueLoginLabel: string | null;
  contactName: string;
  contactEmail: string;
  eventDate: string;
  status: string;
  bookingOffer?: string | null;
  submittedAt: string;
}

const statuses = ["All", "New", "Reviewed", "Replied", "Working", "Contract Sent", "Submitted", "Archived"] as const;
const sources = ["All", "public", "venue_partner"] as const;

const statusColor: Record<string, string> = {
  New: "text-amber-300 bg-amber-400/10 border-amber-400/20",
  Reviewed: "text-sky-300 bg-sky-400/10 border-sky-400/20",
  Replied: "text-violet-300 bg-violet-400/10 border-violet-400/20",
  Working: "text-fuchsia-300 bg-fuchsia-400/10 border-fuchsia-400/20",
  "Contract Sent": "text-cyan-300 bg-cyan-400/10 border-cyan-400/20",
  Submitted: "text-emerald-300 bg-emerald-400/10 border-emerald-400/20",
  Archived: "text-zinc-400 bg-zinc-400/10 border-zinc-400/20",
  Lost: "text-zinc-400 bg-zinc-400/10 border-zinc-400/20",
};

const statusIcon: Record<string, typeof Clock> = {
  New: Clock,
  Reviewed: Eye,
  Replied: Reply,
  Working: Briefcase,
  "Contract Sent": FileText,
  Submitted: CheckCircle,
  Archived: Archive,
  Lost: XCircle,
};

// Format YYYY-MM-DD → MM/DD/YY per brief Scope 4.
function formatInquiryDate(d: string): string {
  if (!d) return "-";
  const m = d.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[2]}/${m[3]}/${m[1].slice(2)}`;
  return d;
}

const sourceLabel: Record<string, string> = {
  public: "Public",
  venue_partner: "Partner",
};

const sourceColor: Record<string, string> = {
  public: "text-zinc-400 bg-zinc-500/10 border-zinc-500/20",
  venue_partner: "text-emerald-300 bg-emerald-400/10 border-emerald-400/20",
};

export default function AdminInquiriesPage() {
  const router = useRouter();
  const [session, setSession] = useState<AdminSession | null>(null);
  const [inquiries, setInquiries] = useState<InquiryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const [sourceFilter, setSourceFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [showArchived, setShowArchived] = useState(false);

  useEffect(() => {
    setSession(getAdminSession());
  }, []);

  const fetchInquiries = () => {
    if (!session) return;
    setLoading(true);
    const params = new URLSearchParams();
    if (sourceFilter !== "All") params.set("source", sourceFilter);
    if (filter !== "All") params.set("status", filter);
    if (showArchived) params.set("includeArchived", "1");
    fetch(`/api/admin/inquiries?${params}`, {
      headers: { "x-admin-email": session.email },
    })
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setInquiries(Array.isArray(data) ? data : []))
      .catch(() => setInquiries([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (session) fetchInquiries();
  }, [session, filter, sourceFilter, showArchived]); // eslint-disable-line react-hooks/exhaustive-deps

  const newCount = inquiries.filter((i) => i.status === "New").length;

  const filtered = inquiries.filter((i) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      i.artistName.toLowerCase().includes(s) ||
      i.venueName.toLowerCase().includes(s) ||
      i.contactName.toLowerCase().includes(s) ||
      i.contactEmail.toLowerCase().includes(s) ||
      i.inquiryNumber.toLowerCase().includes(s)
    );
  });

  return (
    <div className="min-h-screen text-foreground">
      <div className="border-b border-white/8 px-4 sm:px-6 lg:px-10 py-6">
        <p className="text-[10px] tracking-[0.3em] uppercase text-zinc-500 mb-1">
          HighLife Live · Inquiry Pipeline
        </p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="font-display uppercase text-3xl tracking-tight">
              Inquiries
            </h1>
            {newCount > 0 && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] tracking-[0.18em] uppercase font-bold bg-pink-500/20 text-pink-300 border border-pink-500/30">
                {newCount} new
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowArchived((v) => !v)}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border text-[10px] tracking-[0.18em] uppercase transition-colors ${
                showArchived
                  ? "border-zinc-400/40 bg-zinc-400/10 text-zinc-200"
                  : "border-white/8 hover:border-white/20 bg-white/4 hover:bg-white/8 text-zinc-400 hover:text-foreground"
              }`}
              title={showArchived ? "Hide archived inquiries" : "Show archived inquiries"}
            >
              <Archive size={12} />
              {showArchived ? "Archived: shown" : "Show archived"}
            </button>
            <button
              onClick={fetchInquiries}
              className="p-2.5 rounded-xl border border-white/8 hover:border-white/20 bg-white/4 hover:bg-white/8 text-zinc-400 hover:text-foreground transition-colors"
              title="Refresh"
            >
              <RefreshCw size={14} />
            </button>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-10 py-6 space-y-6">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              placeholder="Search by artist, venue, contact, or inquiry number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white/4 border border-white/8 text-sm text-foreground placeholder:text-zinc-500 focus:outline-none focus:border-pink-500/40"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-[9px] tracking-[0.18em] uppercase text-zinc-600 mr-1">Status:</span>
          {statuses.map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`chip cursor-pointer ${filter === s ? "!bg-white/12 !text-foreground !border-white/20" : ""}`}
            >
              {s}
            </button>
          ))}
          <span className="text-[9px] tracking-[0.18em] uppercase text-zinc-600 ml-3 mr-1">Source:</span>
          {sources.map((s) => (
            <button
              key={s}
              onClick={() => setSourceFilter(s)}
              className={`chip cursor-pointer ${sourceFilter === s ? "!bg-white/12 !text-foreground !border-white/20" : ""}`}
            >
              {s === "All" ? "All" : sourceLabel[s] || s}
            </button>
          ))}
        </div>

        <p className="text-[10px] tracking-[0.18em] uppercase text-zinc-500">
          {filtered.length} inquir{filtered.length === 1 ? "y" : "ies"}
        </p>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <span className="text-[10px] tracking-[0.3em] uppercase text-zinc-500">Loading...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="glass-card rounded-2xl p-12 text-center">
            <MessageSquare size={32} strokeWidth={1} className="text-zinc-600 mx-auto mb-4" />
            <p className="text-sm text-zinc-400">No inquiries match your filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/8">
                  <th className="text-left text-[9px] tracking-[0.18em] uppercase text-zinc-600 pb-3 px-2.5 sm:px-4 font-medium">Number</th>
                  <th className="text-left text-[9px] tracking-[0.18em] uppercase text-zinc-600 pb-3 px-2.5 sm:px-4 font-medium">Artist</th>
                  <th className="text-left text-[9px] tracking-[0.18em] uppercase text-zinc-600 pb-3 px-2.5 sm:px-4 font-medium hidden md:table-cell">Venue</th>
                  <th className="text-left text-[9px] tracking-[0.18em] uppercase text-zinc-600 pb-3 px-2.5 sm:px-4 font-medium hidden lg:table-cell">Contact</th>
                  <th className="text-left text-[9px] tracking-[0.18em] uppercase text-zinc-600 pb-3 px-2.5 sm:px-4 font-medium hidden lg:table-cell">Event Date</th>
                  <th className="text-left text-[9px] tracking-[0.18em] uppercase text-zinc-600 pb-3 px-2.5 sm:px-4 font-medium hidden xl:table-cell">Offer</th>
                  <th className="text-left text-[9px] tracking-[0.18em] uppercase text-zinc-600 pb-3 px-2.5 sm:px-4 font-medium">Status</th>
                  <th className="text-left text-[9px] tracking-[0.18em] uppercase text-zinc-600 pb-3 px-2.5 sm:px-4 font-medium">Source</th>
                  <th className="text-left text-[9px] tracking-[0.18em] uppercase text-zinc-600 pb-3 px-2.5 sm:px-4 font-medium hidden lg:table-cell">Submitted</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((inq, i) => {
                  const StatusIcon = statusIcon[inq.status] || Clock;
                  return (
                    <motion.tr
                      key={inq.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: i * 0.02 }}
                      onClick={() => router.push(`/admin/inquiries/${inq.id}`)}
                      className="border-b border-white/4 hover:bg-white/[0.04] transition-colors cursor-pointer"
                    >
                      <td className="py-3 px-2.5 sm:px-4">
                        <span className="text-[11px] text-zinc-300 font-mono">{inq.inquiryNumber}</span>
                      </td>
                      <td className="py-3 px-2.5 sm:px-4 text-foreground font-medium">{inq.artistName}</td>
                      <td className="py-3 px-2.5 sm:px-4 text-zinc-300 hidden md:table-cell">{inq.venueName}</td>
                      <td className="py-3 px-2.5 sm:px-4 hidden lg:table-cell">
                        <div className="text-zinc-300">{inq.contactName}</div>
                        <div className="text-[11px] text-zinc-500">{inq.contactEmail}</div>
                      </td>
                      <td className="py-3 px-2.5 sm:px-4 text-zinc-300 hidden lg:table-cell">{formatInquiryDate(inq.eventDate)}</td>
                      <td className="py-3 px-2.5 sm:px-4 text-zinc-300 hidden xl:table-cell">{inq.bookingOffer || "-"}</td>
                      <td className="py-3 px-2.5 sm:px-4">
                        <span className={`inline-flex items-center gap-1.5 text-[9px] tracking-[0.18em] uppercase font-semibold border rounded-full px-2.5 py-0.5 ${statusColor[inq.status] || "text-zinc-400"}`}>
                          <StatusIcon size={10} />
                          {inq.status}
                        </span>
                      </td>
                      <td className="py-3 px-2.5 sm:px-4">
                        <div className="flex flex-col gap-1">
                          <span className={`inline-block w-fit text-[9px] tracking-[0.18em] uppercase border rounded-full px-2 py-0.5 ${sourceColor[inq.source] || sourceColor.public}`}>
                            {sourceLabel[inq.source] || inq.source}
                          </span>
                          {inq.venueLoginLabel && (
                            <span className="text-[10px] text-zinc-400 truncate max-w-[180px]" title={inq.venueLoginLabel}>
                              {inq.venueLoginLabel}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-2.5 sm:px-4 text-zinc-500 text-xs hidden lg:table-cell">
                        {new Date(inq.submittedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
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
