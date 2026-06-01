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
    <div className="pt-28 pb-24">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Header */}
        <ScrollReveal>
          <div className="mb-16">
            <span className="text-[10px] tracking-[0.3em] uppercase text-muted border border-border/50 px-3 py-1 mb-6 inline-block">
              Artist Roster
            </span>
            <h1 className="font-serif text-5xl md:text-6xl font-light tracking-tight mb-4">
              The Roster
            </h1>
            <p className="text-silver max-w-xl leading-relaxed">
              Curated talent built for unforgettable rooms. Browse our roster,
              filter by genre, and request a booking.
            </p>
          </div>
        </ScrollReveal>

        {/* Filters */}
        <ScrollReveal delay={0.1}>
          <div className="flex flex-wrap gap-2 mb-12">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveFilter(cat)}
                className={`text-xs tracking-[0.15em] uppercase px-4 py-2 border transition-all duration-300 ${
                  activeFilter === cat
                    ? "bg-foreground text-background border-foreground"
                    : "bg-transparent text-silver border-border hover:border-silver hover:text-foreground"
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
          <div className="text-center py-24">
            <p className="text-muted text-sm">
              No artists found in this category.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
