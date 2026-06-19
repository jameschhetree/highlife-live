"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plane,
  Calendar,
  ArrowLeft,
  ArrowRight,
  Lock,
  ExternalLink,
  Link2,
  Image as ImageIcon,
  Play,
  X,
  Quote,
} from "lucide-react";
import { ScrollReveal } from "@/components/ScrollReveal";
import type { Artist } from "@/lib/data";
import { isAuthenticated } from "@/lib/auth";


export default function ArtistDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;
  const [artist, setArtist] = useState<Artist | null>(null);
  const [loading, setLoading] = useState(true);
  const [authed, setAuthed] = useState(false);
  const [showLinks, setShowLinks] = useState(false);
  const [showMedia, setShowMedia] = useState(false);
  const [playingVideo, setPlayingVideo] = useState<string | null>(null);

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

  // EPK auto-redirect: if artist has an epkUrl, redirect to it
  useEffect(() => {
    if (artist?.epkUrl) {
      router.replace(artist.epkUrl);
    }
  }, [artist, router]);

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

  // If epkUrl is set we are redirecting -- show loading state during redirect
  if (artist.epkUrl) {
    return (
      <div className="min-h-screen bg-radial-atmosphere pt-32 pb-24 flex items-center justify-center">
        <span className="text-xs tracking-[0.18em] uppercase text-silver">Redirecting to press kit...</span>
      </div>
    );
  }

  const imageAssets = (artist.assets ?? []).filter((a) =>
    a.mimeType.startsWith("image/")
  );
  const videoAssets = (artist.assets ?? []).filter((a) =>
    a.mimeType.startsWith("video/")
  );
  const hasAssets = imageAssets.length > 0 || videoAssets.length > 0;

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
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${artist.image})` }}
              role="img"
              aria-label={`Portrait of ${artist.name}`}
            />

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
              {/* Travel availability -- visible only to authenticated venue partners */}
              {authed && artist.travelAvailability && (
                <span className="flex items-center gap-1.5">
                  <Plane size={13} strokeWidth={1.5} />
                  {artist.travelAvailability}
                </span>
              )}
            </div>

            <p className="text-silver leading-relaxed mb-6">{artist.bio}</p>

            {/* Press Quotes */}
            {artist.pressQuotes && artist.pressQuotes.length > 0 && (
              <div className="mb-8">
                <div className="space-y-3">
                  {artist.pressQuotes.map((quote, i) => (
                    <div
                      key={i}
                      className="border-l-2 border-pink-500/30 pl-4 py-1"
                    >
                      <p className="text-sm text-zinc-300 italic flex items-start gap-2">
                        <Quote size={12} className="text-pink-400/60 mt-0.5 shrink-0" />
                        {quote}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Partner-only detail pills */}
            {authed && (
              <div className="mb-8">
                <div className="flex flex-wrap gap-2">
                  {artist.cleanExplicit && (
                    <span className="text-[9px] tracking-[0.16em] uppercase px-3 py-1.5 rounded-full border border-white/10 bg-black/40 text-zinc-400">
                      {artist.cleanExplicit}
                    </span>
                  )}
                  {artist.performanceType && (
                    <span className="text-[9px] tracking-[0.16em] uppercase px-3 py-1.5 rounded-full border border-white/10 bg-black/40 text-zinc-400">
                      {artist.performanceType}
                    </span>
                  )}
                  {artist.typicalSetLength && (
                    <span className="text-[9px] tracking-[0.16em] uppercase px-3 py-1.5 rounded-full border border-white/10 bg-black/40 text-zinc-400">
                      {artist.typicalSetLength}
                    </span>
                  )}
                  {artist.secondaryGenres && artist.secondaryGenres.map((g) => (
                    <span key={g} className="text-[9px] tracking-[0.16em] uppercase px-3 py-1.5 rounded-full border border-white/10 bg-black/40 text-zinc-400">
                      {g}
                    </span>
                  ))}
                </div>
              </div>
            )}

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

              {/* Show Links button */}
              {artist.links && artist.links.length > 0 && (
                <button
                  onClick={() => setShowLinks(true)}
                  className="flex items-center gap-2 px-6 py-3.5 border border-white/10 hover:border-white/25 text-xs tracking-[0.18em] uppercase text-zinc-300 hover:text-foreground rounded-full transition-colors"
                >
                  <Link2 size={13} />
                  Show Links
                </button>
              )}

              {/* Media button */}
              {hasAssets && (
                <button
                  onClick={() => setShowMedia(true)}
                  className="flex items-center gap-2 px-6 py-3.5 border border-white/10 hover:border-white/25 text-xs tracking-[0.18em] uppercase text-zinc-300 hover:text-foreground rounded-full transition-colors"
                >
                  <ImageIcon size={13} />
                  Media
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

      {/* Links Modal */}
      <AnimatePresence>
        {showLinks && artist.links && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => setShowLinks(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
              className="glass-card rounded-2xl p-6 w-full max-w-md mx-4 border border-white/10"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">
                  Links
                </h3>
                <button
                  onClick={() => setShowLinks(false)}
                  className="p-1.5 rounded-lg hover:bg-white/8 text-zinc-400 hover:text-foreground transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {artist.links.map((link, i) => (
                  <a
                    key={i}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-3 rounded-xl bg-white/4 hover:bg-white/8 border border-white/6 hover:border-white/12 transition-colors group"
                  >
                    <span className="text-sm text-zinc-200 group-hover:text-foreground transition-colors">
                      {link.title}
                    </span>
                    <ExternalLink size={13} className="text-zinc-500 group-hover:text-pink-300 transition-colors shrink-0" />
                  </a>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Media Panel */}
      <AnimatePresence>
        {showMedia && hasAssets && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-sm"
            onClick={() => { setShowMedia(false); setPlayingVideo(null); }}
          >
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 40 }}
              transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
              className="glass-card h-full w-full max-w-lg border-l border-white/10 p-6 overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">
                  Media
                </h3>
                <button
                  onClick={() => { setShowMedia(false); setPlayingVideo(null); }}
                  className="p-1.5 rounded-lg hover:bg-white/8 text-zinc-400 hover:text-foreground transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Image gallery */}
              {imageAssets.length > 0 && (
                <div className="mb-6">
                  <div className="text-[10px] tracking-[0.22em] uppercase text-zinc-500 mb-3">
                    Photos
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {imageAssets.map((asset) => (
                      <a
                        key={asset.id}
                        href={asset.blobUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="relative aspect-square overflow-hidden rounded-xl border border-white/8 hover:border-white/20 transition-colors group"
                      >
                        <img
                          src={asset.blobUrl}
                          alt={asset.filename}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Video gallery */}
              {videoAssets.length > 0 && (
                <div>
                  <div className="text-[10px] tracking-[0.22em] uppercase text-zinc-500 mb-3">
                    Videos
                  </div>
                  <div className="space-y-3">
                    {videoAssets.map((asset) => (
                      <div
                        key={asset.id}
                        className="relative rounded-xl overflow-hidden border border-white/8"
                      >
                        {playingVideo === asset.id ? (
                          <video
                            src={asset.blobUrl}
                            controls
                            autoPlay
                            className="w-full rounded-xl"
                          />
                        ) : (
                          <button
                            onClick={() => setPlayingVideo(asset.id)}
                            className="relative w-full aspect-video bg-black/60 flex items-center justify-center group"
                          >
                            <div className="w-14 h-14 rounded-full border-2 border-white/30 group-hover:border-white/60 bg-black/40 group-hover:bg-black/60 flex items-center justify-center transition-colors">
                              <Play size={20} className="text-white/70 group-hover:text-white ml-0.5" />
                            </div>
                            <span className="absolute bottom-3 left-3 text-[10px] tracking-[0.12em] text-zinc-400">
                              {asset.filename}
                            </span>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
