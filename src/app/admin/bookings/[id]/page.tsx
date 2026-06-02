"use client";

import { useState, useEffect, useCallback, use } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Clock,
  Eye,
  Reply,
  CheckCircle,
  XCircle,
  Trash2,
  Save,
  Mail,
  Phone,
  MapPin,
  Calendar,
  DollarSign,
  User,
  Music,
} from "lucide-react";
import ConfirmDialog from "@/components/admin/ConfirmDialog";

interface BookingDetail {
  id: string;
  artistSlug: string;
  artistName: string;
  venueName: string;
  venueAddress: string;
  eventDate: string;
  proposedOffer: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  eventDescription: string;
  messageToAgent: string;
  source: string;
  submittedAt: string;
  status: string;
  adminNotes: string | null;
  createdAt: string;
  updatedAt: string;
}

const allStatuses = ["New", "Reviewed", "Replied", "Booked", "Lost"];

const statusColor: Record<string, string> = {
  New: "text-amber-300 bg-amber-400/10 border-amber-400/20",
  Reviewed: "text-sky-300 bg-sky-400/10 border-sky-400/20",
  Replied: "text-violet-300 bg-violet-400/10 border-violet-400/20",
  Booked: "text-emerald-300 bg-emerald-400/10 border-emerald-400/20",
  Lost: "text-zinc-400 bg-zinc-400/10 border-zinc-400/20",
};

const statusIcon: Record<string, typeof Clock> = {
  New: Clock,
  Reviewed: Eye,
  Replied: Reply,
  Booked: CheckCircle,
  Lost: XCircle,
};

