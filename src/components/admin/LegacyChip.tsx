// Phase 3.8 scaffolding — small "LEGACY" pill for surfaces being preserved
// for deep-linking / historical access but no longer the canonical workflow.
// Used on the Bookings tab header (per Liam: keep route alive, label as legacy,
// not the final booking workflow).

import { Archive } from "lucide-react";

interface LegacyChipProps {
  hint?: string;
  className?: string;
}

export function LegacyChip({
  hint = "Legacy surface — canonical workflow lives in Inquiries. /api/bookings is scheduled for retirement in Phase 5.5.",
  className = "",
}: LegacyChipProps) {
  return (
    <span
      title={hint}
      className={`inline-flex items-center gap-1 rounded-full border border-zinc-500/40 bg-zinc-500/10 text-zinc-300 tracking-[0.18em] uppercase text-[9px] px-2 py-0.5 ${className}`}
    >
      <Archive size={9} aria-hidden />
      Legacy
    </span>
  );
}
