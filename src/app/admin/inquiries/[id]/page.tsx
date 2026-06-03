"use client";

import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Clock,
  Eye,
  Reply,
  CheckCircle,
  XCircle,
  Save,
  CalendarPlus,
  MessageSquare,
  EyeOff,
  Mail,
  Phone,
  MapPin,
  Music,
} from "lucide-react";
import { getAdminSession, isOwnerAdmin, type AdminSession } from "@/lib/admin-auth";

interface AdminInquiry {
  id: string;
  inquiryNumber: string;
  source: string;
  artistSlug: string;
  artistName: string;
  venueName: string;
  venueAddress: string;
  eventDate: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  eventDescription: string;
  messageToAgent: string;
  status: string;
  adminNotes: string | null;
  bookingOffer: string | null;
  venueLoginId: string | null;
  venueLoginLabel: string | null;
  convertedEventId: string | null;
  submittedAt: string;
  notes?: NoteRow[];
}

interface NoteRow {
  id: string;
  authorType: "venue" | "admin" | "internal";
  authorEmail: string;
  authorName: string;
  body: string;
  createdAt: string;
}

const STATUS_OPTIONS = ["New", "Reviewed", "Replied", "Booked", "Lost"] as const;

const statusBadge: Record<string, { color: string; bg: string; Icon: typeof Clock }> = {
  New:      { color: "text-amber-300",   bg: "bg-amber-400/10 border-amber-400/20",   Icon: Clock },
  Reviewed: { color: "text-sky-300",     bg: "bg-sky-400/10 border-sky-400/20",       Icon: Eye },
  Replied:  { color: "text-violet-300",  bg: "bg-violet-400/10 border-violet-400/20", Icon: Reply },
  Booked:   { color: "text-emerald-300", bg: "bg-emerald-400/10 border-emerald-400/20", Icon: CheckCircle },
  Lost:     { color: "text-rose-300",    bg: "bg-rose-400/10 border-rose-400/20",     Icon: XCircle },
};

