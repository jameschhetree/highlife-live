"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Clock,
  CheckCircle,
  ArrowRight,
  MessageSquare,
  LogOut,
  Plus,
  XCircle,
  Eye,
  EyeOff,
  Reply,
  Archive,
} from "lucide-react";
import { ScrollReveal } from "@/components/ScrollReveal";
import { isAuthenticated, logout, getUser } from "@/lib/auth";

interface InquiryRecord {
  id: string;
  inquiryNumber: string;
  artistSlug: string;
  artistName: string;
  venueName: string;
  venueAddress: string;
  eventDate: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  eventDescription: string;
  messageToAgent: string;
  submittedAt: string;
  status: string;
  source: string;
}

const statusConfig: Record<
  string,
  { icon: typeof Clock; color: string; bg: string }
> = {
  New: {
    icon: Clock,
    color: "text-amber-300",
    bg: "bg-amber-400/10 border-amber-400/20",
  },
  Reviewed: {
    icon: Eye,
    color: "text-sky-300",
    bg: "bg-sky-400/10 border-sky-400/20",
  },
  Replied: {
    icon: Reply,
    color: "text-violet-300",
    bg: "bg-violet-400/10 border-violet-400/20",
  },
  Booked: {
    icon: CheckCircle,
    color: "text-emerald-300",
    bg: "bg-emerald-400/10 border-emerald-400/20",
  },
  Lost: {
    icon: XCircle,
    color: "text-rose-300",
    bg: "bg-rose-400/10 border-rose-400/20",
  },
};

const defaultStatus = {
  icon: Clock,
  color: "text-zinc-400",
  bg: "bg-zinc-400/10 border-zinc-400/20",
};

