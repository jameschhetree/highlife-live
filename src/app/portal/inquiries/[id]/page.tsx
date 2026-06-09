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
  MessageSquare,
  Lock,
} from "lucide-react";
import { isAuthenticated } from "@/lib/auth";

interface InquiryDetail {
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
  submittedAt: string;
  convertedEventId: string | null;
}

interface NoteRow {
  id: string;
  authorType: "venue" | "admin" | "internal";
  authorEmail: string;
  authorName: string;
  body: string;
  createdAt: string;
}

const statusBadge: Record<string, { color: string; bg: string; Icon: typeof Clock }> = {
  New:      { color: "text-amber-300",   bg: "bg-amber-400/10 border-amber-400/20",   Icon: Clock },
  Reviewed: { color: "text-sky-300",     bg: "bg-sky-400/10 border-sky-400/20",       Icon: Eye },
  Replied:  { color: "text-violet-300",  bg: "bg-violet-400/10 border-violet-400/20", Icon: Reply },
  Booked:   { color: "text-emerald-300", bg: "bg-emerald-400/10 border-emerald-400/20", Icon: CheckCircle },
  Lost:     { color: "text-rose-300",    bg: "bg-rose-400/10 border-rose-400/20",     Icon: XCircle },
};

export default function PortalInquiryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [authed, setAuthed] = useState(false);
  const [checking, setChecking] = useState(true);
  const [inquiry, setInquiry] = useState<InquiryDetail | null>(null);
  const [notes, setNotes] = useState<NoteRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit form (only editable fields)
  const [form, setForm] = useState({
    venueName: "",
    venueAddress: "",
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    eventDescription: "",
    messageToAgent: "",
  });
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  // Note composer
  const [noteText, setNoteText] = useState("");
  const [postingNote, setPostingNote] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace("/login");
      return;
    }
    setAuthed(true);
    setChecking(false);
  }, [router]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [iRes, nRes] = await Promise.all([
        fetch(`/api/inquiries/${id}`, { cache: "no-store", credentials: "include" }),
        fetch(`/api/inquiries/${id}/notes`, { cache: "no-store", credentials: "include" }),
      ]);
      if (iRes.status === 404 || iRes.status === 401) {
        setError("Inquiry not found or not yours.");
        setInquiry(null);
        setNotes([]);
        return;
      }
      const inq = (await iRes.json()) as InquiryDetail;
      const nts = (await nRes.json()) as NoteRow[];
      setInquiry(inq);
      setNotes(Array.isArray(nts) ? nts : []);
      setForm({
        venueName: inq.venueName ?? "",
        venueAddress: inq.venueAddress ?? "",
        contactName: inq.contactName ?? "",
        contactEmail: inq.contactEmail ?? "",
        contactPhone: inq.contactPhone ?? "",
        eventDescription: inq.eventDescription ?? "",
        messageToAgent: inq.messageToAgent ?? "",
      });
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (authed) load();
  }, [authed, load]);

  const handleSave = async () => {
    if (!inquiry) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/inquiries/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(form),
      });
      if (res.ok) {
        const updated = (await res.json()) as InquiryDetail;
        setInquiry(updated);
        setSavedAt(new Date());
      }
    } finally {
      setSaving(false);
    }
  };

  const handlePostNote = async () => {
    const t = noteText.trim();
    if (!t) return;
    setPostingNote(true);
    try {
      const res = await fetch(`/api/inquiries/${id}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ body: t }),
      });
      if (res.ok) {
        const created = (await res.json()) as NoteRow;
        setNotes((prev) => [...prev, created]);
        setNoteText("");
      }
    } finally {
      setPostingNote(false);
    }
  };

  if (checking || (loading && !inquiry)) {
    return <div className="min-h-screen flex items-center justify-center text-sm text-zinc-500">Loading...</div>;
  }
  if (error || !inquiry) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="font-display text-2xl uppercase mb-2">Not Available</h1>
          <p className="text-sm text-zinc-400 mb-4">{error || "This inquiry isn't visible from your account."}</p>
          <Link href="/portal" className="text-pink-300 text-sm hover:underline">Back to Portal</Link>
        </div>
      </div>
    );
  }

  const sb = statusBadge[inquiry.status] ?? statusBadge.New;
  const StatusIcon = sb.Icon;
  const isFinalized = inquiry.status === "Booked" || inquiry.status === "Lost" || !!inquiry.convertedEventId;

  return (
    <div className="min-h-screen text-foreground">
      <div className="border-b border-white/8 px-4 sm:px-6 lg:px-10 py-6">
        <Link href="/portal" className="inline-flex items-center gap-1.5 text-[10px] tracking-[0.18em] uppercase text-zinc-500 hover:text-foreground mb-3 transition-colors">
          <ArrowLeft size={12} /> Back to Portal
        </Link>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-[10px] tracking-[0.18em] uppercase text-zinc-500 font-mono mb-1">{inquiry.inquiryNumber}</p>
            <h1 className="font-display uppercase text-2xl sm:text-3xl tracking-tight">{inquiry.artistName} <span className="text-zinc-500">at</span> {inquiry.venueName}</h1>
          </div>
          <span className={`inline-flex items-center gap-1.5 text-[10px] tracking-[0.18em] uppercase rounded-full px-3 py-1.5 border ${sb.bg} ${sb.color}`}>
            <StatusIcon size={12} /> {inquiry.status}
          </span>
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-10 py-8 grid lg:grid-cols-3 gap-6 max-w-6xl">
        {/* Editable details */}
        <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="lg:col-span-2 space-y-5">
          <div className="glass-card rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-[11px] tracking-[0.22em] uppercase text-zinc-300">Inquiry Details</h2>
              {savedAt && <span className="text-[10px] text-emerald-300">Saved {savedAt.toLocaleTimeString()}</span>}
            </div>

            {/* Read-only locked fields */}
            <div className="grid sm:grid-cols-3 gap-3 p-3 rounded-xl bg-black/30 border border-white/5">
              <div>
                <div className="text-[9px] tracking-[0.18em] uppercase text-zinc-600 mb-1 inline-flex items-center gap-1"><Lock size={9} /> Event Date</div>
                <div className="text-sm text-zinc-300">{inquiry.eventDate || "—"}</div>
              </div>
              <div>
                <div className="text-[9px] tracking-[0.18em] uppercase text-zinc-600 mb-1 inline-flex items-center gap-1"><Lock size={9} /> Requested Artist</div>
                <div className="text-sm text-zinc-300">{inquiry.artistName}</div>
              </div>
              <div>
                <div className="text-[9px] tracking-[0.18em] uppercase text-zinc-600 mb-1 inline-flex items-center gap-1"><Lock size={9} /> Offer Status</div>
                <div className="text-sm text-zinc-400">Coordinated with HighLife</div>
              </div>
            </div>

            {/* Editable fields */}
            <fieldset disabled={isFinalized} className="space-y-4 disabled:opacity-60">
              <div className="grid sm:grid-cols-2 gap-3">
                <Field label="Venue Name" value={form.venueName} onChange={(v) => setForm((f) => ({ ...f, venueName: v }))} />
                <Field label="Venue Address" value={form.venueAddress} onChange={(v) => setForm((f) => ({ ...f, venueAddress: v }))} />
                <Field label="Contact Name" value={form.contactName} onChange={(v) => setForm((f) => ({ ...f, contactName: v }))} />
                <Field label="Contact Email" type="email" value={form.contactEmail} onChange={(v) => setForm((f) => ({ ...f, contactEmail: v }))} />
                <Field label="Contact Phone" type="tel" value={form.contactPhone} onChange={(v) => setForm((f) => ({ ...f, contactPhone: v }))} />
              </div>
              <TextAreaField label="Event Description" value={form.eventDescription} onChange={(v) => setForm((f) => ({ ...f, eventDescription: v }))} rows={3} />
              <TextAreaField label="Message to Agent" value={form.messageToAgent} onChange={(v) => setForm((f) => ({ ...f, messageToAgent: v }))} rows={4} />
              {isFinalized ? (
                <p className="text-[11px] text-zinc-500 italic">This inquiry has been finalized and can no longer be edited. Reach out to the team if changes are needed.</p>
              ) : (
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full btn-gradient text-xs tracking-[0.18em] uppercase font-bold disabled:opacity-50"
                >
                  <Save size={13} /> {saving ? "Saving..." : "Save Changes"}
                </button>
              )}
            </fieldset>
          </div>
        </motion.section>

        {/* Notes thread */}
        <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.05 }} className="space-y-5">
          <div className="glass-card rounded-2xl p-5 space-y-4">
            <h2 className="text-[11px] tracking-[0.22em] uppercase text-zinc-300 inline-flex items-center gap-2">
              <MessageSquare size={12} /> Notes ({notes.length})
            </h2>
            {notes.length === 0 ? (
              <p className="text-xs text-zinc-500 italic">No notes yet. Add the first one below.</p>
            ) : (
              <ul className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                {notes.map((n) => (
                  <li key={n.id} className={`p-3 rounded-xl border ${
                    n.authorType === "venue"
                      ? "border-pink-400/15 bg-pink-400/5"
                      : "border-sky-400/15 bg-sky-400/5"
                  }`}>
                    <div className="text-[10px] tracking-[0.18em] uppercase text-zinc-500 mb-1.5 flex items-center justify-between gap-2">
                      <span>{n.authorType === "venue" ? "You" : "HighLife Team"} · {n.authorName || n.authorEmail}</span>
                      <span>{new Date(n.createdAt).toLocaleString()}</span>
                    </div>
                    <p className="text-sm text-zinc-200 whitespace-pre-wrap">{n.body}</p>
                  </li>
                ))}
              </ul>
            )}
            <div className="pt-2 border-t border-white/5">
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                rows={3}
                placeholder="Add a note for the HighLife team..."
                className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-sm text-foreground placeholder:text-zinc-500 focus:outline-none focus:border-pink-400/60 mb-2 resize-y"
              />
              <button
                onClick={handlePostNote}
                disabled={postingNote || !noteText.trim()}
                className="px-4 py-2 rounded-full btn-gradient text-[10px] tracking-[0.18em] uppercase font-bold disabled:opacity-50"
              >
                {postingNote ? "Posting..." : "Post Note"}
              </button>
            </div>
          </div>
        </motion.section>
      </div>
    </div>
  );
}

function Field({
  label, value, onChange, type = "text",
}: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div>
      <label className="text-[10px] tracking-[0.18em] uppercase text-zinc-400 block mb-1.5">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:border-pink-400/60"
      />
    </div>
  );
}

function TextAreaField({
  label, value, onChange, rows = 3,
}: { label: string; value: string; onChange: (v: string) => void; rows?: number }) {
  return (
    <div>
      <label className="text-[10px] tracking-[0.18em] uppercase text-zinc-400 block mb-1.5">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:border-pink-400/60 resize-y"
      />
    </div>
  );
}
