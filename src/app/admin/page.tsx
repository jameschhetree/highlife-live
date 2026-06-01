"use client";

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

const stats = [
  { label: "Total Artists", value: "12", delta: "+3 this month", icon: Users },
  { label: "Active Roster", value: "8", delta: "67% utilization", icon: TrendingUp },
  { label: "Active Campaigns", value: "4", delta: "2 awaiting approval", icon: Megaphone },
  { label: "Venues Contacted", value: "47", delta: "this week", icon: MapPinned },
  { label: "Positive Replies", value: "9", delta: "+19% vs last week", icon: CheckCircle },
  { label: "Bookings Won", value: "3", delta: "$28,500 confirmed", icon: Inbox },
];

const drafts = [
  { id: "C-104", artist: "Nyla Vale", segment: "DC Lounge Promoters", contacts: 18, by: "Booker · Maria" },
  { id: "C-105", artist: "Tone Brady", segment: "DMV Club Buyers", contacts: 32, by: "Booker · Maria" },
];

const pipeline = [
  { artist: "Foolery", venue: "Black Cat DC", stage: "Negotiating", fee: "$4,500" },
  { artist: "Nyla Vale", venue: "The Anthem (Support)", stage: "Replied", fee: "$8,000" },
  { artist: "DJ Saint Noir", venue: "Echostage", stage: "Contract Pending", fee: "$6,000" },
  { artist: "Tone Brady", venue: "9:30 Club", stage: "Interested", fee: "$12,000" },
];

const activity = [
  { time: "12m ago", text: "Maria approved campaign C-103 (Foolery → DMV Colleges)" },
  { time: "1h ago", text: "Reply received from booker@blackcatdc.com (Foolery)" },
  { time: "3h ago", text: "Added 11 venues from CSV import (DMV Lounges Q3)" },
  { time: "yesterday", text: "Tone Brady moved to Priority Roster" },
];

export default function AdminDashboardPage() {
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

      <div className="px-6 lg:px-10 py-8 space-y-10">
        <section>
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
            {stats.map((s, i) => {
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
                    <Icon size={14} className="text-zinc-500" strokeWidth={1.6} />
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
            <ul className="divide-y divide-white/8">
              {drafts.map((d) => (
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
          </div>

          <div className="glass-card rounded-2xl p-5">
            <h2 className="text-[11px] tracking-[0.22em] uppercase text-zinc-300 mb-4 flex items-center gap-2">
              <Activity size={14} className="text-pink-300" strokeWidth={1.5} />
              Quick Actions
            </h2>
            <div className="flex flex-col gap-2">
              <Link href="/admin/artists?new=1" className="px-4 py-3 rounded-xl border border-white/10 hover:border-white/25 bg-black/40 text-sm text-zinc-300 hover:text-foreground transition-colors flex items-center justify-between">
                <span>Add new artist</span>
                <ArrowRight size={12} />
              </Link>
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
                  {pipeline.map((row) => (
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
          </div>

          <div className="glass-card rounded-2xl p-5">
            <h2 className="text-[11px] tracking-[0.22em] uppercase text-zinc-300 mb-4 flex items-center gap-2">
              <Activity size={14} className="text-pink-300" strokeWidth={1.5} />
              Recent Activity
            </h2>
            <ul className="space-y-3">
              {activity.map((a, i) => (
                <li key={i} className="text-sm">
                  <div className="text-[10px] tracking-[0.18em] uppercase text-zinc-500">
                    {a.time}
                  </div>
                  <div className="text-zinc-300 mt-0.5">{a.text}</div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <p className="text-[10px] tracking-[0.18em] uppercase text-zinc-600 pt-4 border-t border-white/5">
          Demo data — replace with real records before launching outreach.
        </p>
      </div>
    </div>
  );
}
