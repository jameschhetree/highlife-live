"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { motion } from "framer-motion";
import { CheckCircle, ArrowRight, Clock } from "lucide-react";

interface BookingData {
  id: string;
  artistName: string;
  venueName: string;
  eventDate: string;
  status: string;
  submittedAt: string;
}

function ConfirmationContent() {
  const searchParams = useSearchParams();
  const requestedId = searchParams.get("id");
  const [booking, setBooking] = useState<BookingData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!requestedId) {
      setLoading(false);
      return;
    }

    fetch(`/api/bookings/${requestedId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Not found");
        return res.json();
      })
      .then((data) => setBooking(data))
      .catch(() => setBooking(null))
      .finally(() => setLoading(false));
  }, [requestedId]);

  if (loading) {
    return (
      <div className="min-h-screen pt-32 bg-radial-atmosphere flex items-center justify-center">
        <span className="text-[10px] tracking-[0.3em] uppercase text-zinc-500">
          Loading...
        </span>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-28 pb-24 bg-radial-atmosphere">
      <div className="max-w-2xl mx-auto px-5 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.32, 0.72, 0, 1] }}
          className="glass-card rounded-3xl p-8 sm:p-12"
        >
          <div className="w-14 h-14 mx-auto mb-6 rounded-full bg-gradient-to-br from-emerald-400/30 to-emerald-600/10 border border-emerald-400/30 flex items-center justify-center">
            <CheckCircle size={26} strokeWidth={1.5} className="text-emerald-300" />
          </div>

          <h1 className="font-display uppercase text-4xl md:text-5xl tracking-tight leading-[0.95] mb-5">
            Inquiry{" "}
            <span className="text-gradient-hero">received.</span>
          </h1>

          {booking ? (
            <>
              <p className="text-silver text-base mb-7">
                Request{" "}
                <span className="text-foreground font-semibold">
                  #{booking.id.slice(-8).toUpperCase()}
                </span>{" "}
                is in your portal.
              </p>

              <div className="border border-white/8 bg-black/40 rounded-2xl p-5 sm:p-6 text-left mb-8">
                <div className="grid grid-cols-2 gap-5 text-sm">
                  <div>
                    <span className="text-[10px] tracking-[0.2em] uppercase text-zinc-500 block mb-1">
                      Artist
                    </span>
                    <span className="text-zinc-200">{booking.artistName}</span>
                  </div>
                  <div>
                    <span className="text-[10px] tracking-[0.2em] uppercase text-zinc-500 block mb-1">
                      Venue
                    </span>
                    <span className="text-zinc-200">{booking.venueName}</span>
                  </div>
                  <div>
                    <span className="text-[10px] tracking-[0.2em] uppercase text-zinc-500 block mb-1">
                      Event Date
                    </span>
                    <span className="text-zinc-200">
                      {booking.eventDate
                        ? new Date(booking.eventDate).toLocaleDateString()
                        : "Not specified"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] tracking-[0.2em] uppercase text-zinc-500 block mb-1">
                      Status
                    </span>
                    <span className="flex items-center gap-1.5 text-amber-300">
                      <Clock size={12} />
                      {booking.status}
                    </span>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <p className="text-silver text-base mb-10">
              No recent inquiry found. Submit a request to get started.
            </p>
          )}

          <p className="text-sm text-zinc-400 leading-relaxed max-w-md mx-auto mb-10">
            The HighLife Records team will review your request and reach out if
            the opportunity is a good fit for the artist and event.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/portal"
              className="group inline-flex items-center justify-center gap-2 px-7 py-3.5 btn-gradient text-xs tracking-[0.18em] uppercase font-bold rounded-full"
            >
              Go to Portal
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/roster"
              className="inline-flex items-center justify-center px-7 py-3.5 border border-white/12 hover:border-white/25 bg-black/40 hover:bg-black/55 text-xs tracking-[0.18em] uppercase text-zinc-300 hover:text-foreground rounded-full transition-colors"
            >
              Browse More Artists
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default function BookingConfirmationPage() {
  return (
    <Suspense fallback={<div className="min-h-screen pt-32 bg-radial-atmosphere" />}>
      <ConfirmationContent />
    </Suspense>
  );
}
