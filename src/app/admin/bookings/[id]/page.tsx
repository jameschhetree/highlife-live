"use client";

// /admin/bookings/[id] — operational booking detail (Phase 3.9 Scope 5).
// Editable: event title, public description, final offer, ticket URL, tickets sold,
// event date, artist linkage, venue linkage, contact info, internal message.
// Materials: per-kind URL paste (banner, flier, video, contract, other).
// Action: Request Event Card → posts to /api/admin/event-card-requests.
// Booking.status NOT shown — legacy column kept in DB but hidden from UI.

import { use, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Save,
  Music,
  MapPin,
  Calendar,
  Ticket,
  DollarSign,
  FileText,
  Paperclip,
  Trash2,
  CalendarPlus,
  ExternalLink,
} from "lucide-react";
import { getAdminSession, type AdminSession } from "@/lib/admin-auth";

type Material = {
  id: string;
  kind: string;
  url: string;
  filename: string;
  note: string;
  createdAt: string;
};

type Booking = {
  id: string;
  artistSlug: string;
  artistName: string;
  artistId: string | null;
  venueName: string;
  venueAddress: string;
  venueId: string | null;
  eventDate: string;
  eventTitle: string | null;
  eventDescriptionPublic: string | null;
  finalOffer: string | null;
  proposedOffer: string;
  ticketUrl: string | null;
  ticketsSold: number;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  messageToAgent: string;
  inquiryId: string | null;
  eventId: string | null;
  source: string;
  submittedAt: string;
  agentLoginId: string | null;
  materials: Material[];
  event: { id: string; title: string; published: boolean } | null;
  inquiry: { id: string; inquiryNumber: string; status: string } | null;
};

const KINDS = ["banner", "flier", "video", "contract", "other"] as const;

