"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  BarChart3,
  TrendingUp,
  Users,
  Mail,
  DollarSign,
} from "lucide-react";
import { DemoAnalyticsBanner } from "@/components/admin/DemoAnalyticsBadge";
import { AgentStagedNotice } from "@/components/admin/AgentStagedNotice";
import { getAdminSession, isAgentAdmin, type AdminSession } from "@/lib/admin-auth";

// Demo report data
const replyRateByGenre = [
  { genre: "Hip-Hop", rate: 22, sent: 85, replies: 19 },
  { genre: "R&B", rate: 28, sent: 42, replies: 12 },
  { genre: "Latin/Dembow", rate: 31, sent: 38, replies: 12 },
  { genre: "Opera/Classical", rate: 18, sent: 22, replies: 4 },
  { genre: "Indie Rock", rate: 15, sent: 28, replies: 4 },
  { genre: "DJ/Electronic", rate: 24, sent: 30, replies: 7 },
];

const monthlyBookingValue = [
  { month: "Jan", value: 4500 },
  { month: "Feb", value: 8200 },
  { month: "Mar", value: 6800 },
  { month: "Apr", value: 12400 },
  { month: "May", value: 18500 },
  { month: "Jun", value: 15200 },
];

const venueTypeDistribution = [
  { type: "Club", count: 5 },
  { type: "Lounge", count: 2 },
  { type: "Festival", count: 1 },
  { type: "Theater", count: 1 },
  { type: "College", count: 1 },
  { type: "Restaurant/Bar", count: 1 },
  { type: "Cultural Center", count: 1 },
  { type: "Promoter", count: 1 },
];

const artistPerformance = [
  { name: "Tone Brady", campaigns: 2, replies: 8, bookings: 1, revenue: 12000 },
  { name: "El Fuego", campaigns: 1, replies: 5, bookings: 1, revenue: 2500 },
  { name: "Nyla Vale", campaigns: 1, replies: 3, bookings: 1, revenue: 3500 },
  { name: "DJ Saint Noir", campaigns: 0, replies: 2, bookings: 1, revenue: 5500 },
  { name: "Foolery", campaigns: 1, replies: 3, bookings: 0, revenue: 0 },
  { name: "Isabella Vega", campaigns: 1, replies: 1, bookings: 0, revenue: 0 },
];

