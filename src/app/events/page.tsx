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
    <div className="pt-28 pb-24">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Header */}
        <ScrollReveal>
          <div className="mb-16">
            <span className="text-[10px] tracking-[0.3em] uppercase text-muted border border-border/50 px-3 py-1 mb-6 inline-block">
              Live Experiences
            </span>
            <h1 className="font-serif text-5xl md:text-6xl font-light tracking-tight mb-4">
              Events
            </h1>
            <p className="text-silver max-w-xl leading-relaxed">
              Premium live showcases, intimate sessions, and private industry
              events powered by HighLife Live.
            </p>
          </div>
        </ScrollReveal>

        {/* Upcoming */}
        <div className="mb-20">
          <ScrollReveal>
            <h2 className="text-xs tracking-[0.2em] uppercase text-muted mb-8">
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
            <h2 className="text-xs tracking-[0.2em] uppercase text-muted mb-8">
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
          <div className="border border-border/30 bg-card p-8 md:p-12 text-center">
            <h2 className="font-serif text-3xl md:text-4xl font-light mb-4">
              Book HighLife for{" "}
              <span className="italic text-silver">your event.</span>
            </h2>
            <p className="text-silver text-sm max-w-lg mx-auto mb-8 leading-relaxed">
              Planning a showcase, brand activation, or private event? Let
              HighLife Live curate the talent for your room.
            </p>
            <Link
              href="/book"
              className="group inline-flex items-center gap-3 px-8 py-3.5 bg-foreground text-background text-sm tracking-[0.15em] uppercase font-medium rounded-full hover:bg-foreground/90 transition-all duration-300"
            >
              Submit Event Inquiry
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </ScrollReveal>
      </div>
    </div>
  );
}
