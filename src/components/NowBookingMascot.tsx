"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";

/**
 * Interactive mic mascot above "Now Booking 2026 & 2027".
 *
 * State machine:
 *  - "pacing"  → default CSS bunny pace above the pill. Mic is clickable.
 *  - "flying"  → after click. Wings appear, mic flees the cursor. NOT clickable.
 *                Accumulates chase time when cursor stays close + fresh.
 *  - "homing"  → after 7s of accumulated chase. Mic stops fleeing and homes
 *                deterministically toward the box that slides in from off-screen
 *                left.
 *  - "boxed"   → mic has arc-jumped into the box. Box sits on screen until the
 *                user clicks it.
 *  - "coupon"  → click box → box exits + coupon popup appears. Popup stays
 *                open until user dismisses (no auto-close). Mic returns to
 *                pacing on dismiss.
 */

// PLACEHOLDER — swap with James's official code when he sends it.
const COUPON_CODE = "HLLIVE-EARLY";

type Mode = "pacing" | "flying" | "homing" | "boxed" | "coupon";

export function NowBookingMascot() {
  const [mode, setMode] = useState<Mode>("pacing");
  const [pos, setPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [boxPos, setBoxPos] = useState<{ x: number; y: number }>({ x: -80, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const lastMouseRef = useRef<{ x: number; y: number; t: number }>({ x: -1000, y: -1000, t: 0 });
  const chaseAccumMs = useRef(0);

  // Box target: lands ~120px from left edge, roughly hero-vertical center
  const boxTarget = useCallback(() => {
    if (typeof window === "undefined") return { x: 120, y: 280 };
    return { x: 120, y: Math.min(320, window.innerHeight * 0.35) };
  }, []);

  // Click the mic in pacing mode to launch into flying
  const enterFlying = useCallback(() => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) setPos({ x: rect.left + rect.width / 2, y: rect.top - 30 });
    setMode("flying");
    chaseAccumMs.current = 0;
  }, []);

  // Mouse tracking — needed for flee + chase detection
  useEffect(() => {
    if (mode !== "flying") return;
    const onMove = (e: MouseEvent) => {
      lastMouseRef.current = { x: e.clientX, y: e.clientY, t: performance.now() };
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, [mode]);

  // Flight loop (flee + chase tracking) — runs only in flying mode
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

      // Flee from cursor within 240px
      if (dist < 240 && dist > 0.1) {
        const fleeSpeed = (240 - dist) * 0.06;
        const nx = pos.x + (dx / dist) * fleeSpeed;
        const ny = pos.y + (dy / dist) * fleeSpeed;
        const vw = window.innerWidth, vh = window.innerHeight;
        setPos({
          x: Math.max(40, Math.min(vw - 40, nx)),
          y: Math.max(40, Math.min(vh - 40, ny)),
        });
      } else {
        // Drift back toward top center when cursor idle
        const mouseIdleMs = now - mouseT;
        if (mouseIdleMs > 600) {
          const tx = window.innerWidth / 2;
          const ty = 100;
          setPos({
            x: pos.x + (tx - pos.x) * 0.02,
            y: pos.y + (ty - pos.y) * 0.02,
          });
        }
      }

      // Chase detection
      const mouseFresh = now - mouseT < 500;
      if (mouseFresh && dist < 300) {
        chaseAccumMs.current += dt;
        if (chaseAccumMs.current > 7000) {
          // Trigger homing — box slides in, mic flies toward it
          const tgt = boxTarget();
          setBoxPos({ x: -90, y: tgt.y }); // off-screen left
          setMode("homing");
          return;
        }
      } else {
        chaseAccumMs.current = Math.max(0, chaseAccumMs.current - dt * 0.5);
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [mode, pos, boxTarget]);

  // Homing loop — box slides in from left, mic arcs toward box's open top
  useEffect(() => {
    if (mode !== "homing") return;

    let rafId = 0;
    let lastT = performance.now();
    const startPos = { ...pos };
    const tgt = boxTarget();
    let phase: "box-sliding" | "mic-arcing" = "box-sliding";
    let arcT = 0; // 0..1 for the mic arc into the box

    const tick = (now: number) => {
      const dt = Math.min(now - lastT, 80);
      lastT = now;

      if (phase === "box-sliding") {
        // Box slides from -90 to tgt.x at ~250px/s
        setBoxPos((b) => {
          const next = b.x + dt * 0.25;
          if (next >= tgt.x) {
            phase = "mic-arcing";
            return { x: tgt.x, y: tgt.y };
          }
          return { x: next, y: tgt.y };
        });
      } else {
        // Mic arcs into box top — bezier-ish path with rise then drop into box opening
        arcT = Math.min(1, arcT + dt / 1200); // 1.2s to land
        // Cubic ease-in for drop, with apex above the box
        const startX = startPos.x;
        const startY = startPos.y;
        const endX = tgt.x;
        const endY = tgt.y - 8; // slight overshoot up into the box opening
        const apexX = (startX + endX) / 2;
        const apexY = Math.min(startY, tgt.y) - 80; // arc apex above both
        // Quadratic bezier
        const u = arcT;
        const oneMinusU = 1 - u;
        const x = oneMinusU * oneMinusU * startX + 2 * oneMinusU * u * apexX + u * u * endX;
        const y = oneMinusU * oneMinusU * startY + 2 * oneMinusU * u * apexY + u * u * endY;
        setPos({ x, y });
        if (arcT >= 1) {
          setMode("boxed");
          return;
        }
      }
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [mode, pos, boxTarget]); // intentional minimal dep set

  const openCoupon = () => {
    setMode("coupon");
  };

  const closeCoupon = () => {
    setMode("pacing");
    setBoxPos({ x: -80, y: 0 });
    chaseAccumMs.current = 0;
  };

  const [copied, setCopied] = useState(false);
  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(COUPON_CODE);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // silently ignore
    }
  };

  const showFloatingMic = mode === "flying" || mode === "homing";
  const inFlight = mode === "flying" || mode === "homing" || mode === "boxed";

  // Mic SVG — same body in all modes; wings appear in flight states
  const mic = (
    <svg viewBox="0 0 32 32" className="w-full h-full" fill="none">
      {inFlight && (
        <>
          <path d="M 11 9 Q 4 6 1 10 Q 5 11 11 12 Z" fill="rgba(255,255,255,0.85)" stroke="rgba(0,0,0,0.3)" strokeWidth="0.3" className="mascot-wing mascot-wing-l" />
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
      {/* Pacing-mode mic in flow above the pill (only mode where mic is clickable) */}
      {mode === "pacing" && (
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

      {/* Flying / homing mic — fixed-position overlay, NOT clickable */}
      {showFloatingMic && (
        <div
          aria-hidden
          style={{
            position: "fixed",
            left: `${pos.x}px`,
            top: `${pos.y}px`,
            width: 40,
            height: 40,
            transform: "translate(-50%, -50%)",
            zIndex: 60,
            pointerEvents: "none",
            transition: "left 0.06s linear, top 0.06s linear",
          }}
        >
          {mic}
        </div>
      )}

      {/* Cardboard box — slides in from left, then sits until clicked */}
      {(mode === "homing" || mode === "boxed") && (
        <button
          type="button"
          aria-label="Open the box"
          onClick={mode === "boxed" ? openCoupon : undefined}
          disabled={mode !== "boxed"}
          style={{
            position: "fixed",
            left: `${boxPos.x}px`,
            top: `${boxPos.y}px`,
            transform: "translate(-50%, -50%)",
            zIndex: 55,
            fontSize: 56,
            lineHeight: 1,
            background: "transparent",
            border: "none",
            padding: 8,
            cursor: mode === "boxed" ? "pointer" : "default",
            filter: mode === "boxed" ? "drop-shadow(0 6px 18px rgba(236,72,153,0.4))" : "drop-shadow(0 4px 10px rgba(0,0,0,0.4))",
            transition: "filter 200ms ease, transform 200ms ease",
          }}
          className={mode === "boxed" ? "mascot-box-wiggle hover:scale-110" : ""}
        >
          <span role="img" aria-label="package">📦</span>
        </button>
      )}

      {/* Pill — links to /book in all modes */}
      <Link
        href="/book"
        className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/45 border border-white/10 hover:border-pink-400/40 backdrop-blur transition-colors group"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_10px_#34d399]" />
        <span className="text-[10px] tracking-[0.3em] uppercase text-zinc-300 group-hover:text-foreground font-medium transition-colors">
          Now Booking 2026 &amp; 2027
        </span>
      </Link>

      {/* Coupon popup — no auto-close, dismiss via X button only */}
      {mode === "coupon" && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center px-4 bg-black/55 backdrop-blur-sm animate-fade-in"
          role="dialog"
          aria-modal="true"
          aria-labelledby="mascot-coupon-title"
        >
          <div className="glass-card rounded-3xl px-7 py-7 max-w-sm w-full text-center relative">
            <button
              type="button"
              onClick={closeCoupon}
              aria-label="Close"
              className="absolute top-3 right-3 w-7 h-7 rounded-full flex items-center justify-center text-zinc-400 hover:text-foreground hover:bg-white/10 transition-colors"
            >
              <span aria-hidden className="text-base leading-none">×</span>
            </button>
            <p className="text-3xl mb-3" aria-hidden>🎤</p>
            <p
              id="mascot-coupon-title"
              className="font-display uppercase text-xl tracking-tight text-foreground mb-2"
            >
              You caught it
            </p>
            <p className="text-xs text-zinc-300 leading-relaxed mb-5">
              Use this code on your booking inquiry — it bumps your request to
              the top of the review queue.
            </p>

            <div className="bg-black/50 border border-pink-500/30 rounded-2xl px-4 py-3 mb-5">
              <p className="text-[9px] tracking-[0.25em] uppercase text-zinc-500 mb-1">Coupon code</p>
              <p className="font-mono text-xl tracking-[0.18em] text-foreground select-all">{COUPON_CODE}</p>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={copyCode}
                className="flex-1 py-2.5 rounded-full border border-white/15 hover:border-white/30 bg-white/5 hover:bg-white/10 text-xs tracking-[0.18em] uppercase text-zinc-200 transition-colors"
              >
                {copied ? "Copied" : "Copy Code"}
              </button>
              <Link
                href="/book?from=mascot"
                onClick={closeCoupon}
                className="flex-1 py-2.5 rounded-full btn-gradient text-xs tracking-[0.18em] uppercase font-bold inline-flex items-center justify-center"
              >
                Send Inquiry
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
