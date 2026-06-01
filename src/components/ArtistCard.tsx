"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { MapPin, ArrowUpRight } from "lucide-react";
import type { Artist } from "@/lib/data";

interface ArtistCardProps {
  artist: Artist;
  index?: number;
}

export function ArtistCard({ artist, index = 0 }: ArtistCardProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.5, delay: index * 0.05, ease: [0.32, 0.72, 0, 1] }}
      className="group relative"
    >
      <div className="relative overflow-hidden bg-card border border-white/8 hover:border-white/18 transition-all duration-500 rounded-2xl">
        {/* Image */}
        <div className="relative aspect-[3/4] overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center img-bw transition-transform duration-700 group-hover:scale-105"
            style={{ backgroundImage: `url(${artist.image})` }}
            role="img"
            aria-label={`Photo of ${artist.name}`}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_15%,rgba(236,72,153,0.18),transparent_60%)] mix-blend-screen opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

          {/* Availability Badge */}
          <div className="absolute top-4 right-4">
            <span
              className={`text-[10px] tracking-[0.2em] uppercase px-3 py-1 rounded-full backdrop-blur ${
                artist.available
                  ? "bg-emerald-400/15 text-emerald-300 border border-emerald-400/30"
                  : "bg-zinc-700/50 text-zinc-300 border border-zinc-600/40"
              }`}
            >
              {artist.available ? "Available" : "Booked"}
            </span>
          </div>
        </div>

        {/* Info */}
        <div className="p-5">
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-display uppercase text-xl tracking-wide leading-tight">
              {artist.name}
            </h3>
            <ArrowUpRight
              size={16}
              className="text-silver opacity-0 group-hover:opacity-100 transition-opacity duration-300 mt-1 flex-shrink-0"
            />
          </div>

          <div className="flex items-center gap-2 mb-3">
            <span className="text-[10px] tracking-[0.18em] uppercase text-silver">
              {artist.genre}
            </span>
            <span className="text-border">|</span>
            <span className="text-xs text-silver flex items-center gap-1">
              <MapPin size={10} />
              {artist.city}
            </span>
          </div>

          <p className="text-sm text-zinc-400 leading-relaxed mb-5 line-clamp-2">
            {artist.shortDesc}
          </p>

          <div className="flex items-center gap-2">
            <Link
              href={`/artists/${artist.slug}`}
              className="flex-1 text-center text-[10px] tracking-[0.18em] uppercase text-silver hover:text-foreground transition-colors px-3 py-2 rounded-full border border-white/10 hover:border-white/25"
            >
              More Info
            </Link>
            <Link
              href={`/book?artist=${encodeURIComponent(artist.slug)}`}
              className="flex-1 text-center text-[10px] tracking-[0.18em] uppercase btn-gradient px-3 py-2 rounded-full font-bold"
            >
              Inquire
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
