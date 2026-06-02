"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";

/**
 * Pill + animated microphone mascot above "Now Booking 2026 & 2027".
 *
 * Two modes:
 *  - "pacing"  — default CSS bunny pace back-and-forth above the pill
 *  - "flying"  — triggered by clicking the mic. Wings appear, mic detaches from
 *                its CSS animation, position-fixed near cursor with a flee
 *                offset so it dodges. If the user actively chases for ~7s of
 *                accumulated cursor-pursuit, a "caught it" reward toast fires.
 *
 * Reset: click the mic again, or wait 30s, or catch it.
 */
export function NowBookingMascot() {
  const [mode, setMode] = useState<"pacing" | "flying" | "caught">("pacing");
  const [pos, setPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [showReward, setShowReward] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastMouseRef = useRef<{ x: number; y: number; t: number }>({ x: 0, y: 0, t: 0 });
  const chaseAccumMs = useRef(0);

  // When entering flying mode, seed position from the pill's current location
  const enterFlying = useCallback(() => {
    if (mode !== "pacing") {
      // toggle back if already flying
      setMode("pacing");
      setShowReward(false);
      chaseAccumMs.current = 0;
      return;
    }
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) setPos({ x: rect.left + rect.width / 2, y: rect.top - 30 });
    setMode("flying");
    chaseAccumMs.current = 0;
  }, [mode]);

  // Flight loop — runs only in flying mode
  useEffect(() => {
    if (mode !== "flying") return;

    let rafId = 0;
    let lastT = performance.now();

    const tick = (now: number) => {
      const dt = Math.min(now - lastT, 80);
      lastT = now;

      const { x: mx, y: my, t: mouseT } = lastMouseRef.current;
      const dx = pos.x - mx;
      const dy = pos.y - my;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Flee from cursor if it's within 240px
      if (dist < 240 && dist > 0.1) {
        const fleeSpeed = (240 - dist) * 0.06; // farther away = slower flee
        const nx = pos.x + (dx / dist) * fleeSpeed;
        const ny = pos.y + (dy / dist) * fleeSpeed;
        // Keep mascot on-screen (24px viewport padding)
        const vw = window.innerWidth, vh = window.innerHeight;
        setPos({
          x: Math.max(24, Math.min(vw - 24, nx)),
          y: Math.max(24, Math.min(vh - 24, ny)),
        });
      } else {
        // Idle drift back toward the top center if mouse is far / idle
        const mouseIdleMs = now - mouseT;
        if (mouseIdleMs > 600) {
          const targetX = window.innerWidth / 2;
          const targetY = 100;
          setPos({
            x: pos.x + (targetX - pos.x) * 0.02,
            y: pos.y + (targetY - pos.y) * 0.02,
          });
        }
      }

      // Chase detection: cursor close + recently moved = intentional chase
      const mouseFresh = now - mouseT < 500;
      const inChaseZone = dist < 300;
      if (mouseFresh && inChaseZone) {
        chaseAccumMs.current += dt;
        if (chaseAccumMs.current > 7000) {
          setMode("caught");
          setShowReward(true);
          return;
        }
      } else {
        // Decay chase timer when not pursuing
        chaseAccumMs.current = Math.max(0, chaseAccumMs.current - dt * 0.5);
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [mode, pos]);

  // Mouse tracking
  useEffect(() => {
    if (mode !== "flying") return;
    const onMove = (e: MouseEvent) => {
      lastMouseRef.current = { x: e.clientX, y: e.clientY, t: performance.now() };
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, [mode]);

  // Auto-reset 4s after reward shows
  useEffect(() => {
    if (mode !== "caught") return;
    const t = setTimeout(() => {
      setMode("pacing");
      setShowReward(false);
      chaseAccumMs.current = 0;
    }, 4000);
    return () => clearTimeout(t);
  }, [mode]);

  const isFlying = mode === "flying" || mode === "caught";

  // Mic SVG (re-used in both modes; wings render only when isFlying)
  const mic = (
    <svg viewBox="0 0 32 32" className="w-full h-full" fill="none">
      {isFlying && (
        <>
          {/* Left wing */}
          <path d="M 11 9 Q 4 6 1 10 Q 5 11 11 12 Z" fill="rgba(255,255,255,0.85)" stroke="rgba(0,0,0,0.3)" strokeWidth="0.3" className="mascot-wing mascot-wing-l" />
          {/* Right wing */}
          <path d="M 21 9 Q 28 6 31 10 Q 27 11 21 12 Z" fill="rgba(255,255,255,0.85)" stroke="rgba(0,0,0,0.3)" strokeWidth="0.3" className="mascot-wing mascot-wing-r" />
        </>
      )}
      <rect x="11" y="3" width="10" height="16" rx="5" fill="#1f1f25" stroke="rgba(255,255,255,0.22)" strokeWidth="0.8" />
      <line x1="12" y1="7" x2="20" y2="7" stroke="rgba(255,255,255,0.14)" strokeWidth="0.6" />
      <line x1="12" y1="10" x2="20" y2="10" stroke="rgba(255,255,255,0.14)" strokeWidth="0.6" />
      <line x1="12" y1="13" x2="20" y2="13" stroke="rgba(255,255,255,0.14)" strokeWidth="0.6" />
      <line x1="12" y1="16" x2="20" y2="16" stroke="rgba(255,255,255,0.14)" strokeWidth="0.6" />
      <path d="M 8 18 Q 8 24 16 24 Q 24 24 24 18" stroke="#ec4899" strokeWidth="1.6" fill="none" strokeLinecap="round" />
      <line x1="16" y1="24" x2="16" y2="29" stroke="rgba(255,255,255,0.6)" strokeWidth="1.4" strokeLinecap="round" />
      <line x1="13" y1="29.5" x2="19" y2="29.5" stroke="rgba(255,255,255,0.6)" strokeWidth="1.4" strokeLinecap="round" />
      <circle cx="13.5" cy="6" r="0.8" fill="rgba(255,255,255,0.5)" />
    </svg>
  );

  return (
    <div ref={containerRef} className="relative inline-block mb-7">
      {/* Pacing mode: CSS-animated mic sits in flow above the pill */}
      {!isFlying && (
        <button
          type="button"
          aria-label="Catch the mascot"
          onClick={enterFlying}
          className="mascot-mic w-8 h-8 cursor-pointer hover:scale-110 transition-transform"
          style={{ background: "transparent", border: "none", padding: 0 }}
        >
          {mic}
        </button>
      )}

      {/* Flying mode: mic detaches into a fixed-position overlay following cursor flee logic */}
      {isFlying && (
        <button
          type="button"
          aria-label="Stop chasing"
          onClick={enterFlying}
          className="mascot-mic-flying"
          style={{
            position: "fixed",
            left: `${pos.x}px`,
            top: `${pos.y}px`,
            width: 40,
            height: 40,
            transform: "translate(-50%, -50%)",
            zIndex: 60,
            cursor: "pointer",
            background: "transparent",
            border: "none",
            padding: 0,
            transition: "left 0.06s linear, top 0.06s linear",
            pointerEvents: mode === "caught" ? "none" : "auto",
          }}
        >
          {mic}
        </button>
      )}

      {/* Pill */}
      <Link
        href="/book"
        className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/45 border border-white/10 hover:border-pink-400/40 backdrop-blur transition-colors group"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_10px_#34d399]" />
        <span className="text-[10px] tracking-[0.3em] uppercase text-zinc-300 group-hover:text-foreground font-medium transition-colors">
          Now Booking 2026 &amp; 2027
        </span>
      </Link>

      {/* Caught reward toast */}
      {showReward && (
        <div
          className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center px-4 pb-6 pointer-events-none"
          aria-live="polite"
        >
          <div className="glass-card rounded-2xl px-6 py-5 max-w-sm text-center pointer-events-auto animate-fade-in">
            <p className="text-2xl mb-2">🎤</p>
            <p className="font-display uppercase text-base tracking-tight text-foreground mb-1">
              You caught it
            </p>
            <p className="text-xs text-zinc-300 mb-4 leading-relaxed">
              Tell us in the inquiry notes that you caught the mascot — we&apos;ll bump
              your booking to the top of the review queue.
            </p>
            <Link
              href="/book?from=mascot"
              className="inline-flex items-center justify-center gap-2 px-5 py-2 rounded-full btn-gradient text-[10px] tracking-[0.18em] uppercase font-bold"
            >
              Send an Inquiry
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
