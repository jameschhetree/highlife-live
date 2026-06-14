"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { CheckCircle, ArrowRight, Send } from "lucide-react";
import { ScrollReveal } from "@/components/ScrollReveal";
import { AddressAutocomplete } from "@/components/AddressAutocomplete";
import type { Artist } from "@/lib/data";
import { isAuthenticated } from "@/lib/auth";

type DevelopingArtist = {
  slug: string;
  name: string;
  genre: string;
  pitch: string;
  image: string;
};

interface BookingForm {
  artistSlug: string;
  venueName: string;
  venueAddress: string;
  eventDate: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  eventDescription: string;
  messageToAgent: string;
  bookingOffer: string;
}

function emptyForm(preselected: string): BookingForm {
  return {
    artistSlug: preselected,
    venueName: "",
    venueAddress: "",
    eventDate: "",
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    eventDescription: "",
    messageToAgent: "",
    bookingOffer: "",
  };
}

function BookingFormContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const preselected = searchParams.get("artist") || "";

  const [authed, setAuthed] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [inquiryNumber, setInquiryNumber] = useState("");
  const [form, setForm] = useState<BookingForm>(emptyForm(preselected));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [developingArtists, setDevelopingArtists] = useState<DevelopingArtist[]>([]);
  const [showDevelopingPopup, setShowDevelopingPopup] = useState(false);

  useEffect(() => {
    const isAuthed = isAuthenticated();
    setAuthed(isAuthed);
    // Phase 3.9 Scope 12 — if authed and linked to a Venue, prefill venue fields
    // (only if they're still empty so we don't overwrite an in-progress edit).
    if (isAuthed) {
      fetch("/api/partner/me", { credentials: "include" })
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (!data?.venue) return;
          setForm((f) => {
            const next = { ...f };
            if (!next.venueName && data.venue.name) next.venueName = data.venue.name;
            if (!next.venueAddress) {
              const addr = [data.venue.address, data.venue.city, data.venue.state, data.venue.zipCode]
                .filter(Boolean)
                .join(", ");
              if (addr) next.venueAddress = addr;
            }
            return next;
          });
        })
        .catch(() => {
          /* not critical */
        });
    }
  }, []);

  useEffect(() => {
    fetch("/api/artists", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : []))
      .then((rows: Artist[]) => setArtists(Array.isArray(rows) ? rows : []))
      .catch(() => setArtists([]));
    fetch("/api/artists/developing", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : []))
      .then((rows: DevelopingArtist[]) =>
        setDevelopingArtists(Array.isArray(rows) ? rows : []),
      )
      .catch(() => setDevelopingArtists([]));
  }, []);

  useEffect(() => {
    if (preselected) setForm((f) => ({ ...f, artistSlug: preselected }));
  }, [preselected]);

  const update = <K extends keyof BookingForm>(k: K, v: BookingForm[K]) => {
    setForm((f) => ({ ...f, [k]: v }));
    if (errors[k]) setErrors((e) => ({ ...e, [k]: "" }));
  };

  const validate = (): Record<string, string> => {
    const errs: Record<string, string> = {};
    if (!form.artistSlug) errs.artistSlug = "Select an artist";
    if (!form.venueName.trim()) errs.venueName = "Required";
    if (!form.venueAddress.trim()) errs.venueAddress = "Required";
    if (!form.eventDate.trim()) errs.eventDate = "Required";
    if (!form.contactName.trim()) errs.contactName = "Required";
    if (!form.contactEmail.trim()) errs.contactEmail = "Required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contactEmail))
      errs.contactEmail = "Invalid email";
    if (!form.contactPhone.trim()) errs.contactPhone = "Required";
    return errs;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      const first = document.getElementById(`field-${Object.keys(errs)[0]}`);
      first?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    const artist = artists.find((a) => a.slug === form.artistSlug);
    const devArtist = developingArtists.find((a) => a.slug === form.artistSlug);
    const artistName = artist?.name ?? devArtist?.name ?? form.artistSlug;

    setSubmitting(true);
    try {
      const res = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          artistSlug: form.artistSlug,
          artistName,
          venueName: form.venueName,
          venueAddress: form.venueAddress,
          eventDate: form.eventDate,
          contactName: form.contactName,
          contactEmail: form.contactEmail,
          contactPhone: form.contactPhone,
          eventDescription: form.eventDescription,
          messageToAgent: form.messageToAgent,
          bookingOffer: form.bookingOffer.trim() || undefined,
          // Server derives venueLoginId from the signed venue session cookie if present.
          // We declare intent here; server downgrades to public if no valid session.
          source: authed ? "venue_partner" : "public",
        }),
      });

      if (!res.ok) throw new Error("Failed to submit");

      const data = await res.json();
      setInquiryNumber(data.inquiryNumber || "");
      setSubmitted(true);
    } catch {
      setErrors({ artistSlug: "Something went wrong. Please try again." });
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen pt-32 pb-24 bg-radial-atmosphere">
        <div className="max-w-2xl mx-auto px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.32, 0.72, 0, 1] }}
            className="glass-card rounded-3xl p-10 sm:p-14"
          >
            <div className="w-14 h-14 mx-auto mb-6 rounded-full bg-gradient-to-br from-emerald-400/30 to-emerald-600/10 border border-emerald-400/30 flex items-center justify-center">
              <CheckCircle size={26} strokeWidth={1.5} className="text-emerald-300" />
            </div>
            <h1 className="font-display uppercase text-4xl sm:text-5xl tracking-tight leading-[0.95] mb-4">
              Inquiry <span className="text-gradient-hero">received.</span>
            </h1>
            {inquiryNumber && (
              <p className="text-lg text-zinc-300 mb-4 font-mono">{inquiryNumber}</p>
            )}
            <p className="text-silver leading-relaxed mb-4">
              Thank you for your inquiry. Our team will review your request and
              reach out if the opportunity is a good fit for the artist and event.
            </p>
            {!authed && (
              <p className="text-sm text-zinc-400 mb-8">
                A confirmation email has been sent to your address with your inquiry number.
              </p>
            )}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/roster"
                className="inline-flex items-center gap-2 px-7 py-3 border border-white/10 hover:border-white/20 bg-black/40 hover:bg-black/55 rounded-full text-xs tracking-[0.18em] uppercase font-semibold transition-colors"
              >
                Browse the Roster
              </Link>
              <Link
                href="/"
                className="text-xs tracking-[0.18em] uppercase text-silver hover:text-foreground transition-colors"
              >
                Back to Home
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-28 pb-24 bg-radial-atmosphere">
      <div className="max-w-3xl mx-auto px-5 sm:px-6 lg:px-8">
        <ScrollReveal>
          <div className="text-center mb-10">
            <span className="chip mb-5 inline-flex">Booking Inquiry</span>
            <h1 className="font-display uppercase text-5xl sm:text-6xl tracking-tight leading-[0.92] mb-5">
              Book{" "}
              <span className="text-gradient-hero">talent.</span>
            </h1>
            <p className="text-silver max-w-xl mx-auto leading-relaxed">
              Submit a booking inquiry for any artist on the HighLife roster. Open
              to venues, promoters, and talent buyers -- our team responds to fits
              that align with the artist and event.
            </p>
            {authed && (
              <p className="mt-3 text-[11px] tracking-[0.2em] uppercase text-emerald-400/80">
                Signed in -- Inquiry will be tracked in your portal
              </p>
            )}
          </div>
        </ScrollReveal>

        {/* Disclaimer raised ABOVE the form so it's visible without scrolling
            past the entire form on mobile. Same copy also rendered below the
            form for desktop readers who reach the submit. */}
        {!authed && (
          <div className="mb-6 rounded-2xl border border-pink-400/30 bg-pink-500/10 px-5 py-4 text-center">
            <p className="text-sm text-zinc-200 leading-relaxed">
              Public inquiries are reviewed by our team. If you are a venue or promoter,{" "}
              <Link href="/login" className="text-pink-300 hover:text-pink-200 underline underline-offset-4 font-semibold">
                request a partner login
              </Link>{" "}
              for priority tracking and direct access to your inquiry status.
            </p>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="glass-card rounded-3xl p-6 sm:p-9 lg:p-11 space-y-7"
          noValidate
        >
          {/* Honeypot */}
          <div style={{ position: "absolute", left: "-9999px" }} aria-hidden="true">
            <input type="text" name="website" tabIndex={-1} autoComplete="off" />
          </div>

          <Field label="Artist" required error={errors.artistSlug} id="field-artistSlug">
            <select
              value={form.artistSlug}
              onChange={(e) => update("artistSlug", e.target.value)}
              required
              className={`w-full bg-black/40 border ${
                errors.artistSlug ? "border-rose-500/60" : "border-white/10"
              } rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-pink-400/60 transition-colors appearance-none`}
              style={{
                backgroundImage:
                  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'><path d='M1 1l5 5 5-5' stroke='%23b8b8b8' stroke-width='1.5' fill='none'/></svg>\")",
                backgroundRepeat: "no-repeat",
                backgroundPosition: "right 1rem center",
                paddingRight: "2.5rem",
              }}
            >
              <option value="">Select an artist...</option>
              {artists.map((a) => (
                <option key={a.slug} value={a.slug}>
                  {a.name} -- {a.genre}
                </option>
              ))}
              {/* If a Developing artist is selected via popup, surface it as a selected option so the <select> shows the right label. */}
              {form.artistSlug &&
                !artists.some((a) => a.slug === form.artistSlug) &&
                developingArtists
                  .filter((d) => d.slug === form.artistSlug)
                  .map((d) => (
                    <option key={d.slug} value={d.slug}>
                      {d.name} -- {d.genre} (Developing)
                    </option>
                  ))}
            </select>
            {developingArtists.length > 0 && (
              <button
                type="button"
                onClick={() => setShowDevelopingPopup(true)}
                className="mt-2 text-[11px] tracking-[0.18em] uppercase text-pink-300 hover:text-pink-200 underline underline-offset-4 transition-colors"
              >
                Developing Artists →
              </button>
            )}
          </Field>

          <Field label="Venue Name" required error={errors.venueName} id="field-venueName">
            <input
              type="text"
              value={form.venueName}
              onChange={(e) => update("venueName", e.target.value)}
              placeholder="The Anthem, Brooklyn Steel, Echostage..."
              required
              className={`w-full bg-black/40 border ${
                errors.venueName ? "border-rose-500/60" : "border-white/10"
              } rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-zinc-500 focus:outline-none focus:border-pink-400/60 transition-colors`}
            />
          </Field>

          <Field label={authed ? "Venue Address" : "Address"} required error={errors.venueAddress} id="field-venueAddress">
            <AddressAutocomplete
              value={form.venueAddress}
              onChange={(v) => update("venueAddress", v)}
              required
              error={errors.venueAddress}
            />
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Field label="Event Date" required error={errors.eventDate} id="field-eventDate">
              <input
                type="date"
                value={form.eventDate}
                onChange={(e) => update("eventDate", e.target.value)}
                required
                className={`w-full bg-black/40 border ${
                  errors.eventDate ? "border-rose-500/60" : "border-white/10"
                } rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-pink-400/60 transition-colors`}
              />
            </Field>

            <Field label="Contact Name" required error={errors.contactName} id="field-contactName">
              <input
                type="text"
                value={form.contactName}
                onChange={(e) => update("contactName", e.target.value)}
                placeholder="Your full name"
                required
                className={`w-full bg-black/40 border ${
                  errors.contactName ? "border-rose-500/60" : "border-white/10"
                } rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-zinc-500 focus:outline-none focus:border-pink-400/60 transition-colors`}
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Field label="Contact Email" required error={errors.contactEmail} id="field-contactEmail">
              <input
                type="email"
                value={form.contactEmail}
                onChange={(e) => update("contactEmail", e.target.value)}
                placeholder="you@venue.com"
                required
                className={`w-full bg-black/40 border ${
                  errors.contactEmail ? "border-rose-500/60" : "border-white/10"
                } rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-zinc-500 focus:outline-none focus:border-pink-400/60 transition-colors`}
              />
            </Field>

            <Field label="Contact Phone" required error={errors.contactPhone} id="field-contactPhone">
              <input
                type="tel"
                value={form.contactPhone}
                onChange={(e) => update("contactPhone", e.target.value)}
                placeholder="+1 (202) 555-0100"
                required
                className={`w-full bg-black/40 border ${
                  errors.contactPhone ? "border-rose-500/60" : "border-white/10"
                } rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-zinc-500 focus:outline-none focus:border-pink-400/60 transition-colors`}
              />
            </Field>
          </div>

          <Field
            label="Event Description"
            id="field-eventDescription"
            hint="Audience size, format, support acts, anything that helps pitch the fit."
          >
            <textarea
              value={form.eventDescription}
              onChange={(e) => update("eventDescription", e.target.value)}
              placeholder="A 1,200-cap headline set, doors 8pm, two openers from our local rotation..."
              rows={4}
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-zinc-500 focus:outline-none focus:border-pink-400/60 transition-colors resize-y"
            />
          </Field>

          <Field
            label="Booking Offer/Proposed Split"
            id="field-bookingOffer"
            hint="Optional. If you want to lead with an opening number or split."
          >
            <input
              type="text"
              value={form.bookingOffer}
              onChange={(e) => update("bookingOffer", e.target.value)}
              placeholder="$12,000"
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-zinc-500 focus:outline-none focus:border-pink-400/60 transition-colors"
            />
          </Field>

          <Field
            label="Message to Agent"
            id="field-messageToAgent"
            hint="Anything else the agent should know."
          >
            <textarea
              value={form.messageToAgent}
              onChange={(e) => update("messageToAgent", e.target.value)}
              placeholder="We have worked with HighLife on the Anthem residency. Looking to lock a Q3 date."
              rows={3}
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-zinc-500 focus:outline-none focus:border-pink-400/60 transition-colors resize-y"
            />
          </Field>

          <p className="text-[12px] text-zinc-500 leading-relaxed pt-1">
            By submitting this form, you agree that HighLife Live may use the
            information you provide to respond to your request and coordinate with
            relevant artists, agents, venues, and service providers. We do not sell
            information submitted through this form.{" "}
            <Link
              href="/privacy"
              className="text-pink-400/80 hover:text-pink-300 underline underline-offset-4 transition-colors"
            >
              See our Privacy Policy
            </Link>
            .
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-[11px] tracking-[0.18em] uppercase text-zinc-500">
              {authed ? "Saved to your portal on submit" : "No account required"}
            </p>
            <button
              type="submit"
              disabled={submitting}
              className="group inline-flex items-center justify-center gap-2.5 px-8 py-3.5 btn-gradient text-xs tracking-[0.18em] uppercase font-bold rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send size={14} strokeWidth={2} />
              {submitting ? "Sending..." : "Send Inquiry"}
              {!submitting && <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />}
            </button>
          </div>
        </form>

        {/* Helpful notice for public inquiries — same copy renders ABOVE the form too (raisedDisclaimer) for visibility */}
        {!authed && (
          <div className="mt-6 glass-card rounded-2xl p-5 text-center">
            <p className="text-sm text-zinc-300 leading-relaxed">
              All public inquiries are reviewed by our team. If you are a venue or promoter,{" "}
              <Link href="/login" className="text-pink-300 hover:text-pink-200 underline underline-offset-4">
                request a partner login
              </Link>{" "}
              for priority tracking and direct access to your inquiry status.
            </p>
          </div>
        )}
      </div>

      {showDevelopingPopup && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center px-4 py-10"
          onClick={() => setShowDevelopingPopup(false)}
        >
          <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" aria-hidden />
          <div
            className="relative max-w-2xl w-full max-h-[80vh] overflow-y-auto glass-card rounded-2xl p-6 sm:p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 mb-5">
              <div>
                <h2 className="text-xl text-foreground font-display tracking-tight">Developing Artists</h2>
                <p className="mt-1 text-xs tracking-[0.16em] uppercase text-zinc-500">
                  Emerging acts available for booking inquiry
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowDevelopingPopup(false)}
                className="text-zinc-400 hover:text-foreground text-xl leading-none"
                aria-label="Close"
              >
                ×
              </button>
            </div>
            {developingArtists.length === 0 ? (
              <p className="text-sm text-zinc-400">No developing artists open for inquiry right now.</p>
            ) : (
              <ul className="space-y-3">
                {developingArtists.map((a) => {
                  const isSelected = form.artistSlug === a.slug;
                  return (
                    <li key={a.slug}>
                      <button
                        type="button"
                        onClick={() => {
                          update("artistSlug", a.slug);
                          setShowDevelopingPopup(false);
                        }}
                        className={`w-full text-left rounded-xl border px-4 py-3 transition-colors ${
                          isSelected
                            ? "border-pink-400/60 bg-pink-500/10"
                            : "border-white/10 bg-black/30 hover:border-pink-400/40 hover:bg-pink-500/5"
                        }`}
                      >
                        <div className="flex items-baseline justify-between gap-3">
                          <p className="text-sm font-medium text-foreground">{a.name}</p>
                          <span className="text-[10px] tracking-[0.16em] uppercase text-zinc-500">
                            {a.genre}
                          </span>
                        </div>
                        <p className="mt-1.5 text-[12px] leading-relaxed text-zinc-300">{a.pitch}</p>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  id,
  required,
  hint,
  error,
  children,
}: {
  label: string;
  id: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div id={id}>
      <div className="flex items-baseline justify-between mb-2">
        <label className="block text-[11px] tracking-[0.2em] uppercase text-silver font-medium">
          {label}
          {required && <span className="text-pink-400 ml-1">*</span>}
        </label>
        {hint && (
          <span className="text-[10px] text-zinc-500 hidden sm:block">{hint}</span>
        )}
      </div>
      {children}
      {hint && <p className="mt-1.5 text-[10px] text-zinc-500 sm:hidden">{hint}</p>}
      {error && <p className="mt-1.5 text-[11px] tracking-wide text-rose-400">{error}</p>}
    </div>
  );
}

export default function BookPage() {
  return (
    <Suspense fallback={<div className="min-h-screen pt-32 bg-radial-atmosphere" />}>
      <BookingFormContent />
    </Suspense>
  );
}
