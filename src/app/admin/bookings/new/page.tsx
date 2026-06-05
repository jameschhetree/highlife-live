"use client";

// /admin/bookings/new — create a new booking. Owner can pick any artist; agent
// only their assigned artists. When ?inquiryId= is present, the form pre-fills
// from the Inquiry. Phase 3.9 Scope 5.

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Save } from "lucide-react";
import { getAdminSession, isOwnerAdmin, type AdminSession } from "@/lib/admin-auth";

type ArtistOption = { id: string; name: string };
type VenueOption = { id: string; name: string };

function NewBookingInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inquiryId = searchParams.get("inquiryId");

  const [session, setSession] = useState<AdminSession | null>(null);
  const [artists, setArtists] = useState<ArtistOption[]>([]);
  const [venues, setVenues] = useState<VenueOption[]>([]);
  const [hydrating, setHydrating] = useState(true);

  const [artistId, setArtistId] = useState("");
  const [venueId, setVenueId] = useState("");
  const [venueName, setVenueName] = useState("");
  const [venueAddress, setVenueAddress] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventTitle, setEventTitle] = useState("");
  const [eventDescriptionPublic, setEventDescriptionPublic] = useState("");
  const [finalOffer, setFinalOffer] = useState("");
  const [ticketUrl, setTicketUrl] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [messageToAgent, setMessageToAgent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setSession(getAdminSession());
  }, []);

  const hydrate = useCallback(async () => {
    if (!session) return;
    setHydrating(true);
    try {
      // Artists I can book for. Owners get all DB-backed; agents get assigned.
      const aRes = await fetch("/api/admin/artists?bookableFor=current", {
        headers: { "x-admin-email": session.email },
      }).catch(() => null);
      // Fallback: use /api/admin/artists which is already role-scoped server-side.
      const artistsRes =
        aRes && aRes.ok
          ? aRes
          : await fetch("/api/admin/artists", { headers: { "x-admin-email": session.email } });
      const allArtists = artistsRes && artistsRes.ok ? await artistsRes.json() : [];
      setArtists(
        (Array.isArray(allArtists) ? allArtists : []).map(
          (a: { id: string; name: string }) => ({ id: a.id, name: a.name }),
        ),
      );

      // Venues (used for venue linkage dropdown). Use existing admin venues route.
      const vRes = await fetch("/api/admin/venues", {
        headers: { "x-admin-email": session.email },
      }).catch(() => null);
      if (vRes && vRes.ok) {
        const allVenues = await vRes.json();
        setVenues(
          (Array.isArray(allVenues) ? allVenues : []).map(
            (v: { id: string; name: string }) => ({ id: v.id, name: v.name }),
          ),
        );
      }

      // Inquiry pre-fill
      if (inquiryId) {
        const iRes = await fetch(`/api/admin/inquiries/${inquiryId}`, {
          headers: { "x-admin-email": session.email },
        });
        if (iRes.ok) {
          const inq = await iRes.json();
          setVenueName(inq.venueName ?? "");
          setVenueAddress(inq.venueAddress ?? "");
          setEventDate(inq.eventDate ?? "");
          setEventTitle(`${inq.artistName} at ${inq.venueName}`);
          setEventDescriptionPublic(inq.eventDescription ?? "");
          setFinalOffer(inq.bookingOffer ?? "");
          setContactName(inq.contactName ?? "");
          setContactEmail(inq.contactEmail ?? "");
          setContactPhone(inq.contactPhone ?? "");
          setMessageToAgent(inq.messageToAgent ?? "");
          // Try to resolve artistId from name
          const match = (Array.isArray(allArtists) ? allArtists : []).find(
            (a: { name: string }) => a.name === inq.artistName,
          );
          if (match) setArtistId(match.id);
        }
      }
    } finally {
      setHydrating(false);
    }
  }, [session, inquiryId]);

  useEffect(() => {
    if (session) hydrate();
  }, [session, hydrate]);

  const submit = async () => {
    if (!session) return;
    setError("");
    if (!artistId) {
      setError("Pick an artist.");
      return;
    }
    if (!isOwnerAdmin(session) && !artistId) {
      setError("Agents must pick one of their assigned artists.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-email": session.email },
        body: JSON.stringify({
          inquiryId: inquiryId ?? undefined,
          artistId,
          venueId: venueId || undefined,
          venueName,
          venueAddress,
          eventDate,
          eventTitle,
          eventDescriptionPublic,
          finalOffer,
          ticketUrl,
          contactName,
          contactEmail,
          contactPhone,
          messageToAgent,
        }),
      });
      if (res.ok) {
        const created = await res.json();
        router.push(`/admin/bookings/${created.id}`);
      } else {
        const j = await res.json().catch(() => null);
        setError(j?.error || "Could not create booking.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen text-foreground">
      <div className="border-b border-white/8 px-4 sm:px-6 lg:px-10 py-6">
        <Link
          href="/admin/bookings"
          className="inline-flex items-center gap-1.5 text-[10px] tracking-[0.18em] uppercase text-zinc-500 hover:text-foreground mb-3 transition-colors"
        >
          <ArrowLeft size={12} /> Back to Bookings
        </Link>
        <h1 className="font-display uppercase text-2xl sm:text-3xl tracking-tight">
          New Booking{inquiryId ? " (from inquiry)" : ""}
        </h1>
        {hydrating && (
          <p className="text-[10px] tracking-[0.18em] uppercase text-zinc-500 mt-1">Loading…</p>
        )}
      </div>

      <div className="px-4 sm:px-6 lg:px-10 py-8 max-w-3xl space-y-5">
        <Section title="Artist + Venue">
          <Field label="Artist (required)">
            <select
              value={artistId}
              onChange={(e) => setArtistId(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-pink-400/60"
            >
              <option value="">Select an artist…</option>
              {artists.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Venue (DB link, optional)">
            <select
              value={venueId}
              onChange={(e) => {
                setVenueId(e.target.value);
                const v = venues.find((v) => v.id === e.target.value);
                if (v && !venueName) setVenueName(v.name);
              }}
              className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-pink-400/60"
            >
              <option value="">— No DB venue link —</option>
              {venues.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Venue Name (free text — required)">
            <input
              value={venueName}
              onChange={(e) => setVenueName(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-pink-400/60"
            />
          </Field>
          <Field label="Venue Address">
            <input
              value={venueAddress}
              onChange={(e) => setVenueAddress(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-pink-400/60"
            />
          </Field>
        </Section>

        <Section title="Show Details">
          <Field label="Event Title">
            <input
              value={eventTitle}
              onChange={(e) => setEventTitle(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-pink-400/60"
            />
          </Field>
          <Field label="Event Date">
            <input
              type="date"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-pink-400/60"
            />
          </Field>
          <Field label="Public Event Description">
            <textarea
              value={eventDescriptionPublic}
              onChange={(e) => setEventDescriptionPublic(e.target.value)}
              rows={3}
              className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-pink-400/60 resize-y"
            />
          </Field>
        </Section>

        <Section title="Offer + Tickets">
          <Field label="Final Offer / Split">
            <input
              value={finalOffer}
              onChange={(e) => setFinalOffer(e.target.value)}
              placeholder="$15,000 + travel · 80/20 door"
              className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-pink-400/60"
            />
          </Field>
          <Field label="Ticket URL">
            <input
              value={ticketUrl}
              onChange={(e) => setTicketUrl(e.target.value)}
              placeholder="https://..."
              className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-pink-400/60"
            />
          </Field>
        </Section>

        <Section title="Contact">
          <Field label="Contact Name">
            <input
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-pink-400/60"
            />
          </Field>
          <Field label="Contact Email">
            <input
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-pink-400/60"
            />
          </Field>
          <Field label="Contact Phone">
            <input
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-pink-400/60"
            />
          </Field>
        </Section>

        <Section title="Internal">
          <Field label="Notes / Message">
            <textarea
              value={messageToAgent}
              onChange={(e) => setMessageToAgent(e.target.value)}
              rows={3}
              className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-pink-400/60 resize-y"
            />
          </Field>
        </Section>

        {error && <p className="text-sm text-rose-300">{error}</p>}

        <div className="flex items-center gap-2">
          <button
            onClick={submit}
            disabled={submitting}
            className="btn-gradient text-[10px] tracking-[0.18em] uppercase font-bold rounded-full px-5 py-2.5 disabled:opacity-50 inline-flex items-center gap-2"
          >
            <Save size={12} /> {submitting ? "Creating…" : "Create Booking"}
          </button>
          <Link
            href="/admin/bookings"
            className="text-xs tracking-[0.18em] uppercase text-zinc-400 hover:text-foreground px-3 py-2"
          >
            Cancel
          </Link>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="glass-card rounded-2xl p-5 space-y-3">
      <h2 className="text-[11px] tracking-[0.22em] uppercase text-zinc-300">{title}</h2>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[10px] tracking-[0.18em] uppercase text-zinc-400 mb-1">{label}</label>
      {children}
    </div>
  );
}

export default function NewBookingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-sm text-zinc-500">Loading…</div>}>
      <NewBookingInner />
    </Suspense>
  );
}
