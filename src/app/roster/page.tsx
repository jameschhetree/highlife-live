"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArtistCard } from "@/components/ArtistCard";
import { ScrollReveal } from "@/components/ScrollReveal";
import type { Artist } from "@/lib/data";

// Phase 3.7 — Dok 2026-06-03: 'i need artists in the admin portal to show up
// on the roster page, link that.' /api/artists serves active+non-demo Artist rows
// from the DB. Categories now derived from the live data; All chip is always shown.
export default function RosterPage() {
  const [activeFilter, setActiveFilter] = useState("All");
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/artists", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : []))
      .then((data: Artist[]) => setArtists(Array.isArray(data) ? data : []))
      .catch(() => setArtists([]))
      .finally(() => setLoading(false));
  }, []);

  // Build the category filter list from the live data so categories without
  // any artists don't show empty chips, and new categories appear automatically.
  const categories = useMemo(() => {
    const set = new Set<string>(["All"]);
    for (const a of artists) if (a.category) set.add(a.category);
    return Array.from(set);
  }, [artists]);

  const filtered =
    activeFilter === "All"
      ? artists
      : artists.filter((a) => a.category === activeFilter);

  return (
    <div className="bg-radial-atmosphere min-h-screen">
      <div className="pt-32 pb-24">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          {/* Header */}
          <ScrollReveal>
            <div className="mb-14">
              <span className="chip mb-6">Entertainment Roster</span>
              <h1 className="font-display uppercase text-5xl md:text-7xl tracking-tight leading-[0.95] mb-5">
                The <span className="text-gradient-hero">Roster</span>
              </h1>
              <p className="text-silver max-w-xl leading-relaxed text-base">
                Curated talent built for unforgettable rooms. Browse our roster,
                filter by genre, and request a booking.
              </p>
            </div>
          </ScrollReveal>

          {/* Filters */}
          <ScrollReveal delay={0.1}>
            <div className="glass-card rounded-2xl p-2.5 mb-10 inline-flex flex-wrap gap-1.5">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveFilter(cat)}
                  className={`text-[10px] tracking-[0.18em] uppercase px-4 py-2 rounded-full transition-colors ${
                    activeFilter === cat
                      ? "bg-foreground text-background"
                      : "text-silver hover:text-foreground hover:bg-white/5"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </ScrollReveal>

          {/* Grid */}
          <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <AnimatePresence mode="popLayout">
              {filtered.map((artist, i) => (
                <ArtistCard key={artist.slug} artist={artist} index={i} />
              ))}
            </AnimatePresence>
          </motion.div>

          {filtered.length === 0 && (
            <div className="glass-card rounded-2xl text-center py-24">
              <p className="text-zinc-400 text-sm">
                {loading
                  ? "Loading roster..."
                  : artists.length === 0
                  ? "The roster is currently being assembled. Check back soon."
                  : "No artists found in this category."}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
