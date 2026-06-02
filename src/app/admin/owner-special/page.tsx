"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Crown,
  MessageSquare,
  Users,
  KeyRound,
  UserCog,
  Mic,
  Mail,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import { isOwnerAdmin, getAdminSession, type AdminSession } from "@/lib/admin-auth";

interface OwnerStats {
  inquiries: { total: number; new: number };
  partnerRequests: { total: number; new: number };
  venueLogins: number;
  agentLogins: number;
  auditions: { total: number; new: number };
  subscribers: number;
  assignments: number;
  artists: number;
}

const cleanupChecklist = [
  { label: "Demo artists removed from static data", done: true },
  { label: "Demo events removed from static data", done: true },
  { label: "Sample bookings: legacy model, inquiry system live", done: true },
  { label: "Fake venue logins removed (testvenue3307 kept)", done: true },
  { label: "Placeholder footer text cleaned", done: true },
  { label: "Agent permission model: DB-backed", done: true },
  { label: "Email subscriber table live", done: true },
  { label: "Inquiry system live with public + partner sources", done: true },
];

export default function OwnerSpecialPage() {
  const router = useRouter();
  const [session, setSession] = useState<AdminSession | null>(null);
  const [accessChecked, setAccessChecked] = useState(false);
  const [stats, setStats] = useState<OwnerStats | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const s = getAdminSession();
    if (!s || !isOwnerAdmin(s)) {
      router.replace("/admin");
      return;
    }
    setSession(s);
    setAccessChecked(true);
  }, [router]);

  const fetchStats = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    try {
      const res = await fetch("/api/admin/owner-stats", {
        headers: { "x-admin-email": session.email },
      });
      if (res.ok) setStats(await res.json());
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    if (accessChecked) fetchStats();
  }, [accessChecked, fetchStats]);

  if (!accessChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="text-[10px] tracking-[0.3em] uppercase text-zinc-500">Checking access...</span>
      </div>
    );
  }

  const statCards = stats
    ? [
        { label: "Total Inquiries", value: stats.inquiries.total, sub: `${stats.inquiries.new} new`, icon: MessageSquare, color: "text-pink-300" },
        { label: "Partner Requests", value: stats.partnerRequests.total, sub: `${stats.partnerRequests.new} new`, icon: KeyRound, color: "text-sky-300" },
        { label: "Venue Logins", value: stats.venueLogins, sub: "active", icon: KeyRound, color: "text-emerald-300" },
        { label: "Agent Logins", value: stats.agentLogins, sub: "active", icon: UserCog, color: "text-violet-300" },
        { label: "Auditions", value: stats.auditions.total, sub: `${stats.auditions.new} new`, icon: Mic, color: "text-amber-300" },
        { label: "Assignments", value: stats.assignments, sub: "total", icon: UserCog, color: "text-cyan-300" },
        { label: "Email Subscribers", value: stats.subscribers, sub: "total", icon: Mail, color: "text-pink-300" },
        { label: "Artists", value: stats.artists, sub: "in database", icon: Users, color: "text-emerald-300" },
      ]
    : [];

  return (
    <div className="min-h-screen text-foreground">
      <div className="border-b border-white/8 px-4 sm:px-6 lg:px-10 py-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500/20 to-violet-500/20 border border-pink-500/30 flex items-center justify-center">
            <Crown size={18} className="text-pink-300" />
          </div>
          <div>
            <p className="text-[10px] tracking-[0.3em] uppercase text-zinc-500 mb-0.5">
              Owner Access Only
            </p>
            <h1 className="font-display uppercase text-3xl tracking-tight">
              Owner Hub
            </h1>
          </div>
          <div className="ml-auto">
            <button
              onClick={fetchStats}
              disabled={loading}
              className="p-2 rounded-lg border border-white/10 hover:border-white/25 bg-black/40 text-zinc-300 hover:text-foreground transition-colors disabled:opacity-50"
              title="Refresh"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-10 py-8 space-y-8 max-w-5xl">
        {/* Phase Status */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-2xl p-5 border border-pink-500/15"
        >
          <h2 className="text-[11px] tracking-[0.22em] uppercase text-pink-300 mb-3 flex items-center gap-2">
            <Crown size={14} /> Phase 3 Status
          </h2>
          <div className="grid sm:grid-cols-2 gap-2">
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle size={14} className="text-emerald-400" />
              <span className="text-zinc-300">Inquiry system live</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle size={14} className="text-emerald-400" />
              <span className="text-zinc-300">Agent login management</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle size={14} className="text-emerald-400" />
              <span className="text-zinc-300">Assignment queue</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle size={14} className="text-emerald-400" />
              <span className="text-zinc-300">Email subscriber list</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle size={14} className="text-emerald-400" />
              <span className="text-zinc-300">Data cleanup complete</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle size={14} className="text-emerald-400" />
              <span className="text-zinc-300">Hero image live (transparent logo + DJ booth photo)</span>
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {statCards.map((s, i) => {
              const Icon = s.icon;
              return (
                <motion.div
                  key={s.label}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.04 }}
                  className="glass-card rounded-2xl p-4"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[9px] tracking-[0.18em] uppercase text-zinc-500">{s.label}</span>
                    <Icon size={14} className={s.color} strokeWidth={1.6} />
                  </div>
                  <div className="font-display text-3xl text-gradient-hero leading-none mb-1">{s.value}</div>
                  <div className="text-[10px] text-zinc-500">{s.sub}</div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Cleanup Checklist */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card rounded-2xl p-5"
        >
          <h2 className="text-[11px] tracking-[0.22em] uppercase text-zinc-300 mb-4 flex items-center gap-2">
            <CheckCircle size={14} className="text-emerald-300" /> Cleanup Checklist
          </h2>
          <div className="space-y-2">
            {cleanupChecklist.map((item) => (
              <div key={item.label} className="flex items-center gap-2 py-1.5">
                <CheckCircle size={14} className={item.done ? "text-emerald-400" : "text-zinc-600"} />
                <span className={`text-sm ${item.done ? "text-zinc-300" : "text-zinc-500"}`}>{item.label}</span>
              </div>
            ))}
          </div>
        </motion.div>

        <p className="text-[10px] tracking-[0.18em] uppercase text-zinc-600 pt-4 border-t border-white/5">
          Restricted to Liam and Jaco only
        </p>
      </div>
    </div>
  );
}