export default function AdminInquiryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [session, setSession] = useState<AdminSession | null>(null);
  const [inquiry, setInquiry] = useState<AdminInquiry | null>(null);
  const [notes, setNotes] = useState<NoteRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [adminNoteDraft, setAdminNoteDraft] = useState("");
  const [bookingOfferDraft, setBookingOfferDraft] = useState("");
  const [internalNoteText, setInternalNoteText] = useState("");
  const [publicNoteText, setPublicNoteText] = useState("");
  const [finalizing, setFinalizing] = useState(false);
  const [postingNote, setPostingNote] = useState(false);

  useEffect(() => {
    setSession(getAdminSession());
  }, []);

  const load = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    try {
      const [iRes, nRes] = await Promise.all([
        fetch(`/api/admin/inquiries/${id}`, { headers: { "x-admin-email": session.email }, cache: "no-store" }),
        fetch(`/api/admin/inquiries/${id}/notes`, { headers: { "x-admin-email": session.email }, cache: "no-store" }),
      ]);
      if (!iRes.ok) {
        setInquiry(null);
        return;
      }
      const inq = (await iRes.json()) as AdminInquiry;
      const nts = nRes.ok ? ((await nRes.json()) as NoteRow[]) : [];
      setInquiry(inq);
      setNotes(nts);
      setAdminNoteDraft(inq.adminNotes ?? "");
      setBookingOfferDraft(inq.bookingOffer ?? "");
    } finally {
      setLoading(false);
    }
  }, [id, session]);

  useEffect(() => {
    if (session) load();
  }, [session, load]);

  const patch = async (data: Record<string, unknown>) => {
    if (!session) return;
    const res = await fetch(`/api/admin/inquiries/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "x-admin-email": session.email },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      const updated = (await res.json()) as AdminInquiry;
      setInquiry((prev) => (prev ? { ...prev, ...updated } : updated));
      setSavedAt(new Date());
    }
  };

  const updateStatus = (next: string) => patch({ status: next });
  const saveAdminMeta = () => patch({ adminNotes: adminNoteDraft, ...(isOwnerAdmin(session) ? { bookingOffer: bookingOfferDraft } : {}) });

  const postNote = async (internal: boolean) => {
    if (!session) return;
    const text = (internal ? internalNoteText : publicNoteText).trim();
    if (!text) return;
    setPostingNote(true);
    try {
      const res = await fetch(`/api/admin/inquiries/${id}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-email": session.email },
        body: JSON.stringify({ body: text, internal }),
      });
      if (res.ok) {
        const created = (await res.json()) as NoteRow;
        setNotes((prev) => [...prev, created]);
        if (internal) setInternalNoteText(""); else setPublicNoteText("");
      }
    } finally {
      setPostingNote(false);
    }
  };

  const finalize = async () => {
    if (!session || !inquiry) return;
    if (!isOwnerAdmin(session)) return;
    if (!confirm(`Finalize "${inquiry.artistName} at ${inquiry.venueName}" as a published event?\n\nMarks inquiry Booked, creates an Event row, and shows it on the public /events page.`)) {
      return;
    }
    setFinalizing(true);
    try {
      const res = await fetch(`/api/admin/inquiries/${id}/finalize`, {
        method: "POST",
        headers: { "x-admin-email": session.email, "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (data.ok && data.event) {
        await load();
        alert(`Event "${data.event.title}" published. View it at /admin/events.`);
      } else {
        alert(`Could not finalize: ${data.error ?? "unknown error"}`);
      }
    } finally {
      setFinalizing(false);
    }
  };

  if (loading || !inquiry) {
    return <div className="min-h-screen flex items-center justify-center text-sm text-zinc-500">{loading ? "Loading..." : "Inquiry not available."}</div>;
  }

  const sb = statusBadge[inquiry.status] ?? statusBadge.New;
  const StatusIcon = sb.Icon;
  const ownerAdmin = isOwnerAdmin(session);

  return (
    <div className="min-h-screen text-foreground">
      <div className="border-b border-white/8 px-4 sm:px-6 lg:px-10 py-6">
        <Link href="/admin/inquiries" className="inline-flex items-center gap-1.5 text-[10px] tracking-[0.18em] uppercase text-zinc-500 hover:text-foreground mb-3 transition-colors">
          <ArrowLeft size={12} /> Back to Inquiries
        </Link>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-[10px] tracking-[0.18em] uppercase text-zinc-500 font-mono mb-1">{inquiry.inquiryNumber} · {inquiry.source === "venue_partner" ? "Partner submission" : "Public submission"}</p>
            <h1 className="font-display uppercase text-2xl sm:text-3xl tracking-tight">{inquiry.artistName} <span className="text-zinc-500">at</span> {inquiry.venueName}</h1>
            {inquiry.venueLoginLabel && (
              <p className="text-xs text-zinc-400 mt-1">Partner: {inquiry.venueLoginLabel}</p>
            )}
          </div>
          <span className={`inline-flex items-center gap-1.5 text-[10px] tracking-[0.18em] uppercase rounded-full px-3 py-1.5 border ${sb.bg} ${sb.color}`}>
            <StatusIcon size={12} /> {inquiry.status}
          </span>
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-10 py-8 grid lg:grid-cols-3 gap-6 max-w-7xl">
        {/* Inquiry data + quick actions */}
        <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="lg:col-span-2 space-y-5">
          {/* Status + quick actions */}
          <div className="glass-card rounded-2xl p-5">
            <h2 className="text-[11px] tracking-[0.22em] uppercase text-zinc-300 mb-3">Quick Actions</h2>
            <div className="flex flex-wrap gap-2">
              {STATUS_OPTIONS.map((s) => {
                const SBI = statusBadge[s].Icon;
                return (
                  <button
                    key={s}
                    onClick={() => updateStatus(s)}
                    disabled={inquiry.status === s}
                    className={`inline-flex items-center gap-1.5 text-[10px] tracking-[0.18em] uppercase rounded-full px-3 py-1.5 border transition-colors ${
                      inquiry.status === s
                        ? `${statusBadge[s].bg} ${statusBadge[s].color} cursor-default`
                        : "border-white/10 hover:border-white/25 bg-black/40 text-zinc-300 hover:text-foreground"
                    }`}
                  >
                    <SBI size={11} /> {s === inquiry.status ? `is ${s}` : `Mark ${s}`}
                  </button>
                );
              })}
              {ownerAdmin && !inquiry.convertedEventId && (
                <button
                  onClick={finalize}
                  disabled={finalizing}
                  className="inline-flex items-center gap-2 text-[10px] tracking-[0.18em] uppercase rounded-full px-3 py-1.5 btn-gradient font-bold disabled:opacity-50"
                >
                  <CalendarPlus size={11} /> {finalizing ? "Finalizing..." : "Finalize as Event"}
                </button>
              )}
              {inquiry.convertedEventId && (
                <Link href={`/admin/events`} className="inline-flex items-center gap-2 text-[10px] tracking-[0.18em] uppercase rounded-full px-3 py-1.5 border border-emerald-500/30 bg-emerald-500/10 text-emerald-300">
                  <CheckCircle size={11} /> Event published — view
                </Link>
              )}
            </div>
            {savedAt && <p className="text-[10px] text-emerald-300 mt-3">Saved {savedAt.toLocaleTimeString()}</p>}
          </div>

          {/* Inquiry fields (read-only here; venue partner edits via portal) */}
          <div className="glass-card rounded-2xl p-5 space-y-4">
            <h2 className="text-[11px] tracking-[0.22em] uppercase text-zinc-300">Inquiry Details</h2>
            <div className="grid sm:grid-cols-2 gap-3 text-sm">
              <Info icon={Music} label="Artist Requested" value={inquiry.artistName} />
              <Info icon={Clock} label="Event Date" value={inquiry.eventDate || "—"} />
              <Info icon={MapPin} label="Venue" value={`${inquiry.venueName}${inquiry.venueAddress ? ` · ${inquiry.venueAddress}` : ""}`} />
              <Info icon={Mail} label="Contact" value={`${inquiry.contactName} · ${inquiry.contactEmail}`} />
              <Info icon={Phone} label="Phone" value={inquiry.contactPhone || "—"} />
              {ownerAdmin && inquiry.bookingOffer && (
                <Info icon={Mail} label="Opening Offer" value={inquiry.bookingOffer} />
              )}
            </div>
            <div className="pt-3 border-t border-white/5">
              <div className="text-[9px] tracking-[0.18em] uppercase text-zinc-600 mb-1">Event Description</div>
              <p className="text-sm text-zinc-200 whitespace-pre-wrap">{inquiry.eventDescription || "—"}</p>
            </div>
            <div>
              <div className="text-[9px] tracking-[0.18em] uppercase text-zinc-600 mb-1">Message from Venue</div>
              <p className="text-sm text-zinc-200 whitespace-pre-wrap">{inquiry.messageToAgent || "—"}</p>
            </div>
          </div>

          {/* Admin meta (private adminNotes + bookingOffer) */}
          <div className="glass-card rounded-2xl p-5 space-y-3">
            <h2 className="text-[11px] tracking-[0.22em] uppercase text-zinc-300 inline-flex items-center gap-2"><EyeOff size={12} /> Admin-only metadata</h2>
            {ownerAdmin && (
              <div>
                <label className="text-[10px] tracking-[0.18em] uppercase text-zinc-400 block mb-1.5">Opening Offer (venue never sees this)</label>
                <input
                  value={bookingOfferDraft}
                  onChange={(e) => setBookingOfferDraft(e.target.value)}
                  placeholder="$12,000 + travel"
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:border-pink-400/60"
                />
              </div>
            )}
            <div>
              <label className="text-[10px] tracking-[0.18em] uppercase text-zinc-400 block mb-1.5">Admin notes (private, free-form)</label>
              <textarea
                value={adminNoteDraft}
                onChange={(e) => setAdminNoteDraft(e.target.value)}
                rows={3}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:border-pink-400/60 resize-y"
              />
            </div>
            <button
              onClick={saveAdminMeta}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full btn-gradient text-[10px] tracking-[0.18em] uppercase font-bold"
            >
              <Save size={11} /> Save metadata
            </button>
          </div>
        </motion.section>

        {/* Notes thread (admin + venue + internal) */}
        <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.05 }} className="space-y-5">
          <div className="glass-card rounded-2xl p-5 space-y-3">
            <h2 className="text-[11px] tracking-[0.22em] uppercase text-zinc-300 inline-flex items-center gap-2">
              <MessageSquare size={12} /> Notes Thread ({notes.length})
            </h2>
            {notes.length === 0 ? (
              <p className="text-xs text-zinc-500 italic">No notes yet.</p>
            ) : (
              <ul className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                {notes.map((n) => (
                  <li key={n.id} className={`p-3 rounded-xl border ${
                    n.authorType === "venue"
                      ? "border-pink-400/15 bg-pink-400/5"
                      : n.authorType === "internal"
                      ? "border-amber-400/15 bg-amber-400/5"
                      : "border-sky-400/15 bg-sky-400/5"
                  }`}>
                    <div className="text-[10px] tracking-[0.18em] uppercase text-zinc-500 mb-1.5 flex items-center justify-between gap-2">
                      <span>
                        {n.authorType === "venue" ? "Venue" : n.authorType === "internal" ? "Internal" : "Admin"} · {n.authorName || n.authorEmail}
                      </span>
                      <span>{new Date(n.createdAt).toLocaleString()}</span>
                    </div>
                    <p className="text-sm text-zinc-200 whitespace-pre-wrap">{n.body}</p>
                  </li>
                ))}
              </ul>
            )}

            <div className="pt-3 border-t border-white/5 space-y-3">
              <div>
                <label className="text-[10px] tracking-[0.18em] uppercase text-zinc-400 block mb-1.5">Reply to venue (they see this)</label>
                <textarea
                  value={publicNoteText}
                  onChange={(e) => setPublicNoteText(e.target.value)}
                  rows={3}
                  placeholder="Write a reply visible to the venue partner..."
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:border-pink-400/60 resize-y mb-2"
                />
                <button
                  onClick={() => postNote(false)}
                  disabled={postingNote || !publicNoteText.trim()}
                  className="px-3 py-1.5 rounded-full btn-gradient text-[10px] tracking-[0.18em] uppercase font-bold disabled:opacity-50"
                >
                  {postingNote ? "Posting..." : "Post Reply"}
                </button>
              </div>

              <div>
                <label className="text-[10px] tracking-[0.18em] uppercase text-zinc-400 block mb-1.5 inline-flex items-center gap-1"><EyeOff size={10} /> Internal note (admin-only)</label>
                <textarea
                  value={internalNoteText}
                  onChange={(e) => setInternalNoteText(e.target.value)}
                  rows={2}
                  placeholder="Team-only memo, hidden from venue..."
                  className="w-full bg-black/40 border border-amber-400/20 rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:border-amber-400/50 resize-y mb-2"
                />
                <button
                  onClick={() => postNote(true)}
                  disabled={postingNote || !internalNoteText.trim()}
                  className="px-3 py-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 hover:border-amber-500/60 text-amber-200 text-[10px] tracking-[0.18em] uppercase font-bold disabled:opacity-50"
                >
                  {postingNote ? "Posting..." : "Post Internal"}
                </button>
              </div>
            </div>
          </div>
        </motion.section>
      </div>
    </div>
  );
}

function Info({ icon: Icon, label, value }: { icon: typeof Clock; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon size={14} className="text-pink-300 mt-0.5 shrink-0" />
      <div className="min-w-0">
        <div className="text-[9px] tracking-[0.18em] uppercase text-zinc-600 mb-0.5">{label}</div>
        <div className="text-zinc-200 truncate">{value}</div>
      </div>
    </div>
  );
}
