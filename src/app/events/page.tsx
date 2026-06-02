"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ScrollReveal } from "@/components/ScrollReveal";
import { EventCard } from "@/components/EventCard";
import { events } from "@/lib/data";

export default function EventsPage() {
  const upcoming = events.filter((e) => !e.isPast);
  const past = events.filter((e) => e.isPast);

  return (
    <div className="bg-radial-atmosphere min-h-screen">
      <div className="pt-32 pb-24">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          {/* Header */}
          <ScrollReveal>
            <div className="mb-16">
              <span className="chip mb-6">Live Experiences</span>
              <h1 className="font-display uppercase text-5xl md:text-7xl tracking-tight leading-[0.95] mb-5">
                <span className="text-gradient-hero">Events</span>
              </h1>
              <p className="text-silver max-w-xl leading-relaxed text-base">
                Premium live showcases, intimate sessions, and private industry
                events powered by HighLife Live.
              </p>
            </div>
          </ScrollReveal>

          {/* Upcoming */}
          <div className="mb-20">
            <ScrollReveal>
              <h2 className="text-[10px] tracking-[0.22em] uppercase text-zinc-400 mb-6">
                Upcoming Events
              </h2>
            </ScrollReveal>
            <div className="grid gap-4">
              {upcoming.map((event, i) => (
                <EventCard key={event.id} event={event} index={i} />
              ))}
            </div>
          </div>

          {/* Past Events */}
          <div className="mb-20">
            <ScrollReveal>
              <h2 className="text-[10px] tracking-[0.22em] uppercase text-zinc-400 mb-6">
                Past Events
              </h2>
            </ScrollReveal>
            <div className="grid gap-4">
              {past.map((event, i) => (
                <EventCard key={event.id} event={event} index={i} />
              ))}
            </div>
          </div>

          {/* CTA */}
          <ScrollReveal>
            <div className="glass-card rounded-3xl p-10 md:p-14 text-center">
              <h2 className="font-display uppercase text-3xl md:text-5xl tracking-tight leading-[0.95] mb-5">
                Book HighLife for{" "}
                <span className="text-gradient-hero">your event.</span>
              </h2>
              <p className="text-silver text-sm md:text-base max-w-lg mx-auto mb-8 leading-relaxed">
                Planning a showcase, brand activation, or private event? Let
                HighLife Live curate the talent for your room.
              </p>
              <Link
                href="/book"
                className="group inline-flex items-center gap-3 px-8 py-3.5 btn-gradient text-xs tracking-[0.18em] uppercase font-bold rounded-full"
              >
                Submit Event Inquiry
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </div>
  );
}
