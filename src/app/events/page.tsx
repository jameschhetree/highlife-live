"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, MapPin, Ticket } from "lucide-react";
import { ScrollReveal } from "@/components/ScrollReveal";

type EventItem = {
  id: string;
  title: string;
  date: string;
  city: string;
  venue: string;
  featuredArtists: string[];
  ticketStatus: "Available" | "Limited" | "Sold Out";
  ticketUrl?: string | null;
  isPast: boolean;
};

// Fallback seed events shown when the DB has nothing published yet.
// Owners can replace these by adding rows through /admin/events.
const seedEvents: EventItem[] = [
  {
    id: "evt-1",
    title: "HighLife Sessions ATL",
    date: "June 21, 2026",
    city: "Atlanta, GA",
    venue: "The Velvet Room",
    featuredArtists: ["Foolery"],
    ticketStatus: "Available" as const,
    isPast: false,
  },
  {
    id: "evt-2",
    title: "Black Room Showcase",
    date: "July 12, 2026",
    city: "Washington, DC",
    venue: "The Anthem (Private Floor)",
    featuredArtists: ["Foolery"],
    ticketStatus: "Limited" as const,
    isPast: false,
  },
  {
    id: "evt-3",
    title: "HighLife Live Night",
    date: "August 2, 2026",
    city: "Baltimore, MD",
    venue: "Ottobar",
    featuredArtists: ["Foolery"],
    ticketStatus: "Available" as const,
    isPast: false,
  },
];

const statusColors = {
  Available: "text-emerald-300 bg-emerald-400/10 border-emerald-400/30",
  Limited: "text-amber-300 bg-amber-400/10 border-amber-400/30",
  "Sold Out": "text-zinc-400 bg-zinc-400/10 border-zinc-400/30",
};

// Per-city visual theme — each city gets its own banner gradient + accent.
// Falls back to a neutral theme for unknown cities.
const cityThemes: Record<string, { gradient: string; accent: string; tag: string }> = {
  "Atlanta, GA":     { gradient: "from-[#1a0d1f] via-[#2a0b2e] to-[#0f1115]", accent: "via-pink-500/55", tag: "ATL" },
  "Washington, DC":  { gradient: "from-[#0a1a2e] via-[#0b1730] to-[#0f1115]", accent: "via-sky-400/55",  tag: "DC" },
  "Baltimore, MD":   { gradient: "from-[#1a1207] via-[#2a1808] to-[#0f1115]", accent: "via-amber-400/55", tag: "BAL" },
};
const defaultTheme = { gradient: "from-[#0f1115] to-[#131620]", accent: "via-violet-500/45", tag: "" };

type SortKey = "date" | "city" | "artist";

