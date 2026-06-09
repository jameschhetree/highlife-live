"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, MapPin, Ticket, X, Info } from "lucide-react";
import { ScrollReveal } from "@/components/ScrollReveal";
import { StagedActionModal } from "@/components/admin/StagedActionModal";

type EventItem = {
  id: string;
  title: string;
  date: string;
  startAt?: string | null;
  city: string;
  venue: string;
  featuredArtists: string[];
  featuredArtistIds?: string[];
  externalArtists?: string[];
  ticketStatus: "Available" | "Limited" | "Sold Out";
  ticketUrl?: string | null;
  isPast: boolean;
  description?: string | null;
  showDescription?: boolean;
  address?: string | null;
  showAddress?: boolean;
};

// Phase 3.8 — no fake events seeded; /events is DB-only via /api/events. When
// owners haven't published anything, page shows a clean empty state rather than
// presenting placeholder shows as real (Dok: 'no fake data', Murd: 'should not
// show fake events as real').
const seedEvents: EventItem[] = [];

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
  // Staged ticket popup target — track which event triggered the modal so the body
  // can name the show. Phase 3.8 — replaces the prior disabled 'Tickets Soon' button.
  const [stagedTicketEvent, setStagedTicketEvent] = useState<EventItem | null>(null);
  // Right-side details drawer target — owner-curated description + public info.
  const [drawerEvent, setDrawerEvent] = useState<EventItem | null>(null);
  const currentYear = new Date().getFullYear();

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

  const sortByDate = (a: EventItem, b: EventItem) => {
    const aT = a.startAt ? new Date(a.startAt).getTime() : new Date(a.date).getTime();
    const bT = b.startAt ? new Date(b.startAt).getTime() : new Date(b.date).getTime();
    if (isNaN(aT) && isNaN(bT)) return 0;
    if (isNaN(aT)) return 1;
    if (isNaN(bT)) return -1;
    return aT - bT;
  };

  const filtered = events.filter((e) => {
    if (cityFilter !== "All" && e.city !== cityFilter) return false;
    if (artistFilter !== "All" && !e.featuredArtists.includes(artistFilter)) return false;
    return true;
  });

  const applySort = (list: EventItem[], pastDesc = false) =>
    [...list].sort((a, b) => {
      if (sortBy === "city") return a.city.localeCompare(b.city);
      if (sortBy === "artist")
        return (a.featuredArtists[0] ?? "").localeCompare(b.featuredArtists[0] ?? "");
      const diff = sortByDate(a, b);
      return pastDesc ? -diff : diff;
    });

  const upcoming = applySort(filtered.filter((e) => !e.isPast));
  const past = applySort(filtered.filter((e) => e.isPast), true);

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
                    const parsed = event.startAt ? new Date(event.startAt) : new Date(event.date);
                    const monthLabel = isNaN(parsed.getTime())
                      ? event.date.split(" ")[0]?.slice(0, 3).toUpperCase()
                      : parsed.toLocaleString("en-US", { month: "short" }).toUpperCase();
                    const dayLabel = isNaN(parsed.getTime())
                      ? ""
                      : String(parsed.getDate());
                    const yearLabel = isNaN(parsed.getTime()) ? "" : String(parsed.getFullYear());
                    const showYear = yearLabel && Number(yearLabel) !== currentYear;
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
                            {showYear && (
                              <span className="text-[9px] tracking-[0.22em] uppercase text-zinc-500 leading-none mt-1.5">
                                {yearLabel}
                              </span>
                            )}
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

                          <div className="shrink-0 self-stretch sm:self-auto flex flex-col gap-2">
                            {event.ticketStatus !== "Sold Out" && (
                              event.ticketUrl ? (
                                <a
                                  href={event.ticketUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full btn-gradient text-xs tracking-[0.18em] uppercase font-bold"
                                >
                                  <Ticket size={14} />
                                  Buy Tickets
                                </a>
                              ) : (
                                <button
                                  onClick={() => setStagedTicketEvent(event)}
                                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full border border-white/10 hover:border-white/25 bg-black/40 text-zinc-200 hover:text-foreground text-xs tracking-[0.18em] uppercase font-bold transition-colors"
                                >
                                  <Ticket size={14} />
                                  Tickets Soon
                                </button>
                              )
                            )}
                            <button
                              onClick={() => setDrawerEvent(event)}
                              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-full border border-white/8 hover:border-white/20 text-zinc-300 hover:text-foreground text-[11px] tracking-[0.18em] uppercase transition-colors"
                            >
                              <Info size={13} />
                              Event Details
                            </button>
                          </div>
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

      {/* Event Details drawer — right-side slide-in, public info only */}
      <AnimatePresence>
        {drawerEvent && (
          <motion.div
            key="drawer-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
            onClick={() => setDrawerEvent(null)}
          >
            <motion.aside
              key="drawer-panel"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
              className="absolute right-0 top-0 bottom-0 w-full sm:max-w-md glass-card rounded-none sm:rounded-l-2xl border-l border-white/8 overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-label="Event details"
            >
              <div className="p-6 sm:p-8 space-y-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[10px] tracking-[0.22em] uppercase text-zinc-500 mb-2">
                      {drawerEvent.city}
                    </p>
                    <h2 className="font-display uppercase text-2xl leading-tight text-gradient-hero break-words">
                      {drawerEvent.title}
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDrawerEvent(null)}
                    className="text-zinc-400 hover:text-foreground p-1.5 rounded-lg border border-white/10 hover:border-white/25 transition-colors"
                    aria-label="Close"
                  >
                    <X size={14} />
                  </button>
                </div>

                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-3 text-silver">
                    <Calendar size={14} strokeWidth={1.5} className="mt-0.5 text-zinc-400 shrink-0" />
                    <span className="break-words">{drawerEvent.date}</span>
                  </div>
                  <div className="flex items-start gap-3 text-silver">
                    <MapPin size={14} strokeWidth={1.5} className="mt-0.5 text-zinc-400 shrink-0" />
                    <span className="break-words">
                      {drawerEvent.venue}
                      {drawerEvent.showAddress !== false && drawerEvent.address ? (
                        <>
                          {" — "}
                          <span className="text-zinc-400">{drawerEvent.address}</span>
                        </>
                      ) : null}
                    </span>
                  </div>
                  <div className="flex items-start gap-3 text-silver">
                    <Ticket size={14} strokeWidth={1.5} className="mt-0.5 text-zinc-400 shrink-0" />
                    <span>{drawerEvent.ticketStatus}</span>
                  </div>
                </div>

                {drawerEvent.showDescription !== false && (
                  <div>
                    <h3 className="text-[10px] tracking-[0.22em] uppercase text-zinc-400 mb-2">About</h3>
                    {drawerEvent.description ? (
                      <p className="text-sm text-zinc-200 leading-relaxed whitespace-pre-wrap break-words">
                        {drawerEvent.description}
                      </p>
                    ) : (
                      <p className="text-sm text-zinc-500 italic">More details coming soon.</p>
                    )}
                  </div>
                )}

                {drawerEvent.featuredArtists.length > 0 && (
                  <div>
                    <h3 className="text-[10px] tracking-[0.22em] uppercase text-zinc-400 mb-3">Featured</h3>
                    <div className="flex flex-wrap gap-2">
                      {drawerEvent.featuredArtists.map((artist) => (
                        <span
                          key={artist}
                          className="text-[10px] tracking-[0.15em] uppercase px-3 py-1 rounded-full bg-white/5 border border-white/8 text-zinc-300"
                        >
                          {artist}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {drawerEvent.ticketStatus !== "Sold Out" && (
                  <div className="pt-2">
                    {drawerEvent.ticketUrl ? (
                      <a
                        href={drawerEvent.ticketUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full btn-gradient text-xs tracking-[0.18em] uppercase font-bold"
                      >
                        <Ticket size={14} />
                        Buy Tickets
                      </a>
                    ) : (
                      <button
                        onClick={() => {
                          setStagedTicketEvent(drawerEvent);
                          setDrawerEvent(null);
                        }}
                        className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full border border-white/10 hover:border-white/25 bg-black/40 text-zinc-200 hover:text-foreground text-xs tracking-[0.18em] uppercase font-bold transition-colors"
                      >
                        <Ticket size={14} />
                        Tickets Soon
                      </button>
                    )}
                  </div>
                )}
              </div>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>

      <StagedActionModal
        open={!!stagedTicketEvent}
        onClose={() => setStagedTicketEvent(null)}
        title="Tickets coming soon"
        targetPhase="Phase 4.5"
        icon={<Ticket size={16} className="text-pink-200" />}
        body={
          stagedTicketEvent ? (
            <>
              <p>
                Ticketing for <strong className="text-foreground">{stagedTicketEvent.title}</strong> isn&apos;t live yet. We&apos;ll publish the ticket link the moment the venue confirms availability.
              </p>
              <p className="mt-2 text-xs text-zinc-400">
                Want a heads-up the second tickets drop? Subscribe via the footer email signup — we&apos;ll send a single notice, no spam.
              </p>
            </>
          ) : null
        }
      />
    </div>
  );
}