export default function AdminBookingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [session, setSession] = useState<AdminSession | null>(null);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [savingField, setSavingField] = useState<string | null>(null);

  const [eventTitle, setEventTitle] = useState("");
  const [eventDescriptionPublic, setEventDescriptionPublic] = useState("");
  const [finalOffer, setFinalOffer] = useState("");
  const [ticketUrl, setTicketUrl] = useState("");
  const [ticketsSold, setTicketsSold] = useState(0);
  const [eventDate, setEventDate] = useState("");
  const [venueName, setVenueName] = useState("");
  const [venueAddress, setVenueAddress] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [messageToAgent, setMessageToAgent] = useState("");

  const [matKind, setMatKind] = useState<(typeof KINDS)[number]>("banner");
  const [matUrl, setMatUrl] = useState("");
  const [matFilename, setMatFilename] = useState("");
  const [matNote, setMatNote] = useState("");
  const [addingMaterial, setAddingMaterial] = useState(false);

  const [ecrOpen, setEcrOpen] = useState(false);
  const [ecrTitle, setEcrTitle] = useState("");
  const [ecrDate, setEcrDate] = useState("");
  const [ecrVenueName, setEcrVenueName] = useState("");
  const [ecrVenueAddress, setEcrVenueAddress] = useState("");
  const [ecrTicketLink, setEcrTicketLink] = useState("");
  const [ecrDescription, setEcrDescription] = useState("");
  const [ecrSubmitting, setEcrSubmitting] = useState(false);
  const [ecrMessage, setEcrMessage] = useState<string | null>(null);

  useEffect(() => {
    setSession(getAdminSession());
  }, []);

  const load = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/bookings/${id}`, {
        headers: { "x-admin-email": session.email },
        cache: "no-store",
      });
      if (!res.ok) {
        setBooking(null);
        return;
      }
      const b = (await res.json()) as Booking;
      setBooking(b);
      setEventTitle(b.eventTitle ?? "");
      setEventDescriptionPublic(b.eventDescriptionPublic ?? "");
      setFinalOffer(b.finalOffer ?? "");
      setTicketUrl(b.ticketUrl ?? "");
      setTicketsSold(b.ticketsSold ?? 0);
      setEventDate(b.eventDate ?? "");
      setVenueName(b.venueName ?? "");
      setVenueAddress(b.venueAddress ?? "");
      setContactName(b.contactName ?? "");
      setContactEmail(b.contactEmail ?? "");
      setContactPhone(b.contactPhone ?? "");
      setMessageToAgent(b.messageToAgent ?? "");
    } finally {
      setLoading(false);
    }
  }, [id, session]);

  useEffect(() => {
    if (session) load();
  }, [session, load]);

  const saveField = async (key: string, value: unknown) => {
    if (!session) return;
    setSavingField(key);
    try {
      const res = await fetch(`/api/admin/bookings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-admin-email": session.email },
        body: JSON.stringify({ [key]: value }),
      });
      if (res.ok) {
        const updated = (await res.json()) as Booking;
        setBooking((prev) => (prev ? { ...prev, ...updated } : updated));
        setSavedAt(new Date());
      }
    } finally {
      setSavingField(null);
    }
  };

  const addMaterial = async () => {
    if (!session || !booking) return;
    if (!matUrl.trim()) return;
    setAddingMaterial(true);
    try {
      const res = await fetch(`/api/admin/bookings/${id}/materials`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-email": session.email },
        body: JSON.stringify({
          kind: matKind,
          url: matUrl.trim(),
          filename: matFilename.trim(),
          note: matNote.trim(),
        }),
      });
      if (res.ok) {
        const m = (await res.json()) as Material;
        setBooking((prev) => (prev ? { ...prev, materials: [...prev.materials, m] } : prev));
        setMatUrl("");
        setMatFilename("");
        setMatNote("");
      } else {
        const j = await res.json().catch(() => null);
        alert(j?.error || "Could not add material");
      }
    } finally {
      setAddingMaterial(false);
    }
  };

  const deleteMaterial = async (materialId: string) => {
    if (!session || !booking) return;
    if (!confirm("Remove this material?")) return;
    const res = await fetch(`/api/admin/bookings/${id}/materials?materialId=${materialId}`, {
      method: "DELETE",
      headers: { "x-admin-email": session.email },
    });
    if (res.ok) {
      setBooking((prev) =>
        prev ? { ...prev, materials: prev.materials.filter((m) => m.id !== materialId) } : prev,
      );
    }
  };

  const openEcr = () => {
    if (!booking) return;
    setEcrTitle(eventTitle || `${booking.artistName} at ${booking.venueName}`);
    setEcrDate(eventDate);
    setEcrVenueName(venueName);
    setEcrVenueAddress(venueAddress);
    setEcrTicketLink(ticketUrl);
    setEcrDescription(eventDescriptionPublic);
    setEcrMessage(null);
    setEcrOpen(true);
  };

  const submitEcr = async () => {
    if (!session || !booking) return;
    setEcrSubmitting(true);
    setEcrMessage(null);
    try {
      const res = await fetch(`/api/admin/event-card-requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-email": session.email },
        body: JSON.stringify({
          bookingId: booking.id,
          inquiryId: booking.inquiryId,
          artistIds: booking.artistId ? [booking.artistId] : [],
          eventTitle: ecrTitle.trim(),
          eventDate: ecrDate.trim(),
          venueName: ecrVenueName.trim(),
          venueAddress: ecrVenueAddress.trim(),
          ticketLink: ecrTicketLink.trim(),
          description: ecrDescription.trim(),
        }),
      });
      if (res.ok) {
        setEcrMessage("Request filed. Owner will review in the Event Card Request queue.");
        setTimeout(() => setEcrOpen(false), 1400);
      } else {
        const j = await res.json().catch(() => null);
        setEcrMessage(j?.error || "Could not file request.");
      }
    } finally {
      setEcrSubmitting(false);
    }
  };

  const materialsByKind = useMemo(() => {
    const map: Record<string, Material[]> = {};
    booking?.materials.forEach((m) => {
      (map[m.kind] = map[m.kind] || []).push(m);
    });
    return map;
  }, [booking?.materials]);

  if (loading || !booking) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-zinc-500">
        {loading ? "Loading..." : "Booking not available."}
      </div>
    );
  }

  return (
    <div className="min-h-screen text-foreground">
      <div className="border-b border-white/8 px-4 sm:px-6 lg:px-10 py-6">
        <Link
          href="/admin/bookings"
          className="inline-flex items-center gap-1.5 text-[10px] tracking-[0.18em] uppercase text-zinc-500 hover:text-foreground mb-3 transition-colors"
        >
          <ArrowLeft size={12} /> Back to Bookings
        </Link>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="min-w-0">
            <p className="text-[10px] tracking-[0.18em] uppercase text-zinc-500 mb-1">
              {booking.inquiry && (
                <Link href={`/admin/inquiries/${booking.inquiry.id}`} className="hover:text-pink-300 mr-3">
                  ← {booking.inquiry.inquiryNumber}
                </Link>
              )}
              {booking.event && (
                <Link href={`/admin/events`} className="text-emerald-300 hover:text-emerald-200 mr-3">
                  Promoted as Event
                </Link>
              )}
              <span>created {new Date(booking.submittedAt).toLocaleDateString()}</span>
            </p>
            <h1 className="font-display uppercase text-2xl sm:text-3xl tracking-tight break-words">
              {eventTitle || `${booking.artistName} at ${booking.venueName}`}
            </h1>
            {savedAt && (
              <p className="text-[10px] tracking-[0.18em] uppercase text-emerald-300 mt-2">
                Saved {savedAt.toLocaleTimeString()}
                {savingField ? ` (saving ${savingField}…)` : ""}
              </p>
            )}
          </div>
          {!booking.eventId && (
            <button
              onClick={openEcr}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-pink-400/40 hover:border-pink-400/70 bg-pink-400/10 text-pink-200 text-[10px] tracking-[0.18em] uppercase font-bold transition-colors"
            >
              <CalendarPlus size={12} /> Request Event Card
            </button>
          )}
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-10 py-8 grid lg:grid-cols-3 gap-6 max-w-7xl">
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="lg:col-span-2 space-y-5"
        >
          <div className="glass-card rounded-2xl p-5 space-y-4">
            <h2 className="text-[11px] tracking-[0.22em] uppercase text-zinc-300">Show Details</h2>
            <FieldRow icon={Music} label="Event Title">
              <input
                value={eventTitle}
                onChange={(e) => setEventTitle(e.target.value)}
                onBlur={() => booking.eventTitle !== eventTitle && saveField("eventTitle", eventTitle)}
                placeholder="(none — defaults to 'Artist at Venue')"
                className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:border-pink-400/60"
              />
            </FieldRow>
            <FieldRow icon={Calendar} label="Event Date">
              <input
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                onBlur={() => booking.eventDate !== eventDate && saveField("eventDate", eventDate)}
                className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:border-pink-400/60"
              />
            </FieldRow>
            <FieldRow icon={MapPin} label="Venue">
              <div className="space-y-2">
                <input
                  value={venueName}
                  onChange={(e) => setVenueName(e.target.value)}
                  onBlur={() => booking.venueName !== venueName && saveField("venueName", venueName)}
                  placeholder="Venue name"
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:border-pink-400/60"
                />
                <input
                  value={venueAddress}
                  onChange={(e) => setVenueAddress(e.target.value)}
                  onBlur={() => booking.venueAddress !== venueAddress && saveField("venueAddress", venueAddress)}
                  placeholder="Venue address"
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:border-pink-400/60"
                />
              </div>
            </FieldRow>
            <FieldRow icon={FileText} label="Event Description (public)">
              <textarea
                value={eventDescriptionPublic}
                onChange={(e) => setEventDescriptionPublic(e.target.value)}
                onBlur={() =>
                  booking.eventDescriptionPublic !== eventDescriptionPublic &&
                  saveField("eventDescriptionPublic", eventDescriptionPublic)
                }
                rows={3}
                placeholder="Audience-facing description, used when promoted as a public Event."
                className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:border-pink-400/60 resize-y"
              />
            </FieldRow>
          </div>

          <div className="glass-card rounded-2xl p-5 space-y-4">
            <h2 className="text-[11px] tracking-[0.22em] uppercase text-zinc-300">Offer + Tickets</h2>
            <FieldRow icon={DollarSign} label="Final Offer">
              <input
                value={finalOffer}
                onChange={(e) => setFinalOffer(e.target.value)}
                onBlur={() => booking.finalOffer !== finalOffer && saveField("finalOffer", finalOffer)}
                placeholder="$15,000 + travel · 80/20 door split"
                className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:border-pink-400/60"
              />
            </FieldRow>
            <FieldRow icon={Ticket} label="Ticket URL">
              <input
                value={ticketUrl}
                onChange={(e) => setTicketUrl(e.target.value)}
                onBlur={() => booking.ticketUrl !== ticketUrl && saveField("ticketUrl", ticketUrl)}
                placeholder="https://..."
                className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:border-pink-400/60"
              />
            </FieldRow>
            <FieldRow icon={Ticket} label="Tickets Sold">
              <input
                type="number"
                min={0}
                value={ticketsSold}
                onChange={(e) => setTicketsSold(Number(e.target.value || 0))}
                onBlur={() => booking.ticketsSold !== ticketsSold && saveField("ticketsSold", ticketsSold)}
                className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:border-pink-400/60 w-32"
              />
            </FieldRow>
          </div>

          <div className="glass-card rounded-2xl p-5 space-y-4">
            <h2 className="text-[11px] tracking-[0.22em] uppercase text-zinc-300 inline-flex items-center gap-2">
              <Paperclip size={12} /> Materials ({booking.materials.length})
            </h2>
            {KINDS.map((kind) => (
              <div key={kind}>
                <p className="text-[10px] tracking-[0.18em] uppercase text-zinc-500 mb-2">
                  {kind === "other" ? "Other / Misc" : kind.charAt(0).toUpperCase() + kind.slice(1)}
                </p>
                {(materialsByKind[kind] ?? []).length === 0 ? (
                  <p className="text-xs text-zinc-600 italic">No {kind} attached.</p>
                ) : (
                  <ul className="space-y-1.5">
                    {(materialsByKind[kind] ?? []).map((m) => (
                      <li
                        key={m.id}
                        className="flex items-center justify-between gap-2 p-2.5 rounded-lg border border-white/8 bg-black/30"
                      >
                        <a
                          href={m.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-zinc-200 hover:text-pink-300 truncate flex items-center gap-1.5 min-w-0 flex-1"
                        >
                          <ExternalLink size={12} className="shrink-0" />
                          <span className="truncate">{m.filename || m.url}</span>
                        </a>
                        {m.note && <span className="text-[10px] text-zinc-500 shrink-0">{m.note}</span>}
                        <button
                          onClick={() => deleteMaterial(m.id)}
                          className="text-zinc-500 hover:text-rose-400 p-1"
                          title="Remove"
                        >
                          <Trash2 size={12} />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}

            <div className="pt-3 border-t border-white/5 space-y-2">
              <p className="text-[10px] tracking-[0.18em] uppercase text-zinc-400">Add material (URL paste)</p>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                <select
                  value={matKind}
                  onChange={(e) => setMatKind(e.target.value as (typeof KINDS)[number])}
                  className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-pink-400/60"
                >
                  {KINDS.map((k) => (
                    <option key={k} value={k}>
                      {k}
                    </option>
                  ))}
                </select>
                <input
                  value={matUrl}
                  onChange={(e) => setMatUrl(e.target.value)}
                  placeholder="https://..."
                  className="sm:col-span-2 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-pink-400/60"
                />
                <button
                  onClick={addMaterial}
                  disabled={addingMaterial || !matUrl.trim()}
                  className="btn-gradient text-[10px] tracking-[0.18em] uppercase font-bold rounded-lg px-3 py-2 disabled:opacity-50"
                >
                  {addingMaterial ? "Adding…" : "Add"}
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  value={matFilename}
                  onChange={(e) => setMatFilename(e.target.value)}
                  placeholder="Filename / label (optional)"
                  className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-pink-400/60"
                />
                <input
                  value={matNote}
                  onChange={(e) => setMatNote(e.target.value)}
                  placeholder="Short note (optional)"
                  className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-pink-400/60"
                />
              </div>
              <p className="text-[10px] text-zinc-500">
                Files live wherever you already host them (Drive, Dropbox, Vercel Blob, S3, etc.). Paste the share link.
              </p>
            </div>
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.05 }}
          className="space-y-5"
        >
          <div className="glass-card rounded-2xl p-5 space-y-3">
            <h2 className="text-[11px] tracking-[0.22em] uppercase text-zinc-300">Contact</h2>
            <input
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              onBlur={() => booking.contactName !== contactName && saveField("contactName", contactName)}
              placeholder="Contact name"
              className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-pink-400/60"
            />
            <input
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              onBlur={() => booking.contactEmail !== contactEmail && saveField("contactEmail", contactEmail)}
              placeholder="Email"
              className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-pink-400/60"
            />
            <input
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              onBlur={() => booking.contactPhone !== contactPhone && saveField("contactPhone", contactPhone)}
              placeholder="Phone"
              className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-pink-400/60"
            />
          </div>

          <div className="glass-card rounded-2xl p-5 space-y-3">
            <h2 className="text-[11px] tracking-[0.22em] uppercase text-zinc-300">Internal Notes</h2>
            <textarea
              value={messageToAgent}
              onChange={(e) => setMessageToAgent(e.target.value)}
              onBlur={() =>
                booking.messageToAgent !== messageToAgent && saveField("messageToAgent", messageToAgent)
              }
              rows={5}
              placeholder="Team-only notes, hand-off, follow-ups."
              className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-pink-400/60 resize-y"
            />
            <p className="text-[10px] text-zinc-500">Not surfaced on public Event card.</p>
          </div>

          <div className="glass-card rounded-2xl p-5 space-y-2 text-sm">
            <h2 className="text-[11px] tracking-[0.22em] uppercase text-zinc-300 mb-2">Linkage</h2>
            <p className="text-zinc-400 text-xs">Artist:</p>
            <p className="text-zinc-200 break-words">{booking.artistName}</p>
            {booking.inquiry && (
              <>
                <p className="text-zinc-400 text-xs mt-3">Source Inquiry:</p>
                <Link
                  href={`/admin/inquiries/${booking.inquiry.id}`}
                  className="text-pink-300 hover:text-pink-200 break-words"
                >
                  {booking.inquiry.inquiryNumber} ({booking.inquiry.status})
                </Link>
              </>
            )}
            {booking.event && (
              <>
                <p className="text-zinc-400 text-xs mt-3">Public Event:</p>
                <Link href={`/admin/events`} className="text-emerald-300 hover:text-emerald-200 break-words">
                  {booking.event.title} ({booking.event.published ? "live" : "draft"})
                </Link>
              </>
            )}
          </div>
        </motion.section>
      </div>

      {ecrOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center px-4 py-10 bg-black/70 backdrop-blur-sm"
          onClick={() => !ecrSubmitting && setEcrOpen(false)}
        >
          <div
            className="relative max-w-lg w-full max-h-[85vh] overflow-y-auto glass-card rounded-2xl p-6 sm:p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h2 className="text-lg font-display tracking-tight text-foreground">Request Event Card</h2>
                <p className="mt-1 text-[10px] tracking-[0.18em] uppercase text-zinc-500">
                  Owner reviews + publishes from /admin/events
                </p>
              </div>
              <button
                onClick={() => setEcrOpen(false)}
                className="text-zinc-400 hover:text-foreground text-xl leading-none"
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <div className="space-y-3 text-sm">
              <ModalField label="Event Title">
                <input
                  value={ecrTitle}
                  onChange={(e) => setEcrTitle(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2"
                />
              </ModalField>
              <ModalField label="Event Date">
                <input
                  type="date"
                  value={ecrDate}
                  onChange={(e) => setEcrDate(e.target.value)}
                  className="bg-black/40 border border-white/10 rounded-lg px-3 py-2"
                />
              </ModalField>
              <ModalField label="Venue Name">
                <input
                  value={ecrVenueName}
                  onChange={(e) => setEcrVenueName(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2"
                />
              </ModalField>
              <ModalField label="Venue Address">
                <input
                  value={ecrVenueAddress}
                  onChange={(e) => setEcrVenueAddress(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2"
                />
              </ModalField>
              <ModalField label="Ticket Link">
                <input
                  value={ecrTicketLink}
                  onChange={(e) => setEcrTicketLink(e.target.value)}
                  placeholder="https://..."
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2"
                />
              </ModalField>
              <ModalField label="Description">
                <textarea
                  value={ecrDescription}
                  onChange={(e) => setEcrDescription(e.target.value)}
                  rows={3}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 resize-y"
                />
              </ModalField>
            </div>
            {ecrMessage && (
              <p
                className={`mt-3 text-sm ${
                  ecrMessage.includes("filed") ? "text-emerald-300" : "text-rose-300"
                }`}
              >
                {ecrMessage}
              </p>
            )}
            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                onClick={() => setEcrOpen(false)}
                className="text-xs tracking-[0.18em] uppercase text-zinc-400 hover:text-foreground px-3 py-2"
              >
                Cancel
              </button>
              <button
                onClick={submitEcr}
                disabled={ecrSubmitting}
                className="btn-gradient text-[10px] tracking-[0.18em] uppercase font-bold rounded-full px-5 py-2 disabled:opacity-50"
              >
                {ecrSubmitting ? "Filing…" : "File Request"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FieldRow({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof Save;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon size={14} className="text-pink-300 mt-2 shrink-0" />
      <div className="min-w-0 flex-1">
        <div className="text-[9px] tracking-[0.18em] uppercase text-zinc-600 mb-1">{label}</div>
        {children}
      </div>
    </div>
  );
}

function ModalField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[10px] tracking-[0.18em] uppercase text-zinc-400 mb-1">{label}</label>
      {children}
    </div>
  );
}
