"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Users,
  MapPinned,
  Megaphone,
  CheckCircle,
  Send,
  Inbox,
  TrendingUp,
  CalendarClock,
  Activity,
  ArrowRight,
} from "lucide-react";
import { getAdminSession, isAgentAdmin, type AdminSession } from "@/lib/admin-auth";
import { DemoAnalyticsBadge } from "@/components/admin/DemoAnalyticsBadge";

// Phase 3.8 — owner stats: 4 live counts from existing APIs (artists / venues /
// inquiries / events) + 2 placeholder cards marked DEMO since the underlying
// metric isn't wired yet. Removed the hardcoded "Total Artists 12" etc that
// were lying about live data (Murd QA finding 4).
type StatCard = { label: string; value: string; delta: string; icon: typeof Users; demo?: boolean };

export default function AdminDashboardPage() {
  const [session, setSession] = useState<AdminSession | null>(null);
  const [accessChecked, setAccessChecked] = useState(false);
  const agentView = isAgentAdmin(session);
  const [agentAssignedCount, setAgentAssignedCount] = useState<number | null>(null);

  // Live counts (Phase 3.8) — pulled from existing list APIs. Cheap, all-DB,
  // no new endpoints. Filled in once session is known so we can send x-admin-email.
  const [liveCounts, setLiveCounts] = useState<{
    artists: number | null;
    venues: number | null;
    inquiries: number | null;
    events: number | null;
  }>({ artists: null, venues: null, inquiries: null, events: null });

  useEffect(() => {
    if (!session) return;
    const headers = { "x-admin-email": session.email };
    Promise.all([
      fetch("/api/admin/artists", { headers }).then((r) => (r.ok ? r.json() : [])).catch(() => []),
      fetch("/api/admin/venues", { headers }).then((r) => (r.ok ? r.json() : [])).catch(() => []),
      fetch("/api/admin/inquiries", { headers }).then((r) => (r.ok ? r.json() : [])).catch(() => []),
      fetch("/api/admin/events", { headers }).then((r) => (r.ok ? r.json() : [])).catch(() => []),
    ]).then(([a, v, i, e]) => {
      const len = (x: unknown) => (Array.isArray(x) ? x.length : 0);
      setLiveCounts({ artists: len(a), venues: len(v), inquiries: len(i), events: len(e) });
      if (agentView) setAgentAssignedCount(len(a));
    });
  }, [session, agentView]);

  const assignedLabel =
    agentAssignedCount === null
      ? "—"
      : agentAssignedCount === 0
      ? "none assigned"
      : `${agentAssignedCount} artist${agentAssignedCount === 1 ? "" : "s"}`;

  const ownerStats: StatCard[] = [
    { label: agentView ? "My Artists" : "Total Artists", value: String(liveCounts.artists ?? "—"), delta: agentView ? assignedLabel : "live count", icon: Users },
    { label: agentView ? "Assigned" : "Total Venues", value: String(agentView ? (agentAssignedCount ?? "—") : (liveCounts.venues ?? "—")), delta: agentView ? "assigned to you" : "in CRM", icon: MapPinned },
    { label: "Inquiries", value: String(liveCounts.inquiries ?? "—"), delta: "total submitted", icon: Inbox },
    { label: "Events", value: String(liveCounts.events ?? "—"), delta: "published", icon: CalendarClock },
    { label: "Active Campaigns", value: "—", delta: "coming soon", icon: Megaphone, demo: true },
    { label: "Bookings Won", value: "—", delta: "coming soon", icon: CheckCircle, demo: true },
  ];

  const visibleStats: StatCard[] = ownerStats;
  // Phase 3.8 — drafts/pipeline/activity sections previously rendered hardcoded
  // demo names (Nyla Vale, Tone Brady, Foolery). Empty for now so we don't lie;
  // real data lands in Phase 4.5.
  const visibleDrafts: never[] = [];
  const visiblePipeline: never[] = [];
  const visibleActivity: never[] = [];

  useEffect(() => {
    setSession(getAdminSession());
    setAccessChecked(true);
  }, []);

  if (!accessChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="text-[10px] tracking-[0.3em] uppercase text-zinc-500">Checking access...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-foreground">
      <div className="border-b border-white/8 px-6 lg:px-10 py-6 flex items-center justify-between">
        <div>
          <p className="text-[10px] tracking-[0.3em] uppercase text-zinc-500 mb-1">
            HighLife Live · Admin Console
          </p>
          <h1 className="font-display uppercase text-3xl tracking-tight">
            Dashboard
          </h1>
        </div>
        <div className="hidden md:flex items-center gap-2 text-[10px] tracking-[0.3em] uppercase text-zinc-500">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
          Live
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-10 py-8 space-y-10">
        <section>
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
            {visibleStats.map((s, i) => {
              const Icon = s.icon;
              return (
                <motion.div
                  key={s.label}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.05, ease: [0.32, 0.72, 0, 1] }}
                  className="glass-card rounded-2xl p-4"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] tracking-[0.18em] uppercase text-zinc-500">
                      {s.label}
                    </span>
                    {s.demo ? (
                      <DemoAnalyticsBadge size="sm" />
                    ) : (
                      <Icon size={14} className="text-zinc-500" strokeWidth={1.6} />
                    )}
                  </div>
                  <div className="font-display text-3xl text-gradient-hero leading-none mb-2">
                    {s.value}
                  </div>
                  <div className="text-[10px] text-zinc-500">{s.delta}</div>
                </motion.div>
              );
            })}
          </div>
        </section>

        <section className="grid lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 glass-card rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Send size={14} className="text-pink-300" strokeWidth={1.5} />
                <h2 className="text-[11px] tracking-[0.22em] uppercase text-zinc-300">
                  Campaign Drafts Awaiting Approval
                </h2>
              </div>
              <Link
                href="/admin/campaigns"
                className="text-[10px] tracking-[0.18em] uppercase text-zinc-400 hover:text-foreground inline-flex items-center gap-1"
              >
                All Campaigns <ArrowRight size={11} />
              </Link>
            </div>
            {visibleDrafts.length === 0 ? (
              <div className="py-8 text-center text-xs text-zinc-500 italic">
                No campaign drafts yet. Create one in <Link href="/admin/campaigns" className="text-pink-300 hover:underline">Campaigns</Link>.
              </div>
            ) : (
              <ul className="divide-y divide-white/8">
                {visibleDrafts.map((d: { id: string; artist: string; segment: string; contacts: number; by: string }) => (
                  <li key={d.id} className="py-3 flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-medium">{d.artist}</div>
                      <div className="text-[11px] text-zinc-500 mt-0.5">
                        {d.segment} · {d.contacts} contacts · {d.by}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] tracking-[0.18em] uppercase text-amber-300 bg-amber-400/10 border border-amber-400/20 rounded-full px-2 py-1">
                        {d.id} · Needs Approval
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="glass-card rounded-2xl p-5">
            <h2 className="text-[11px] tracking-[0.22em] uppercase text-zinc-300 mb-4 flex items-center gap-2">
              <Activity size={14} className="text-pink-300" strokeWidth={1.5} />
              Quick Actions
            </h2>
            <div className="flex flex-col gap-2">
              {!agentView && (
                <Link href="/admin/artists?new=1" className="px-4 py-3 rounded-xl border border-white/10 hover:border-white/25 bg-black/40 text-sm text-zinc-300 hover:text-foreground transition-colors flex items-center justify-between">
                  <span>Add new artist</span>
                  <ArrowRight size={12} />
                </Link>
              )}
              <Link href="/admin/venues?import=1" className="px-4 py-3 rounded-xl border border-white/10 hover:border-white/25 bg-black/40 text-sm text-zinc-300 hover:text-foreground transition-colors flex items-center justify-between">
                <span>Import venues CSV</span>
                <ArrowRight size={12} />
              </Link>
              <Link href="/admin/campaigns?new=1" className="px-4 py-3 rounded-xl border border-white/10 hover:border-white/25 bg-black/40 text-sm text-zinc-300 hover:text-foreground transition-colors flex items-center justify-between">
                <span>Draft new campaign</span>
                <ArrowRight size={12} />
              </Link>
              <Link href="/admin/research" className="px-4 py-3 rounded-xl border border-white/10 hover:border-white/25 bg-black/40 text-sm text-zinc-300 hover:text-foreground transition-colors flex items-center justify-between">
                <span>Review research queue</span>
                <ArrowRight size={12} />
              </Link>
            </div>
          </div>
        </section>

        <section className="grid lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 glass-card rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <CalendarClock size={14} className="text-pink-300" strokeWidth={1.5} />
                <h2 className="text-[11px] tracking-[0.22em] uppercase text-zinc-300">
                  Active Pipeline
                </h2>
              </div>
              <Link href="/admin/pipeline" className="text-[10px] tracking-[0.18em] uppercase text-zinc-400 hover:text-foreground inline-flex items-center gap-1">
                Full Board <ArrowRight size={11} />
              </Link>
            </div>
            {visiblePipeline.length === 0 ? (
              <div className="py-8 text-center text-xs text-zinc-500 italic">
                Pipeline summary coming soon. Full Kanban available at <Link href="/admin/pipeline" className="text-pink-300 hover:underline">Pipeline</Link>.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-[10px] tracking-[0.18em] uppercase text-zinc-500 border-b border-white/8">
                      <th className="text-left font-normal py-2">Artist</th>
                      <th className="text-left font-normal py-2">Venue</th>
                      <th className="text-left font-normal py-2">Stage</th>
                      <th className="text-right font-normal py-2">Fee</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visiblePipeline.map((row: { artist: string; venue: string; stage: string; fee: string }) => (
                      <tr key={`${row.artist}-${row.venue}`} className="border-b border-white/4 last:border-0">
                        <td className="py-3 text-zinc-200">{row.artist}</td>
                        <td className="py-3 text-zinc-400">{row.venue}</td>
                        <td className="py-3">
                          <span className="text-[10px] tracking-[0.18em] uppercase text-pink-200 bg-pink-500/10 border border-pink-500/20 rounded-full px-2 py-1">
                            {row.stage}
                          </span>
                        </td>
                        <td className="py-3 text-right text-zinc-300">{row.fee}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="glass-card rounded-2xl p-5">
            <h2 className="text-[11px] tracking-[0.22em] uppercase text-zinc-300 mb-4 flex items-center gap-2">
              <Activity size={14} className="text-pink-300" strokeWidth={1.5} />
              Recent Activity
            </h2>
            {visibleActivity.length === 0 ? (
              <div className="py-8 text-center text-xs text-zinc-500 italic">
                Live activity feed coming soon.
              </div>
            ) : (
              <ul className="space-y-3">
                {visibleActivity.map((a: { time: string; text: string }, i: number) => (
                  <li key={i} className="text-sm">
                    <div className="text-[10px] tracking-[0.18em] uppercase text-zinc-500">{a.time}</div>
                    <div className="text-zinc-300 mt-0.5">{a.text}</div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <p className="text-[10px] tracking-[0.18em] uppercase text-zinc-600 pt-4 border-t border-white/5">
          Live counts pulled from the database. Some sections show demo data.
        </p>
      </div>
    </div>
  );
}
