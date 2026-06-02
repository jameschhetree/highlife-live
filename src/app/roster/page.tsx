"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArtistCard } from "@/components/ArtistCard";
import { ScrollReveal } from "@/components/ScrollReveal";
import { artists, categories } from "@/lib/data";

export default function RosterPage() {
  const [activeFilter, setActiveFilter] = useState("All");

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
                No artists found in this category.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
