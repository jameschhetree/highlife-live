// Phase 3.8 scaffolding — small "DEMO" pill for cards/sections showing static or
// placeholder numbers that aren't tied to live data yet. Stops the dashboard
// from presenting fake KPIs as production facts.

import { Activity } from "lucide-react";

interface DemoAnalyticsBadgeProps {
  /** Tooltip / title text. Defaults to a generic phase reference. */
  hint?: string;
  size?: "sm" | "md";
  className?: string;
}

export function DemoAnalyticsBadge({
  hint = "Demo analytics — live reporting coming soon",
  size = "sm",
  className = "",
}: DemoAnalyticsBadgeProps) {
  const px = size === "md" ? "px-2.5 py-1" : "px-2 py-0.5";
  const text = size === "md" ? "text-[10px]" : "text-[9px]";
  return (
    <span
      title={hint}
      className={`inline-flex items-center gap-1 rounded-full border border-amber-400/30 bg-amber-400/10 text-amber-300 tracking-[0.18em] uppercase ${px} ${text} ${className}`}
    >
      <Activity size={size === "md" ? 10 : 9} aria-hidden />
      Demo
    </span>
  );
}

/** Banner version for the top of pages with mostly-static content (e.g. /admin/reports). */
export function DemoAnalyticsBanner({
  title = "Demo Analytics",
  body = "Live reporting coming soon. Numbers below are illustrative; do not present as production metrics.",
}: {
  title?: string;
  body?: string;
}) {
  return (
    <div className="rounded-xl border border-amber-400/25 bg-amber-400/5 px-4 py-3 flex items-start gap-3 mb-5">
      <Activity size={16} className="text-amber-300 mt-0.5 shrink-0" />
      <div>
        <div className="text-[11px] tracking-[0.18em] uppercase text-amber-300 font-semibold">{title}</div>
        <p className="text-xs text-zinc-300 mt-0.5">{body}</p>
      </div>
    </div>
  );
}
