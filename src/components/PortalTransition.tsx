"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Direction = "entering" | "leaving";

interface Props {
  /** "/" or "/admin/login" etc — where to land after the warning */
  to: string;
  direction: Direction;
  /** Render-prop for whatever should trigger the transition (button, link, etc) */
  children: (start: () => void) => React.ReactNode;
}

/**
 * Brief full-screen "entering / leaving back-end tools" warning overlay.
 * Wraps any trigger element via render-prop. Shows the overlay for ~700ms
 * then navigates to `to`. No way to cancel mid-transition (kept simple).
 *
 * Per Dok's spec 2026-06-02 — replaces the 404 flash that used to happen
 * when bouncing between public site and admin portal.
 */
export function PortalTransition({ to, direction, children }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => {
      router.push(to);
    }, 750);
    return () => clearTimeout(t);
  }, [open, to, router]);

  const headline = direction === "entering" ? "Entering back-end tools" : "Leaving back-end tools";
  const sub = direction === "entering"
    ? "Loading the admin portal — hold tight."
    : "Returning to the public site.";

  return (
    <>
      {children(() => setOpen(true))}
      {open && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-sm"
          role="status"
          aria-live="polite"
        >
          <div
            className="rounded-3xl px-8 py-7 max-w-sm w-[90%] text-center"
            style={{
              background: "#0a0c12",
              border: "1px solid rgba(255,255,255,0.12)",
              boxShadow: "0 30px 80px -20px rgba(236,72,153,0.35)",
            }}
          >
            <div className="mx-auto mb-4 w-10 h-10 rounded-full border-2 border-pink-400 border-t-transparent animate-spin" />
            <p className="font-display uppercase text-lg tracking-tight text-foreground mb-1">
              {headline}
            </p>
            <p className="text-xs text-zinc-400">{sub}</p>
          </div>
        </div>
      )}
    </>
  );
}
