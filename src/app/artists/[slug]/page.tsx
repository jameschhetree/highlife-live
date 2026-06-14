"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  MapPin,
  Music,
  Plane,
  Calendar,
  Download,
  Play,
  Pause,
  ArrowLeft,
  ArrowRight,
  Lock,
} from "lucide-react";
import { ScrollReveal } from "@/components/ScrollReveal";
import type { Artist } from "@/lib/data";
import { isAuthenticated } from "@/lib/auth";

const dummyTracks = [
  { title: "Midnight Session", duration: "3:42" },
  { title: "Crown Heights", duration: "4:15" },
  { title: "No Ceiling", duration: "3:28" },
  { title: "Culture Code", duration: "4:01" },
];

const galleryImages = [
  "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=400&q=80",
  "https://images.unsplash.com/photo-1524368535928-5b5e00ddc76b?w=400&q=80",
  "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=400&q=80",
  "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&q=80",
];

export default function ArtistDetailPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const [artist, setArtist] = useState<Artist | null>(null);
  const [loading, setLoading] = useState(true);
  const [playingTrack, setPlayingTrack] = useState<number | null>(null);
  // NOTE: Venue auth uses the VenueLogin system via isAuthenticated().
  // This checks localStorage for a venue/promoter session token set during partner login.
  // If no venue auth session exists, restricted fields are hidden from public visitors.
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setAuthed(isAuthenticated());
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  // Pull artist from DB via /api/artists; match by slug.
  useEffect(() => {
    if (!slug) return;
    fetch("/api/artists", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : []))
      .then((rows: Artist[]) => {
        const found = Array.isArray(rows) ? rows.find((a) => a.slug === slug) : null;
        setArtist(found ?? null);
      })
      .catch(() => setArtist(null))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-radial-atmosphere pt-32 pb-24 flex items-center justify-center">
        <span className="text-xs tracking-[0.18em] uppercase text-silver">Loading...</span>
      </div>
    );
  }

  if (!artist) {
    return (
      <div className="min-h-screen bg-radial-atmosphere pt-32 pb-24 flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-display uppercase text-4xl mb-4">Artist Not Found</h1>
          <Link
            href="/roster"
            className="text-xs tracking-[0.18em] uppercase text-silver hover:text-foreground"
          >
            Back to Roster
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-radial-atmosphere min-h-screen pt-28 pb-24">
      <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
        <Link
          href="/roster"
          className="inline-flex items-center gap-2 text-xs tracking-[0.18em] uppercase text-silver hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft size={13} />
          Back to Roster
        </Link>

        {/* Hero */}
        <div className="grid lg:grid-cols-2 gap-12 mb-20">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, ease: [0.32, 0.72, 0, 1] }}
            className="relative aspect-[3/4] overflow-hidden rounded-2xl border border-white/8"
          >
            <div
              className="absolute inset-0 bg-cover bg-center img-bw"
              style={{ backgroundImage: `url(${artist.image})` }}
              role="img"
              aria-label={`Portrait of ${artist.name}`}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/70 to-transparent" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_15%,rgba(236,72,153,0.22),transparent_60%)] mix-blend-screen" />

            <div className="absolute top-5 right-5">
              <span
                className={`text-[10px] tracking-[0.2em] uppercase px-3 py-1.5 rounded-full backdrop-blur ${
                  artist.available
                    ? "bg-emerald-400/15 text-emerald-300 border border-emerald-400/30"
                    : "bg-zinc-700/50 text-zinc-300 border border-zinc-600/40"
                }`}
              >
                {artist.available ? "Available for Booking" : "Currently Booked"}
              </span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.15, ease: [0.32, 0.72, 0, 1] }}
          >
            <span className="chip mb-5 inline-flex">{artist.genre}</span>

            <h1 className="font-display uppercase text-5xl md:text-6xl tracking-tight leading-[0.92] mb-5">
              <span className="text-gradient-hero">{artist.name}</span>
            </h1>

            <div className="flex items-center gap-4 mb-8 text-sm text-zinc-400">
              {artist.city && (
                <>
                  <span className="flex items-center gap-1.5">
                    <MapPin size={13} strokeWidth={1.5} />
                    {artist.city}
                  </span>
                  <span className="text-border">|</span>
                </>
              )}
              {/* Travel availability -- visible only to authenticated venue partners */}
              {authed && artist.travelAvailability && (
                <span className="flex items-center gap-1.5">
                  <Plane size={13} strokeWidth={1.5} />
                  {artist.travelAvailability}
                </span>
              )}
            </div>

            <p className="text-silver leading-relaxed mb-8">{artist.bio}</p>

            {/* Performance Types -- visible only to authenticated venue partners */}
            {authed && artist.performanceTypes.length > 0 && (
              <div className="mb-8">
                <div className="text-[10px] tracking-[0.22em] uppercase text-zinc-500 mb-3">
                  Performance Types
                </div>
                <div className="flex flex-wrap gap-2">
                  {artist.performanceTypes.map((type) => (
                    <span key={type} className="chip">
                      {type}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Past Events */}
            {artist.pastEvents.length > 0 && (
              <div className="mb-8">
                <div className="text-[10px] tracking-[0.22em] uppercase text-zinc-500 mb-3">
                  Past Events
                </div>
                <div className="flex flex-col gap-2">
                  {artist.pastEvents.map((evt) => (
                    <span
                      key={evt}
                      className="flex items-center gap-2 text-sm text-zinc-300"
                    >
                      <Calendar size={12} strokeWidth={1.5} className="text-pink-300" />
                      {evt}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* CTAs */}
            <div className="flex flex-wrap gap-3">
              {authed ? (
                <Link
                  href={`/book?artist=${encodeURIComponent(artist.slug)}`}
                  className="flex items-center gap-2 px-7 py-3.5 btn-gradient text-xs tracking-[0.18em] uppercase font-bold rounded-full"
                >
                  Book Now
                  <ArrowRight size={14} />
                </Link>
              ) : (
                <Link
                  href={`/book?artist=${encodeURIComponent(artist.slug)}`}
                  className="flex items-center gap-2 px-7 py-3.5 border border-white/15 hover:border-white/30 bg-black/40 hover:bg-black/55 text-xs tracking-[0.18em] uppercase font-semibold rounded-full transition-colors"
                >
                  Submit an Inquiry
                  <ArrowRight size={14} />
                </Link>
              )}
              {artist.epkUrl ? (
                <Link
                  href={artist.epkUrl}
                  className="flex items-center gap-2 px-6 py-3.5 border border-white/10 hover:border-white/25 text-xs tracking-[0.18em] uppercase text-zinc-300 hover:text-foreground rounded-full transition-colors"
                >
                  <Download size={13} />
                  Press Kit
                </Link>
              ) : (
                <button
                  className="flex items-center gap-2 px-6 py-3.5 border border-white/10 text-xs tracking-[0.18em] uppercase text-zinc-500 rounded-full cursor-not-allowed"
                  disabled
                >
                  <Download size={13} />
                  Press Kit Pending
                </button>
              )}
            </div>

            {!authed && (
              <p className="mt-4 text-xs text-zinc-500 inline-flex items-center gap-2">
                <Lock size={11} />
                Venue or promoter with an account?{" "}
                <Link
                  href="/login"
                  className="text-zinc-300 hover:text-foreground underline-offset-4 hover:underline ml-1"
                >
                  Sign in
                </Link>
              </p>
            )}
          </motion.div>
        </div>

        {/* Music Player */}
        <ScrollReveal>
          <div className="mb-20">
            <h2 className="font-display uppercase text-2xl mb-6 flex items-center gap-3">
              <Music size={18} strokeWidth={1.5} className="text-pink-300" />
              Featured Tracks
            </h2>
            <div className="glass-card rounded-2xl divide-y divide-white/8 overflow-hidden">
              {dummyTracks.map((track, i) => (
                <button
                  key={track.title}
                  onClick={() =>
                    setPlayingTrack(playingTrack === i ? null : i)
                  }
                  className="w-full flex items-center justify-between p-4 hover:bg-white/4 transition-colors text-left"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-pink-500/30 to-purple-500/20 flex items-center justify-center">
                      {playingTrack === i ? (
                        <Pause size={14} className="text-foreground" />
                      ) : (
                        <Play size={14} className="text-zinc-200 ml-0.5" />
                      )}
                    </div>
                    <div>
                      <div className="text-sm font-medium">{track.title}</div>
                      <div className="text-xs text-zinc-500">{artist.name}</div>
                    </div>
                  </div>
                  <span className="text-xs text-zinc-500">{track.duration}</span>
                </button>
              ))}
            </div>
            <p className="text-xs text-zinc-500 mt-3 italic">
              Demo player. Full streaming available on request.
            </p>
          </div>
        </ScrollReveal>

        {/* Gallery */}
        <ScrollReveal>
          <div className="mb-20">
            <h2 className="font-display uppercase text-2xl mb-6">Gallery</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {galleryImages.map((img, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08, duration: 0.5 }}
                  className="aspect-square overflow-hidden rounded-2xl border border-white/8"
                >
                  <div
                    className="w-full h-full bg-cover bg-center img-bw hover:scale-105 transition-transform duration-700"
                    style={{ backgroundImage: `url(${img})` }}
                    role="img"
                    aria-label={`${artist.name} performance photo ${i + 1}`}
                  />
                </motion.div>
              ))}
            </div>
          </div>
        </ScrollReveal>

        {/* Bottom CTA */}
        <ScrollReveal>
          <div className="text-center py-16 border-t border-white/10">
            <h2 className="font-display uppercase text-4xl md:text-5xl tracking-tight mb-6 leading-[0.95]">
              Book{" "}
              <span className="text-gradient-hero">{artist.name}</span>
            </h2>
            <Link
              href={`/book?artist=${encodeURIComponent(artist.slug)}`}
              className="inline-flex items-center gap-2 px-8 py-3.5 btn-gradient text-xs tracking-[0.18em] uppercase font-bold rounded-full"
            >
              {authed ? "Book Now" : "Submit an Inquiry"}
              <ArrowRight size={14} />
            </Link>
          </div>
        </ScrollReveal>
      </div>
    </div>
  );
}
