"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { CheckCircle, ArrowRight, Send } from "lucide-react";
import { ScrollReveal } from "@/components/ScrollReveal";
import { AddressAutocomplete } from "@/components/AddressAutocomplete";
import { artists } from "@/lib/data";
import { isAuthenticated, getUser } from "@/lib/auth";

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

  useEffect(() => {
    setAuthed(isAuthenticated());
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
    const artistName = artist?.name ?? form.artistSlug;

    const user = getUser();

    setSubmitting(true);
    try {
      const res = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
          source: authed ? "venue_partner" : "public",
          venueLoginId: user?.email ? undefined : undefined,
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
            </select>
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

          <Field label="Venue Address" required error={errors.venueAddress} id="field-venueAddress">
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

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
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

        {/* Helpful notice for public inquiries -- replaces the old 31-day disclaimer */}
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