export default function EventsPage() {
  const [events, setEvents] = useState<EventItem[]>(seedEvents);
  const [cityFilter, setCityFilter] = useState("All");
  const [artistFilter, setArtistFilter] = useState("All");
  const [sortBy, setSortBy] = useState<SortKey>("date");

  // Pull DB-backed events on mount; if any published rows exist, they REPLACE
  // the seed list. If the DB is empty or unreachable, seed stays.
  useEffect(() => {
    fetch("/api/events")
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) setEvents(data);
      })
      .catch(() => { /* keep seed */ });
  }, []);

  const allCities = ["All", ...Array.from(new Set(events.map((e) => e.city)))];
  const allArtists = ["All", ...Array.from(new Set(events.flatMap((e) => e.featuredArtists)))];

  const filtered = events
    .filter((e) => {
      if (cityFilter !== "All" && e.city !== cityFilter) return false;
      if (artistFilter !== "All" && !e.featuredArtists.includes(artistFilter)) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "city") return a.city.localeCompare(b.city);
      if (sortBy === "artist") return (a.featuredArtists[0] ?? "").localeCompare(b.featuredArtists[0] ?? "");
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });

  const upcoming = filtered.filter((e) => !e.isPast);
  const past = filtered.filter((e) => e.isPast);

  return (
    <div className="bg-radial-atmosphere min-h-screen">
      <div className="pt-32 pb-24">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          {/* Header */}
          <ScrollReveal>
            <div className="mb-10">
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

          {/* Filters — each chip group flex-wraps so nothing overflows on mobile */}
          <ScrollReveal delay={0.1}>
            <div className="space-y-3 mb-10">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[9px] tracking-[0.18em] uppercase text-zinc-500 shrink-0">City:</span>
                {allCities.map((c) => (
                  <button
                    key={c}
                    onClick={() => setCityFilter(c)}
                    className={`text-[10px] tracking-[0.18em] uppercase px-3 py-1.5 rounded-full border transition-colors ${
                      cityFilter === c
                        ? "bg-foreground text-background border-foreground"
                        : "text-zinc-400 border-white/10 hover:border-white/25"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[9px] tracking-[0.18em] uppercase text-zinc-500 shrink-0">Artist:</span>
                {allArtists.map((a) => (
                  <button
                    key={a}
                    onClick={() => setArtistFilter(a)}
                    className={`text-[10px] tracking-[0.18em] uppercase px-3 py-1.5 rounded-full border transition-colors ${
                      artistFilter === a
                        ? "bg-foreground text-background border-foreground"
                        : "text-zinc-400 border-white/10 hover:border-white/25"
                    }`}
                  >
                    {a}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[9px] tracking-[0.18em] uppercase text-zinc-500 shrink-0">Sort:</span>
                {(["date", "artist", "city"] as SortKey[]).map((key) => (
                  <button
                    key={key}
                    onClick={() => setSortBy(key)}
                    className={`text-[10px] tracking-[0.18em] uppercase px-3 py-1.5 rounded-full border transition-colors ${
                      sortBy === key
                        ? "bg-foreground text-background border-foreground"
                        : "text-zinc-400 border-white/10 hover:border-white/25"
                    }`}
                  >
                    By {key.charAt(0).toUpperCase() + key.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </ScrollReveal>

          {/* Upcoming Events -- Banner style */}
          {upcoming.length > 0 && (
            <div className="mb-16">
              <ScrollReveal>
                <h2 className="text-[10px] tracking-[0.22em] uppercase text-zinc-400 mb-6">
                  Upcoming Events
                </h2>
              </ScrollReveal>
              <div className="space-y-4">
                <AnimatePresence mode="popLayout">
                  {upcoming.map((event, i) => {
                    const theme = cityThemes[event.city] ?? defaultTheme;
                    // Parse date for the calendar plinth (e.g. "June 21, 2026" → "JUN" / "21")
                    const parsed = new Date(event.date);
                    const monthLabel = isNaN(parsed.getTime())
                      ? event.date.split(" ")[0]?.slice(0, 3).toUpperCase()
                      : parsed.toLocaleString("en-US", { month: "short" }).toUpperCase();
                    const dayLabel = isNaN(parsed.getTime())
                      ? ""
                      : String(parsed.getDate());
                    return (
                      <motion.div
                        key={event.id}
                        layout
                        initial={{ opacity: 0, y: 24 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -12 }}
                        transition={{ duration: 0.5, delay: i * 0.06, ease: [0.32, 0.72, 0, 1] }}
                        className={`group relative overflow-hidden rounded-2xl border border-white/8 bg-gradient-to-br ${theme.gradient} hover:border-white/15 transition-all duration-500`}
                      >
                        {/* Top accent line — per-city color */}
                        <div className={`absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent ${theme.accent} to-transparent`} />
                        {/* Left edge banner stripe — bold per-city color */}
                        <div className={`absolute top-0 left-0 bottom-0 w-1 bg-gradient-to-b from-transparent ${theme.accent} to-transparent`} />

                        <div className="p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center gap-6">
                          {/* Date plinth — calendar-tear style */}
                          <div className="shrink-0 flex flex-col items-center justify-center px-5 py-3 rounded-xl bg-black/40 border border-white/8 min-w-[78px]">
                            <span className="text-[10px] tracking-[0.22em] uppercase text-zinc-400 leading-none mb-1">{monthLabel}</span>
                            <span className="font-display text-3xl text-foreground leading-none">{dayLabel}</span>
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                              {theme.tag && (
                                <span className="text-[9px] tracking-[0.22em] uppercase text-zinc-500 font-semibold">
                                  {theme.tag}
                                </span>
                              )}
                              <span className={`text-[10px] tracking-[0.2em] uppercase px-2.5 py-1 rounded-full border ${statusColors[event.ticketStatus]}`}>
                                {event.ticketStatus}
                              </span>
                            </div>
                            <h3 className="font-display uppercase text-2xl sm:text-3xl tracking-tight mb-2 text-gradient-hero">
                              {event.title}
                            </h3>
                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-silver">
                              <span className="flex items-center gap-1.5">
                                <MapPin size={13} strokeWidth={1.5} />
                                {event.venue} · {event.city}
                              </span>
                              <span className="flex items-center gap-1.5 text-zinc-500">
                                <Calendar size={13} strokeWidth={1.5} />
                                {event.date}
                              </span>
                            </div>
                            {event.featuredArtists.length > 0 && (
                              <div className="flex flex-wrap gap-2 mt-3">
                                {event.featuredArtists.map((artist) => (
                                  <span
                                    key={artist}
                                    className="text-[10px] tracking-[0.15em] uppercase px-3 py-1 rounded-full bg-white/5 border border-white/8 text-zinc-300"
                                  >
                                    {artist}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>

                          {event.ticketStatus !== "Sold Out" && (
                            event.ticketUrl ? (
                              <a
                                href={event.ticketUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="shrink-0 self-stretch sm:self-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full btn-gradient text-xs tracking-[0.18em] uppercase font-bold"
                              >
                                <Ticket size={14} />
                                Buy Tickets
                              </a>
                            ) : (
                              <button
                                disabled
                                className="shrink-0 self-stretch sm:self-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-white/5 border border-white/10 text-zinc-400 text-xs tracking-[0.18em] uppercase font-bold cursor-not-allowed"
                                title="Tickets coming soon"
                              >
                                <Ticket size={14} />
                                Tickets Soon
                              </button>
                            )
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </div>
          )}

          {/* Past Events */}
          {past.length > 0 && (
            <div className="mb-16">
              <ScrollReveal>
                <h2 className="text-[10px] tracking-[0.22em] uppercase text-zinc-400 mb-6">
                  Past Events
                </h2>
              </ScrollReveal>
              <div className="space-y-3">
                {past.map((event, i) => (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: i * 0.05 }}
                    className="rounded-2xl border border-white/5 bg-[#0c0d12] p-5 sm:p-6 opacity-70"
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div>
                        <h3 className="font-serif text-lg text-zinc-300 mb-1">{event.title}</h3>
                        <div className="flex flex-wrap gap-3 text-xs text-zinc-500">
                          <span>{event.date}</span>
                          <span>{event.city}</span>
                          <span>{event.venue}</span>
                        </div>
                      </div>
                      <span className="text-[10px] tracking-[0.2em] uppercase text-zinc-500 border border-zinc-700 rounded-full px-2.5 py-1">
                        {event.ticketStatus}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {filtered.length === 0 && (
            <div className="glass-card rounded-2xl text-center py-20">
              <p className="text-zinc-400 text-sm">
                No events match the current filters.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