function BarChartSVG({
  data,
  labelKey,
  valueKey,
  maxVal,
  color = "#ec4899",
}: {
  data: Record<string, unknown>[];
  labelKey: string;
  valueKey: string;
  maxVal: number;
  color?: string;
}) {
  const barWidth = 36;
  const gap = 12;
  const chartHeight = 120;
  const width = data.length * (barWidth + gap) + gap;

  return (
    <svg viewBox={`0 0 ${width} ${chartHeight + 30}`} className="w-full h-auto" preserveAspectRatio="xMidYMid meet">
      {data.map((item, i) => {
        const val = item[valueKey] as number;
        const barH = (val / maxVal) * chartHeight;
        const x = gap + i * (barWidth + gap);
        const y = chartHeight - barH;
        return (
          <g key={i}>
            <rect
              x={x}
              y={y}
              width={barWidth}
              height={barH}
              rx={4}
              fill={color}
              opacity={0.7 + (i / data.length) * 0.3}
            />
            <text
              x={x + barWidth / 2}
              y={y - 4}
              textAnchor="middle"
              className="fill-zinc-400"
              fontSize="8"
            >
              {val}
            </text>
            <text
              x={x + barWidth / 2}
              y={chartHeight + 14}
              textAnchor="middle"
              className="fill-zinc-500"
              fontSize="7"
            >
              {(item[labelKey] as string).slice(0, 8)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function LineChartSVG({
  data,
  labelKey,
  valueKey,
  maxVal,
}: {
  data: Record<string, unknown>[];
  labelKey: string;
  valueKey: string;
  maxVal: number;
}) {
  const chartWidth = 320;
  const chartHeight = 120;
  const padding = 30;

  const points = data.map((item, i) => {
    const x = padding + (i / (data.length - 1)) * (chartWidth - padding * 2);
    const val = item[valueKey] as number;
    const y = chartHeight - (val / maxVal) * (chartHeight - 20);
    return { x, y, val, label: item[labelKey] as string };
  });

  const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaD = `${pathD} L ${points[points.length - 1].x} ${chartHeight} L ${points[0].x} ${chartHeight} Z`;

  return (
    <svg viewBox={`0 0 ${chartWidth} ${chartHeight + 25}`} className="w-full h-auto" preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ec4899" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#ec4899" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaD} fill="url(#lineGrad)" />
      <path d={pathD} fill="none" stroke="#ec4899" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="3" fill="#ec4899" />
          <text x={p.x} y={p.y - 8} textAnchor="middle" className="fill-zinc-400" fontSize="8">
            ${(p.val / 1000).toFixed(1)}K
          </text>
          <text x={p.x} y={chartHeight + 14} textAnchor="middle" className="fill-zinc-500" fontSize="8">
            {p.label}
          </text>
        </g>
      ))}
    </svg>
  );
}

export default function ReportsPage() {
  // Phase 3.9 Scope 13 — agents must not see demo analytics. Sidebar hides this
  // link; this guard catches direct URL access.
  const [session, setSession] = useState<AdminSession | null>(null);
  const [accessChecked, setAccessChecked] = useState(false);
  useEffect(() => {
    setSession(getAdminSession());
    setAccessChecked(true);
  }, []);
  if (accessChecked && isAgentAdmin(session)) {
    return (
      <AgentStagedNotice
        pageTitle="Reports"
        targetPhase="Phase 5.0"
        description="Analytics across the platform are owner-only this pass. Your scoped activity surfaces (Dashboard, Inquiries, Bookings, Auditions) already roll up your work."
      />
    );
  }

  const totalSent = replyRateByGenre.reduce((s, r) => s + r.sent, 0);
  const totalReplies = replyRateByGenre.reduce((s, r) => s + r.replies, 0);
  const overallReplyRate = ((totalReplies / totalSent) * 100).toFixed(1);
  const totalPipelineValue = monthlyBookingValue.reduce((s, m) => s + m.value, 0);
  const totalBooked = artistPerformance.reduce((s, a) => s + a.revenue, 0);

  const statCards = [
    { label: "Total Emails Sent", value: totalSent.toString(), icon: Mail, delta: "across all campaigns" },
    { label: "Overall Reply Rate", value: `${overallReplyRate}%`, icon: TrendingUp, delta: `${totalReplies} replies` },
    { label: "Pipeline Value", value: `$${(totalPipelineValue / 1000).toFixed(0)}K`, icon: DollarSign, delta: "last 6 months" },
    { label: "Revenue Booked", value: `$${totalBooked.toLocaleString()}`, icon: BarChart3, delta: `${artistPerformance.filter(a => a.bookings > 0).length} artists with bookings` },
  ];

  return (
    <div className="min-h-screen text-foreground">
      <div className="border-b border-white/8 px-4 sm:px-6 lg:px-10 py-6">
        <p className="text-[10px] tracking-[0.3em] uppercase text-zinc-500 mb-1">
          HighLife Live · Analytics
        </p>
        <h1 className="font-display uppercase text-3xl tracking-tight">Reports</h1>
      </div>

      <div className="px-4 sm:px-6 lg:px-10 py-8 space-y-8">
        <DemoAnalyticsBanner />

        {/* Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {statCards.map((s, i) => {
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
                  <span className="text-[10px] tracking-[0.18em] uppercase text-zinc-500">{s.label}</span>
                  <Icon size={14} className="text-zinc-500" strokeWidth={1.6} />
                </div>
                <div className="font-display text-3xl text-gradient-hero leading-none mb-2">{s.value}</div>
                <div className="text-[10px] text-zinc-500">{s.delta}</div>
              </motion.div>
            );
          })}
        </div>

        {/* Charts Row */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Reply Rate by Genre — Bar Chart */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1, ease: [0.32, 0.72, 0, 1] }}
            className="glass-card rounded-2xl p-5"
          >
            <h2 className="text-[11px] tracking-[0.22em] uppercase text-zinc-300 mb-4 flex items-center gap-2">
              <BarChart3 size={14} className="text-pink-300" /> Reply Rate by Genre (%)
            </h2>
            <BarChartSVG
              data={replyRateByGenre as unknown as Record<string, unknown>[]}
              labelKey="genre"
              valueKey="rate"
              maxVal={40}
              color="#ec4899"
            />
          </motion.div>

          {/* Monthly Booking Value — Line Chart */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15, ease: [0.32, 0.72, 0, 1] }}
            className="glass-card rounded-2xl p-5"
          >
            <h2 className="text-[11px] tracking-[0.22em] uppercase text-zinc-300 mb-4 flex items-center gap-2">
              <TrendingUp size={14} className="text-pink-300" /> Monthly Booking Opportunity Value
            </h2>
            <LineChartSVG
              data={monthlyBookingValue as unknown as Record<string, unknown>[]}
              labelKey="month"
              valueKey="value"
              maxVal={22000}
            />
          </motion.div>
        </div>

        {/* Artist Performance Table */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2, ease: [0.32, 0.72, 0, 1] }}
          className="glass-card rounded-2xl p-5"
        >
          <h2 className="text-[11px] tracking-[0.22em] uppercase text-zinc-300 mb-4 flex items-center gap-2">
            <Users size={14} className="text-pink-300" /> Artist Performance
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[10px] tracking-[0.18em] uppercase text-zinc-500 border-b border-white/8">
                  <th className="text-left font-normal py-2 pr-4">Artist</th>
                  <th className="text-center font-normal py-2 px-3">Campaigns</th>
                  <th className="text-center font-normal py-2 px-3">Replies</th>
                  <th className="text-center font-normal py-2 px-3">Bookings</th>
                  <th className="text-right font-normal py-2 pl-3">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {artistPerformance.map((a) => (
                  <tr key={a.name} className="border-b border-white/4 last:border-0 hover:bg-white/3 transition-colors">
                    <td className="py-3 pr-4 text-zinc-200">{a.name}</td>
                    <td className="py-3 px-3 text-center text-zinc-400">{a.campaigns}</td>
                    <td className="py-3 px-3 text-center text-zinc-400">{a.replies}</td>
                    <td className="py-3 px-3 text-center">
                      <span className={a.bookings > 0 ? "text-emerald-300" : "text-zinc-600"}>
                        {a.bookings}
                      </span>
                    </td>
                    <td className="py-3 pl-3 text-right">
                      <span className={a.revenue > 0 ? "text-foreground" : "text-zinc-600"}>
                        ${a.revenue.toLocaleString()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Venue Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.25, ease: [0.32, 0.72, 0, 1] }}
          className="glass-card rounded-2xl p-5"
        >
          <h2 className="text-[11px] tracking-[0.22em] uppercase text-zinc-300 mb-4">Venue Type Distribution</h2>
          <div className="space-y-2.5">
            {venueTypeDistribution.map((v) => {
              const maxCount = Math.max(...venueTypeDistribution.map((x) => x.count));
              const pct = (v.count / maxCount) * 100;
              return (
                <div key={v.type} className="flex items-center gap-3">
                  <span className="text-[10px] tracking-[0.18em] uppercase text-zinc-500 w-28 shrink-0">{v.type}</span>
                  <div className="flex-1 h-2 rounded-full bg-white/6 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-pink-500 to-purple-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-xs text-zinc-300 w-6 text-right">{v.count}</span>
                </div>
              );
            })}
          </div>
        </motion.div>

        <p className="text-[10px] tracking-[0.18em] uppercase text-zinc-600 pt-4 border-t border-white/5">
          Demo data — replace before launching outreach
        </p>
      </div>
    </div>
  );
}
