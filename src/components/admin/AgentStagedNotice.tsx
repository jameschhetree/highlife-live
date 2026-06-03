"use client";

// Phase 3.8 — agent-facing "broad nav, staged content" notice.
// Liam directive (Murd 3.8 v2): keep all tabs visible for agents so the
// ecosystem feels complete, but stage tabs whose backend isn't ready for
// agent scoping. This is the consistent placeholder.
//
// Used on /admin/bookings, /admin/campaigns, /admin/pipeline, /admin/epks,
// /admin/research, /admin/reports when the current session is an agent.
// Owner views render normally.

import Link from "next/link";
import { Sparkles, ArrowLeft } from "lucide-react";

interface AgentStagedNoticeProps {
  /** Page title shown in the staged state (e.g. "Pipeline"). */
  pageTitle: string;
  /** One-line description of what this tab will do once wired for agents. */
  description: string;
  /** Defaults to Phase 5.5. */
  targetPhase?: string;
}

export function AgentStagedNotice({
  pageTitle,
  description,
  targetPhase = "Phase 5.5",
}: AgentStagedNoticeProps) {
  return (
    <div className="min-h-screen text-foreground">
      <div className="border-b border-white/8 px-4 sm:px-6 lg:px-10 py-6">
        <p className="text-[10px] tracking-[0.3em] uppercase text-zinc-500 mb-1">
          HighLife Live · {pageTitle}
        </p>
        <h1 className="font-display uppercase text-3xl tracking-tight">{pageTitle}</h1>
      </div>

      <div className="px-4 sm:px-6 lg:px-10 py-12">
        <div className="glass-card rounded-2xl p-8 max-w-2xl">
          <div className="flex items-start gap-4 mb-5">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-400/20 to-violet-400/20 inline-flex items-center justify-center shrink-0">
              <Sparkles size={20} className="text-pink-200" />
            </div>
            <div>
              <p className="text-[10px] tracking-[0.18em] uppercase text-zinc-500">Agent preview — {targetPhase}</p>
              <h2 className="mt-1 font-display uppercase text-xl tracking-tight">Coming for agents</h2>
            </div>
          </div>

          <p className="text-sm text-zinc-300 leading-relaxed mb-5">{description}</p>

          <p className="text-xs text-zinc-500 leading-relaxed mb-6">
            Right now this tab is owner-only because the agent-scoped version isn&apos;t built yet. We&apos;re keeping it visible in the nav so the platform feels complete instead of bouncing you to a 404. Real data lands in {targetPhase}.
          </p>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 hover:border-white/25 bg-black/40 text-xs tracking-[0.18em] uppercase text-zinc-300 hover:text-foreground transition-colors"
            >
              <ArrowLeft size={12} /> Back to Dashboard
            </Link>
            <Link
              href="/admin/artists"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full btn-gradient text-xs tracking-[0.18em] uppercase font-bold"
            >
              My Artists
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
