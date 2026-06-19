"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import type { Artist } from "@/lib/data";

interface ArtistCardProps {
  artist: Artist;
  index?: number;
}

export function ArtistCard({ artist, index = 0 }: ArtistCardProps) {
  const router = useRouter();
  const cardHref = artist.epkUrl ?? `/artists/${artist.slug}`;

  function handleCardClick(e: React.MouseEvent) {
    if ((e.target as HTMLElement).closest("[data-inquire]")) return;
    router.push(cardHref);
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.5, delay: index * 0.05, ease: [0.32, 0.72, 0, 1] }}
      className="group relative cursor-pointer"
      onClick={handleCardClick}
    >
      <div className="relative overflow-hidden bg-card border border-white/8 hover:border-white/18 transition-all duration-500 rounded-2xl">
        {/* Image */}
        <div className="relative aspect-[3/4] overflow-hidden">
          <div
            className={`absolute inset-0 bg-cover bg-center img-bw transition-transform duration-700 ${artist.epkUrl ? "group-hover:scale-105" : ""}`}
            style={{ backgroundImage: `url(${artist.image})` }}
            role="img"
            aria-label={`Photo of ${artist.name}`}
          />
        </div>

        {/* Info */}
        <div className="p-5">
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-display uppercase text-xl tracking-wide leading-tight">
              {artist.name}
            </h3>
            {artist.epkUrl && (
              <ArrowUpRight
                size={16}
                className="text-silver opacity-0 group-hover:opacity-100 transition-opacity duration-300 mt-1 flex-shrink-0"
              />
            )}
          </div>

          <div className="flex items-center gap-2 mb-3">
            <span className="text-[10px] tracking-[0.18em] uppercase text-silver">
              {artist.genre}
            </span>
          </div>

          <p className="text-sm text-zinc-400 leading-relaxed mb-5 line-clamp-2">
            {artist.shortDesc}
          </p>

          <div className="flex items-center gap-2">
            <Link
              href={cardHref}
              className="flex-1 text-center text-[10px] tracking-[0.18em] uppercase text-silver hover:text-foreground transition-colors px-3 py-2 rounded-full border border-white/10 hover:border-white/25"
              onClick={(e) => e.stopPropagation()}
            >
              {artist.epkUrl ? "View EPK" : "More Info"}
            </Link>
            <Link
              href={`/book?artist=${encodeURIComponent(artist.slug)}`}
              data-inquire
              className="flex-1 text-center text-[10px] tracking-[0.18em] uppercase btn-gradient px-3 py-2 rounded-full font-bold"
              onClick={(e) => e.stopPropagation()}
            >
              Inquire
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