export default function PortalPage() {
  const router = useRouter();
  const [authed, setAuthed] = useState(false);
  const [checking, setChecking] = useState(true);
  const [userInquiries, setUserInquiries] = useState<InquiryRecord[]>([]);
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set());
  const [showHidden, setShowHidden] = useState(false);
  const [userName, setUserName] = useState("Partner");

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace("/login");
      return;
    }
    setAuthed(true);
    const user = getUser();
    if (user?.name) setUserName(user.name);

    // Fetch this venue partner's inquiries — server derives identity from signed cookie.
    Promise.all([
      fetch("/api/inquiries", { credentials: "include" }).then((r) => (r.ok ? r.json() : [])),
      fetch("/api/partner/hidden-inquiries", { credentials: "include" })
        .then((r) => (r.ok ? r.json() : []))
        .catch(() => [] as string[]),
    ])
      .then(([rows, hidden]) => {
        setUserInquiries(Array.isArray(rows) ? rows : []);
        setHiddenIds(new Set(Array.isArray(hidden) ? hidden : []));
      })
      .catch(() => {
        setUserInquiries([]);
        setHiddenIds(new Set());
      })
      .finally(() => setChecking(false));
  }, [router]);

  const hideInquiry = async (inquiryId: string) => {
    const res = await fetch("/api/partner/hidden-inquiries", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ inquiryId }),
    });
    if (res.ok) setHiddenIds((prev) => new Set(prev).add(inquiryId));
  };

  const unhideInquiry = async (inquiryId: string) => {
    const res = await fetch(`/api/partner/hidden-inquiries?inquiryId=${inquiryId}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (res.ok) {
      setHiddenIds((prev) => {
        const next = new Set(prev);
        next.delete(inquiryId);
        return next;
      });
    }
  };

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  if (checking || !authed) {
    return (
      <div className="min-h-screen bg-radial-atmosphere flex items-center justify-center">
        <span className="text-[10px] tracking-[0.3em] uppercase text-zinc-500">
          Verifying access...
        </span>
      </div>
    );
  }

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
              Manage your inquiries, track requests, and browse the entertainment roster.
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

        {/* Welcome message */}
        <ScrollReveal>
          <div className="glass-card rounded-2xl p-5 mb-10 flex items-start gap-4">
            <MessageSquare size={18} className="text-pink-300 mt-0.5 flex-shrink-0" />
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium">HighLife Live Team</span>
              </div>
              <p className="text-sm text-zinc-300 leading-relaxed">
                Welcome back. Your submitted inquiries are visible below. Submit
                a new inquiry to book talent for your venue or event.
              </p>
            </div>
          </div>
        </ScrollReveal>

        {/* User-submitted inquiries */}
        <ScrollReveal delay={0.1}>
          <div className="mb-12">
            <div className="flex items-baseline justify-between gap-3 mb-5">
              <h2 className="text-[11px] tracking-[0.22em] uppercase text-zinc-400">Your Inquiries</h2>
              {hiddenIds.size > 0 && (
                <button
                  onClick={() => setShowHidden((v) => !v)}
                  className="text-[10px] tracking-[0.18em] uppercase text-zinc-400 hover:text-foreground inline-flex items-center gap-1.5"
                >
                  {showHidden ? <EyeOff size={11} /> : <Eye size={11} />}
                  {showHidden ? `Hide hidden (${hiddenIds.size})` : `Show hidden (${hiddenIds.size})`}
                </button>
              )}
            </div>
            {userInquiries.length === 0 ? (
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
                {userInquiries
                  .filter((inq) => showHidden || !hiddenIds.has(inq.id))
                  .map((inq) => {
                    const config = statusConfig[inq.status] || defaultStatus;
                    const Icon = config.icon;
                    const isHidden = hiddenIds.has(inq.id);
                    return (
                      <div key={inq.id} className="block group relative">
                        <Link href={`/portal/inquiries/${inq.id}`} className="block">
                          <motion.div
                            whileHover={{ y: -2 }}
                            className={`glass-card rounded-2xl p-5 border ${config.bg} h-full hover:border-pink-400/40 transition-colors ${isHidden ? "opacity-50" : ""}`}
                          >
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-[10px] tracking-[0.18em] uppercase text-zinc-500 font-mono">
                                {inq.inquiryNumber}
                              </span>
                              <Icon size={14} className={config.color} />
                            </div>
                            <h3 className="text-sm font-medium mb-1 group-hover:text-pink-300 transition-colors break-words">{inq.artistName}</h3>
                            <p className="text-xs text-zinc-500 mb-3 break-words">
                              {inq.venueName} · {inq.eventDate || new Date(inq.submittedAt).toLocaleDateString()}
                            </p>
                            {inq.eventDescription && (
                              <p className="text-xs text-zinc-400 leading-relaxed mb-4 line-clamp-2">
                                {inq.eventDescription}
                              </p>
                            )}
                            <div className="flex items-center justify-between">
                              <span className={`text-[10px] tracking-[0.2em] uppercase font-semibold ${config.color}`}>
                                {inq.status}
                              </span>
                              <span className="text-[10px] tracking-[0.18em] uppercase text-zinc-500 group-hover:text-pink-300 transition-colors inline-flex items-center gap-1">
                                View / Edit <ArrowRight size={11} />
                              </span>
                            </div>
                          </motion.div>
                        </Link>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            isHidden ? unhideInquiry(inq.id) : hideInquiry(inq.id);
                          }}
                          className="absolute top-3 right-3 text-[10px] tracking-[0.18em] uppercase text-zinc-500 hover:text-pink-300 inline-flex items-center gap-1 bg-black/40 border border-white/10 hover:border-pink-400/40 rounded-full px-2 py-0.5"
                          title={isHidden ? "Unhide from portal" : "Hide from portal (does not delete)"}
                        >
                          {isHidden ? <Eye size={10} /> : <Archive size={10} />}
                          {isHidden ? "Unhide" : "Hide"}
                        </button>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        </ScrollReveal>

        {/* New booking CTA */}
        <ScrollReveal delay={0.2}>
          <div className="glass-card rounded-3xl p-8 md:p-12 text-center">
            <h2 className="font-display uppercase text-4xl md:text-5xl tracking-tight mb-4 leading-[0.95]">
              Ready to book another{" "}
              <span className="text-gradient-hero">show?</span>
            </h2>
            <p className="text-sm text-zinc-400 mb-8 max-w-md mx-auto">
              Submit a new inquiry and the HighLife Live team will respond to
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
