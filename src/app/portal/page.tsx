"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Clock,
  CheckCircle,
  Search,
  ArrowRight,
  Star,
  MessageSquare,
  LogOut,
  Plus,
  XCircle,
} from "lucide-react";
import { ScrollReveal } from "@/components/ScrollReveal";
import { isAuthenticated, logout, getUser } from "@/lib/auth";
import { artists } from "@/lib/data";
import { getBookings, type BookingSubmission } from "@/lib/bookings";

const statusConfig: Record<
  BookingSubmission["status"],
  { icon: typeof Clock; color: string; bg: string }
> = {
  "Pending Review": {
    icon: Clock,
    color: "text-amber-300",
    bg: "bg-amber-400/10 border-amber-400/20",
  },
  "Availability Check": {
    icon: Search,
    color: "text-sky-300",
    bg: "bg-sky-400/10 border-sky-400/20",
  },
  Confirmed: {
    icon: CheckCircle,
    color: "text-emerald-300",
    bg: "bg-emerald-400/10 border-emerald-400/20",
  },
  Declined: {
    icon: XCircle,
    color: "text-rose-300",
    bg: "bg-rose-400/10 border-rose-400/20",
  },
};

const savedSlugs = ["tone-brady", "nyla-vale"];

export default function PortalPage() {
  const router = useRouter();
  const [authed, setAuthed] = useState(false);
  const [checking, setChecking] = useState(true);
  const [userBookings, setUserBookings] = useState<BookingSubmission[]>([]);
  const [userName, setUserName] = useState("Promoter");

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace("/login");
      return;
    }
    setAuthed(true);
    setUserBookings(getBookings());
    const user = getUser();
    if (user?.name) setUserName(user.name);
    setChecking(false);
  }, [router]);

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  if (checking || !authed) {
    return (
      <div className="min-h-screen bg-radial-atmosphere flex items-center justify-center">
        <span className="text-[10px] tracking-[0.3em] uppercase text-zinc-500">
          Verifying access…
        </span>
      </div>
    );
  }

  const saved = artists.filter((a) => savedSlugs.includes(a.slug));
  const recommended = artists
    .filter((a) => !savedSlugs.includes(a.slug) && a.available)
    .slice(0, 3);

  return (
    <div className="min-h-screen bg-radial-atmosphere pt-28 pb-24">
      <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-12 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="chip mb-4 inline-flex">Partner Portal</span>
            <h1 className="font-display uppercase text-4xl md:text-5xl tracking-tight leading-[0.95] mb-2">
              Welcome back,{" "}
              <span className="text-gradient-hero">{userName}.</span>
            </h1>
            <p className="text-sm text-zinc-400">
              Manage your inquiries, track requests, and discover new talent.
            </p>
          </motion.div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-[10px] tracking-[0.18em] uppercase text-zinc-400 hover:text-foreground transition-colors mt-2"
          >
            <LogOut size={14} />
            Sign Out
          </button>
        </div>

        {/* Message */}
        <ScrollReveal>
          <div className="glass-card rounded-2xl p-5 mb-10 flex items-start gap-4">
            <MessageSquare size={18} className="text-pink-300 mt-0.5 flex-shrink-0" />
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium">HighLife Records Team</span>
                <span className="text-[10px] text-zinc-500">2 hours ago</span>
              </div>
              <p className="text-sm text-zinc-300 leading-relaxed">
                Welcome back. Your recent inquiries are visible below — we will
                follow up on any opportunity that aligns with the artist and
                event. Check out recommended artists for your upcoming dates.
              </p>
            </div>
          </div>
        </ScrollReveal>

        {/* User-submitted inquiries */}
        <ScrollReveal delay={0.1}>
          <div className="mb-12">
            <h2 className="text-[11px] tracking-[0.22em] uppercase text-zinc-400 mb-5">
              Your Inquiries
            </h2>
            {userBookings.length === 0 ? (
              <div className="glass-card rounded-2xl p-8 text-center">
                <p className="text-sm text-zinc-400 mb-5">
                  You have not submitted any inquiries yet.
                </p>
                <Link
                  href="/book"
                  className="inline-flex items-center gap-2 px-6 py-3 btn-gradient text-xs tracking-[0.18em] uppercase font-bold rounded-full"
                >
                  <Plus size={14} />
                  Start an inquiry
                </Link>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {userBookings
                  .slice()
                  .reverse()
                  .map((b) => {
                    const config = statusConfig[b.status];
                    const Icon = config.icon;
                    return (
                      <motion.div
                        key={b.id}
                        whileHover={{ y: -2 }}
                        className={`glass-card rounded-2xl p-5 border ${config.bg}`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-[10px] tracking-[0.18em] uppercase text-zinc-500">
                            #{b.id}
                          </span>
                          <Icon size={14} className={config.color} />
                        </div>
                        <h3 className="text-sm font-medium mb-1">{b.artistName}</h3>
                        <p className="text-xs text-zinc-500 mb-3">
                          {b.venueName} ·{" "}
                          {new Date(b.eventDate || b.submittedAt).toLocaleDateString()}
                        </p>
                        {b.eventDescription && (
                          <p className="text-xs text-zinc-400 leading-relaxed mb-4 line-clamp-2">
                            {b.eventDescription}
                          </p>
                        )}
                        <span
                          className={`text-[10px] tracking-[0.2em] uppercase font-semibold ${config.color}`}
                        >
                          {b.status}
                        </span>
                      </motion.div>
                    );
                  })}
              </div>
            )}
          </div>
        </ScrollReveal>

        {/* Two column */}
        <div className="grid lg:grid-cols-2 gap-6 mb-12">
          <ScrollReveal delay={0.2}>
            <h2 className="text-[11px] tracking-[0.22em] uppercase text-zinc-400 mb-5">
              Saved Artists
            </h2>
            <div className="space-y-3">
              {saved.map((artist) => (
                <Link
                  key={artist.slug}
                  href={`/artists/${artist.slug}`}
                  className="flex items-center justify-between p-4 glass-card rounded-2xl hover:border-white/18 transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className="w-12 h-12 rounded-xl bg-cover bg-center img-bw flex-shrink-0"
                      style={{ backgroundImage: `url(${artist.image})` }}
                      role="img"
                      aria-label={artist.name}
                    />
                    <div>
                      <h4 className="text-sm font-medium">{artist.name}</h4>
                      <p className="text-xs text-zinc-500">
                        {artist.genre} · {artist.city}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Star size={12} className="text-amber-300" fill="currentColor" />
                    <ArrowRight
                      size={14}
                      className="text-zinc-500 group-hover:text-foreground transition-colors"
                    />
                  </div>
                </Link>
              ))}
            </div>
          </ScrollReveal>

          <ScrollReveal delay={0.25}>
            <h2 className="text-[11px] tracking-[0.22em] uppercase text-zinc-400 mb-5">
              Recommended for You
            </h2>
            <div className="space-y-3">
              {recommended.map((artist) => (
                <Link
                  key={artist.slug}
                  href={`/artists/${artist.slug}`}
                  className="flex items-center justify-between p-4 glass-card rounded-2xl hover:border-white/18 transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className="w-12 h-12 rounded-xl bg-cover bg-center img-bw flex-shrink-0"
                      style={{ backgroundImage: `url(${artist.image})` }}
                      role="img"
                      aria-label={artist.name}
                    />
                    <div>
                      <h4 className="text-sm font-medium">{artist.name}</h4>
                      <p className="text-xs text-zinc-500">
                        {artist.genre} · {artist.city}
                      </p>
                    </div>
                  </div>
                  <ArrowRight
                    size={14}
                    className="text-zinc-500 group-hover:text-foreground transition-colors"
                  />
                </Link>
              ))}
            </div>
          </ScrollReveal>
        </div>

        {/* New booking CTA */}
        <ScrollReveal delay={0.3}>
          <div className="glass-card rounded-3xl p-8 md:p-12 text-center">
            <h2 className="font-display uppercase text-4xl md:text-5xl tracking-tight mb-4 leading-[0.95]">
              Ready to book another{" "}
              <span className="text-gradient-hero">show?</span>
            </h2>
            <p className="text-sm text-zinc-400 mb-8 max-w-md mx-auto">
              Submit a new inquiry and the HighLife Records team will respond to
              fits that align with the artist and event.
            </p>
            <Link
              href="/book"
              className="group inline-flex items-center gap-3 px-8 py-3.5 btn-gradient text-xs tracking-[0.18em] uppercase font-bold rounded-full"
            >
              <Plus size={14} />
              Start New Inquiry
            </Link>
          </div>
        </ScrollReveal>
      </div>
    </div>
  );
}
