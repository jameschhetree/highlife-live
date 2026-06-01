"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { ScrollReveal } from "@/components/ScrollReveal";
import { artists } from "@/lib/data";

const verticals = ["Live Events", "Music", "Culture", "Comedy", "Entertainment"];

const steps = [
  { number: "01", title: "Submit Request", desc: "Tell us about your event, audience, and the artist you have in mind." },
  { number: "02", title: "HighLife Reviews", desc: "We evaluate fit, logistics, timing, and artist alignment." },
  { number: "03", title: "Availability Confirmed", desc: "Artist availability is confirmed and the timeline is locked." },
  { number: "04", title: "Offer & Agreement", desc: "We prepare the offer paperwork and secure the commitment." },
  { number: "05", title: "Show Gets Locked", desc: "Production, travel, and hospitality are finalized. Showtime." },
];

export default function HomePage() {

  return (
    <div>
      {/* Hero — vibrant atmosphere + glass card centerpiece */}
      <section className="relative min-h-[100svh] flex items-center justify-center overflow-hidden bg-radial-atmosphere pt-32 pb-24 sm:pt-28 sm:pb-20">
        {/* Atmospheric noise overlay */}
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.05] mix-blend-screen pointer-events-none"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/></filter><rect width='200' height='200' filter='url(%23n)' opacity='0.6'/></svg>\")",
          }}
        />

        <div className="relative z-10 w-full max-w-6xl mx-auto px-5 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 24, filter: "blur(8px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 1, ease: [0.32, 0.72, 0, 1] }}
            className="glass-card rounded-[28px] sm:rounded-[36px] px-6 sm:px-10 lg:px-14 py-10 sm:py-14 lg:py-16 text-center"
          >
            {/* Status pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/45 border border-white/10 backdrop-blur mb-7">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_10px_#34d399]" />
              <span className="text-[10px] tracking-[0.3em] uppercase text-zinc-300 font-medium">
                Now Booking 2026
              </span>
            </div>

            <motion.h1
              className="font-display uppercase leading-[0.92] tracking-[-0.01em] text-[clamp(2.75rem,9vw,7.5rem)] mb-6"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.15, ease: [0.32, 0.72, 0, 1] }}
            >
              <span className="text-gradient-hero block">Highlife</span>
              <span className="text-gradient-hero block">Life</span>
            </motion.h1>

            <motion.p
              className="text-silver text-base sm:text-lg max-w-2xl mx-auto mb-9 leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.45, ease: [0.32, 0.72, 0, 1] }}
            >
              A curated booking home for live moments, music drops, and the culture
              around them. Built for venues, promoters, and talent buyers ready to
              move rooms.
            </motion.p>

            {/* Pill chips */}
            <motion.div
              className="flex flex-wrap items-center justify-center gap-2.5 mb-10"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.55, ease: [0.32, 0.72, 0, 1] }}
            >
              {verticals.map((v) => (
                <span key={v} className="chip">
                  {v}
                </span>
              ))}
            </motion.div>

            {/* Triple CTA row */}
            <motion.div
              className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-3xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.7, ease: [0.32, 0.72, 0, 1] }}
            >
              <Link
                href="/roster"
                className="group flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-black/40 hover:bg-black/55 hover:border-white/20 px-5 py-4 text-xs tracking-[0.18em] uppercase font-semibold transition-all duration-300"
              >
                <span>Browse the Roster</span>
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/book"
                className="group flex items-center justify-center gap-2 rounded-2xl btn-gradient px-5 py-4 text-xs tracking-[0.18em] uppercase font-bold"
              >
                <span>Book Talent</span>
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/find-an-agent"
                className="group flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-black/40 hover:bg-black/55 hover:border-white/20 px-5 py-4 text-xs tracking-[0.18em] uppercase font-semibold transition-all duration-300"
              >
                <span>Find An Agent</span>
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </motion.div>

            <motion.p
              className="mt-7 text-[11px] tracking-[0.2em] uppercase text-zinc-500"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1, duration: 0.8 }}
            >
              Inquiry-based bookings · Venues & promoters only
            </motion.p>
          </motion.div>
        </div>

        {/* Logo ticker pinned to bottom */}
        <div className="absolute bottom-0 left-0 right-0 border-t border-white/5 bg-black/40 backdrop-blur py-5 overflow-hidden">
          <div className="ticker-track">
            {Array.from({ length: 14 }).map((_, i) => (
              <span key={i} className="relative w-12 h-12 inline-block opacity-90">
                <Image
                  src="/logo.png"
                  alt=""
                  fill
                  sizes="48px"
                  className="object-contain"
                  priority={i < 2}
                />
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Artist marquee */}
      <section className="border-y border-border/30 py-4 overflow-hidden bg-charcoal/50">
        <div className="animate-marquee flex whitespace-nowrap">
          {[...artists, ...artists].map((artist, i) => (
            <span key={i} className="mx-8 text-sm tracking-[0.2em] uppercase text-muted">
              {artist.name}
              <span className="mx-8 text-border/50">/</span>
            </span>
          ))}
        </div>
      </section>

      {/* About */}
      <section className="py-24 lg:py-32">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <ScrollReveal>
              <span className="chip mb-6 inline-flex">About the Label</span>
              <h2 className="font-display uppercase text-5xl md:text-6xl tracking-tight mb-8 leading-[0.95]">
                Talent that{" "}
                <span className="text-gradient-hero">moves rooms.</span>
              </h2>
              <p className="text-silver leading-relaxed text-base mb-6">
                HighLife Records is the booking and artist development arm of the
                HighLife ecosystem — connecting venues, promoters, brands, and
                private clients with talent built for unforgettable rooms.
              </p>
              <p className="text-silver leading-relaxed text-base">
                From intimate showcases to high-energy nightlife, we curate
                artists with sound, presence, professionalism, and cultural pull.
              </p>
            </ScrollReveal>

            <ScrollReveal delay={0.2}>
              <div className="relative aspect-[4/5] bg-card border border-border/30 overflow-hidden rounded-2xl">
                <div
                  className="absolute inset-0 bg-cover bg-center img-bw"
                  style={{
                    backgroundImage: "url(https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=800&q=80)",
                  }}
                  role="img"
                  aria-label="Live concert atmosphere"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(236,72,153,0.25),transparent_60%)] mix-blend-screen" />
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Booking Funnel */}
      <section className="py-24 lg:py-32 border-t border-border/20 bg-charcoal/30">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <ScrollReveal>
            <div className="text-center mb-16">
              <span className="chip mb-6 inline-flex">How It Works</span>
              <h2 className="font-display uppercase text-5xl md:text-6xl tracking-tight">
                From inquiry to{" "}
                <span className="text-gradient-hero">showtime.</span>
              </h2>
            </div>
          </ScrollReveal>

          <div className="grid md:grid-cols-5 gap-6">
            {steps.map((step, i) => (
              <ScrollReveal key={step.number} delay={i * 0.1}>
                <div className="relative p-6 border border-border/30 bg-card/50 hover:border-border hover:bg-card transition-all duration-500 h-full rounded-2xl">
                  <span className="font-display text-3xl text-gradient-hero block mb-4">
                    {step.number}
                  </span>
                  <h3 className="text-sm tracking-[0.1em] uppercase font-semibold mb-3">
                    {step.title}
                  </h3>
                  <p className="text-xs text-muted leading-relaxed">
                    {step.desc}
                  </p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Promoter Portal CTA */}
      <section className="py-24 lg:py-32 border-t border-border/20 bg-charcoal/30">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <ScrollReveal>
            <div className="max-w-2xl mx-auto text-center">
              <span className="chip mb-6 inline-flex">For Venues & Promoters</span>
              <h2 className="font-display uppercase text-5xl md:text-6xl tracking-tight mb-6 leading-[1]">
                Built for venues, promoters,{" "}
                <span className="text-gradient-hero">cultural operators.</span>
              </h2>
              <p className="text-silver leading-relaxed mb-10">
                Log in to browse bookable artists, track inquiries, and manage
                booking conversations with the HighLife Records team.
              </p>
              <Link
                href="/login"
                className="group inline-flex items-center gap-3 px-8 py-3.5 btn-gradient text-xs tracking-[0.18em] uppercase font-bold rounded-full"
              >
                Partner Login
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-32 lg:py-40 border-t border-border/20 relative overflow-hidden bg-radial-atmosphere">
        <div className="relative z-10 max-w-3xl mx-auto px-6 text-center">
          <ScrollReveal>
            <h2 className="font-display uppercase text-6xl md:text-7xl lg:text-8xl tracking-tight mb-10 leading-[0.95]">
              Bring{" "}
              <span className="text-gradient-hero">HighLife</span>{" "}
              <br />
              to your room.
            </h2>
            <Link
              href="/book"
              className="group inline-flex items-center gap-3 px-10 py-4 btn-gradient text-xs tracking-[0.18em] uppercase font-bold rounded-full"
            >
              Start a Booking Request
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </ScrollReveal>
        </div>
      </section>
    </div>
  );
}