export default function BookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [deleted, setDeleted] = useState(false);

  const fetchBooking = useCallback(() => {
    fetch(`/api/bookings/${id}`)
      .then((r) => {
        if (!r.ok) throw new Error("Not found");
        return r.json();
      })
      .then((data) => {
        setBooking(data);
        setNotes(data.adminNotes || "");
      })
      .catch(() => setBooking(null))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    fetchBooking();
  }, [fetchBooking]);

  const patchBooking = async (data: Record<string, unknown>) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/bookings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const updated = await res.json();
        setBooking(updated);
        setNotes(updated.adminNotes || "");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = (status: string) => patchBooking({ status });
  const handleNotesBlur = () => {
    if (notes !== (booking?.adminNotes || "")) {
      patchBooking({ adminNotes: notes });
    }
  };

  const handleDelete = async () => {
    await fetch(`/api/bookings/${id}`, { method: "DELETE" });
    setDeleted(true);
    setShowDelete(false);
  };

  if (deleted) {
    return (
      <div className="min-h-screen flex items-center justify-center text-center">
        <div>
          <p className="text-sm text-zinc-400 mb-4">Booking deleted.</p>
          <Link
            href="/admin/bookings"
            className="text-[10px] tracking-[0.18em] uppercase text-pink-300 hover:text-pink-200"
          >
            Back to Bookings
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="text-[10px] tracking-[0.3em] uppercase text-zinc-500">
          Loading...
        </span>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen flex items-center justify-center text-center">
        <div>
          <p className="text-sm text-zinc-400 mb-4">Booking not found.</p>
          <Link
            href="/admin/bookings"
            className="text-[10px] tracking-[0.18em] uppercase text-pink-300 hover:text-pink-200"
          >
            Back to Bookings
          </Link>
        </div>
      </div>
    );
  }

  const StatusIcon = statusIcon[booking.status] || Clock;

  return (
    <div className="min-h-screen text-foreground">
      {/* Header */}
      <div className="border-b border-white/8 px-4 sm:px-6 lg:px-10 py-6">
        <Link
          href="/admin/bookings"
          className="inline-flex items-center gap-1.5 text-[10px] tracking-[0.18em] uppercase text-zinc-500 hover:text-foreground transition-colors mb-3"
        >
          <ArrowLeft size={12} />
          All Bookings
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] tracking-[0.3em] uppercase text-zinc-500 mb-1">
              #{booking.id.slice(-8).toUpperCase()} ·{" "}
              {booking.source === "authenticated" ? "Signed In" : "Public"}
            </p>
            <h1 className="font-display uppercase text-2xl sm:text-3xl tracking-tight">
              {booking.artistName}{" "}
              <span className="text-zinc-500 font-normal">for</span>{" "}
              {booking.venueName}
            </h1>
          </div>
          <span
            className={`inline-flex items-center gap-1.5 text-[10px] tracking-[0.18em] uppercase font-semibold border rounded-full px-3 py-1 shrink-0 ${
              statusColor[booking.status] || ""
            }`}
          >
            <StatusIcon size={12} />
            {booking.status}
          </span>
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-10 py-8 max-w-5xl">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left column -- details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Booking details */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="glass-card rounded-2xl p-6"
            >
              <h2 className="text-[11px] tracking-[0.22em] uppercase text-zinc-400 mb-5">
                Booking Details
              </h2>
              <div className="grid sm:grid-cols-2 gap-5">
                <DetailRow icon={Music} label="Artist" value={booking.artistName} />
                <DetailRow icon={MapPin} label="Venue" value={booking.venueName} />
                <DetailRow icon={MapPin} label="Address" value={booking.venueAddress} />
                <DetailRow icon={Calendar} label="Event Date" value={booking.eventDate || "Not specified"} />
                <DetailRow icon={DollarSign} label="Proposed Offer" value={booking.proposedOffer} highlight />
                <DetailRow
                  icon={Clock}
                  label="Submitted"
                  value={new Date(booking.submittedAt).toLocaleString("en-US", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                />
              </div>
            </motion.div>

            {/* Contact info */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.05 }}
              className="glass-card rounded-2xl p-6"
            >
              <h2 className="text-[11px] tracking-[0.22em] uppercase text-zinc-400 mb-5">
                Contact Information
              </h2>
              <div className="grid sm:grid-cols-2 gap-5">
                <DetailRow icon={User} label="Name" value={booking.contactName} />
                <DetailRow icon={Mail} label="Email" value={booking.contactEmail} />
                <DetailRow icon={Phone} label="Phone" value={booking.contactPhone} />
              </div>
            </motion.div>

            {/* Event description & message */}
            {(booking.eventDescription || booking.messageToAgent) && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className="glass-card rounded-2xl p-6 space-y-5"
              >
                {booking.eventDescription && (
                  <div>
                    <h3 className="text-[10px] tracking-[0.2em] uppercase text-zinc-500 mb-2">
                      Event Description
                    </h3>
                    <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">
                      {booking.eventDescription}
                    </p>
                  </div>
                )}
                {booking.messageToAgent && (
                  <div>
                    <h3 className="text-[10px] tracking-[0.2em] uppercase text-zinc-500 mb-2">
                      Message to Agent
                    </h3>
                    <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">
                      {booking.messageToAgent}
                    </p>
                  </div>
                )}
              </motion.div>
            )}
          </div>

          {/* Right column -- actions */}
          <div className="space-y-6">
            {/* Status control */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="glass-card rounded-2xl p-6"
            >
              <h2 className="text-[11px] tracking-[0.22em] uppercase text-zinc-400 mb-4">
                Status
              </h2>
              <select
                value={booking.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                disabled={saving}
                className="w-full px-3 py-2.5 rounded-xl bg-white/4 border border-white/8 text-sm text-zinc-300 focus:outline-none focus:border-pink-500/40 appearance-none cursor-pointer mb-4"
              >
                {allStatuses.map((s) => (
                  <option key={s} value={s} className="bg-zinc-900">
                    {s}
                  </option>
                ))}
              </select>

              <div className="space-y-2">
                <h3 className="text-[10px] tracking-[0.2em] uppercase text-zinc-500 mb-2">
                  Quick Actions
                </h3>
                {[
                  { label: "Mark Reviewed", status: "Reviewed", icon: Eye, color: "border-sky-500/20 hover:border-sky-500/40 text-sky-300" },
                  { label: "Mark Replied", status: "Replied", icon: Reply, color: "border-violet-500/20 hover:border-violet-500/40 text-violet-300" },
                  { label: "Mark Booked", status: "Booked", icon: CheckCircle, color: "border-emerald-500/20 hover:border-emerald-500/40 text-emerald-300" },
                  { label: "Mark Lost", status: "Lost", icon: XCircle, color: "border-zinc-500/20 hover:border-zinc-500/40 text-zinc-400" },
                ].map((action) => {
                  const ActionIcon = action.icon;
                  return (
                    <button
                      key={action.status}
                      onClick={() => handleStatusChange(action.status)}
                      disabled={saving || booking.status === action.status}
                      className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl border bg-black/30 text-xs tracking-wide transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${action.color}`}
                    >
                      <ActionIcon size={13} />
                      {action.label}
                    </button>
                  );
                })}
              </div>
            </motion.div>

            {/* Admin Notes */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.15 }}
              className="glass-card rounded-2xl p-6"
            >
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-[11px] tracking-[0.22em] uppercase text-zinc-400">
                  Admin Notes
                </h2>
                {saving && (
                  <span className="text-[9px] tracking-[0.18em] uppercase text-pink-300">
                    <Save size={10} className="inline mr-1" />
                    Saving...
                  </span>
                )}
              </div>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                onBlur={handleNotesBlur}
                rows={5}
                placeholder="Internal notes about this booking..."
                className="w-full px-3 py-2.5 rounded-xl bg-white/4 border border-white/8 text-sm text-foreground placeholder:text-zinc-600 focus:outline-none focus:border-pink-500/40 resize-none"
              />
            </motion.div>

            {/* Delete */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              <button
                onClick={() => setShowDelete(true)}
                className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-red-500/15 hover:border-red-500/30 bg-red-500/5 hover:bg-red-500/10 text-xs tracking-wide text-red-400 hover:text-red-300 transition-colors"
              >
                <Trash2 size={13} />
                Delete Booking
              </button>
            </motion.div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={showDelete}
        title="Delete Booking"
        message={`Delete the inquiry from ${booking.contactName} for ${booking.artistName} at ${booking.venueName}? This cannot be undone.`}
        confirmLabel="Delete"
        danger
        onConfirm={handleDelete}
        onCancel={() => setShowDelete(false)}
      />
    </div>
  );
}

function DetailRow({
  icon: Icon,
  label,
  value,
  highlight,
}: {
  icon: typeof Clock;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-1">
        <Icon size={11} className="text-zinc-600" />
        <span className="text-[9px] tracking-[0.18em] uppercase text-zinc-600">
          {label}
        </span>
      </div>
      <span
        className={`text-sm ${highlight ? "text-foreground font-semibold" : "text-zinc-300"}`}
      >
        {value}
      </span>
    </div>
  );
}
