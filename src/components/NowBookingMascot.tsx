"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Copy } from "lucide-react";

// Official coupon code from James (HL Live, 2026-06-02).
const COUPON_CODE = "HLLbeta1.1-4jeremy";

type Mode = "pacing" | "flying" | "homing" | "boxed" | "coupon";

export function NowBookingMascot() {
  const [mode, setMode] = useState<Mode>("pacing");

  // Positions live in refs to avoid useEffect re-runs on every frame.
  // We mirror them into state only when needed for render.
  const posRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const boxRef = useRef<{ x: number; y: number }>({ x: -90, y: 280 });
  const [, forceRender] = useState(0);
  const tickRender = useRef(0);

  // Bump render at most ~60fps (each rAF). Cheaper than triggering setState
  // for unrelated values.
  const scheduleRender = () => {
    tickRender.current = (tickRender.current + 1) % 1000000;
    forceRender(tickRender.current);
  };

  const containerRef = useRef<HTMLDivElement>(null);
  const lastMouseRef = useRef<{ x: number; y: number; t: number }>({
    x: -10000,
    y: -10000,
    t: 0,
  });
  const chaseAccumMs = useRef(0);
  const arcStateRef = useRef<{ start: { x: number; y: number }; t: number } | null>(null);
  const phaseRef = useRef<"box-sliding" | "mic-arcing">("box-sliding");
  // Escape state — the mic picks an escape direction and commits to it for
  // a short window before re-evaluating, so motion looks like a panicked
  // animal running rather than a vector pinned to the cursor.
  const escapeRef = useRef<{ vx: number; vy: number; expiresAt: number }>({
    vx: 0,
    vy: 0,
    expiresAt: 0,
  });

  const boxTarget = useCallback(() => {
    if (typeof window === "undefined") return { x: 90, y: 300 };
    return {
      x: Math.max(80, window.innerWidth * 0.07), // further left so it doesn't overlap hero content
      y: Math.min(340, window.innerHeight * 0.36),
    };
  }, []);

  const enterFlying = useCallback(() => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      posRef.current = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    }
    chaseAccumMs.current = 0;
    setMode("flying");
  }, []);

  // Cursor tracking — flee logic reads lastMouseRef every frame.
  // Desktop only per scope; touch handlers intentionally not added.
  useEffect(() => {
    if (mode === "pacing" || mode === "coupon") return;
    const onMove = (e: MouseEvent) => {
      lastMouseRef.current = { x: e.clientX, y: e.clientY, t: performance.now() };
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, [mode]);

  // Single animation loop that handles flying / homing — runs while mode is
  // either of those, and only re-mounts on mode boundary changes (NOT on every
  // pos change). This is what was broken before: the arc kept resetting to 0
  // because the effect re-ran on every setState.
  useEffect(() => {
    if (mode !== "flying" && mode !== "homing") return;

    let rafId = 0;
    let lastT = performance.now();

    // Reset homing state on entry into homing mode
    if (mode === "homing") {
      arcStateRef.current = { start: { ...posRef.current }, t: 0 };
      const tgt = boxTarget();
      boxRef.current = { x: -90, y: tgt.y };
      phaseRef.current = "box-sliding";
    }

    const tick = (now: number) => {
      const dt = Math.min(now - lastT, 60);
      lastT = now;

      if (mode === "flying") {
        const { x: mx, y: my, t: mouseT } = lastMouseRef.current;
        const px = posRef.current.x;
        const py = posRef.current.y;
        const dx = px - mx;
        const dy = py - my;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // "Running from" model: when the cursor is close, the mic picks an
        // escape direction (radial-from-cursor + random kick) and COMMITS to
        // it for ~400-700ms before re-evaluating. This looks like a panicked
        // animal making a run, not a vector glued to the mouse.
        const MIN_DIST = 250;
        const vw = window.innerWidth, vh = window.innerHeight;
        let nextX = px;
        let nextY = py;

        if (dist < MIN_DIST && dist > 0.1) {
          // Re-evaluate escape direction ONLY on expiry. The previous build
          // also recalced when cursor was "too close" (< 130px), which made
          // the mic stutter — escape vector flipped with a fresh random kick
          // every frame while the user was on top of it. Now: pick a direction
          // and commit for the full 500-900ms window so it actually runs.
          if (now > escapeRef.current.expiresAt) {
            const ux = dx / dist;
            const uy = dy / dist;
            // Random angular kick of ±30° off pure-radial — enough to look
            // alive, narrow enough to feel like a coherent escape, not a flail
            const kickAngle = (Math.random() - 0.5) * (Math.PI / 3);
            const cosK = Math.cos(kickAngle);
            const sinK = Math.sin(kickAngle);
            const ekx = ux * cosK - uy * sinK;
            const eky = ux * sinK + uy * cosK;
            escapeRef.current = {
              vx: ekx,
              vy: eky,
              expiresAt: now + 500 + Math.random() * 400,
            };
          }
          // Speed scales with how close the cursor is — sprint when close
          const intensity = Math.pow(1 - dist / MIN_DIST, 1.4);
          const sprintSpeed = 14 + intensity * 22; // px per 16ms baseline
          const step = sprintSpeed * (dt / 16);
          nextX = px + escapeRef.current.vx * step;
          nextY = py + escapeRef.current.vy * step;
        } else {
          // Cursor far/idle: drift back toward top-center with a tiny wander.
          // No escape commitment active.
          escapeRef.current.expiresAt = 0;
          const mouseIdleMs = now - mouseT;
          const tx = window.innerWidth / 2;
          const ty = 110;
          const driftLerp = mouseIdleMs > 600 ? 0.025 : 0.008;
          const wanderX = Math.sin(now * 0.0011) * 0.5;
          const wanderY = Math.cos(now * 0.0013) * 0.4;
          nextX = px + (tx - px) * driftLerp + wanderX;
          nextY = py + (ty - py) * driftLerp + wanderY;
        }

        // Soft clamp + corner-escape: if hitting an edge, force a fresh
        // escape direction that points back into the viewport
        if (nextX < 48 || nextX > vw - 48 || nextY < 48 || nextY > vh - 48) {
          nextX = Math.max(48, Math.min(vw - 48, nextX));
          nextY = Math.max(48, Math.min(vh - 48, nextY));
          // Aim escape back toward center on next eval
          const cx = vw / 2 - nextX;
          const cy = vh / 2 - nextY;
          const cMag = Math.hypot(cx, cy) || 1;
          escapeRef.current = {
            vx: cx / cMag + (Math.random() - 0.5) * 0.4,
            vy: cy / cMag + (Math.random() - 0.5) * 0.4,
            expiresAt: now + 350,
          };
        }
        posRef.current = { x: nextX, y: nextY };

        // Chase detection: cursor present + within 300px
        const mouseFresh = now - mouseT < 500;
        if (mouseFresh && dist < 300) {
          chaseAccumMs.current += dt;
          if (chaseAccumMs.current > 7000) {
            setMode("homing");
            return;
          }
        } else {
          chaseAccumMs.current = Math.max(0, chaseAccumMs.current - dt * 0.5);
        }
      } else if (mode === "homing") {
        const tgt = boxTarget();
        if (phaseRef.current === "box-sliding") {
          // Box slides from -90 to tgt.x at ~280px/s
          const newX = boxRef.current.x + dt * 0.28;
          if (newX >= tgt.x) {
            boxRef.current = { x: tgt.x, y: tgt.y };
            phaseRef.current = "mic-arcing";
            // Capture mic start position now that box is in place
            arcStateRef.current = { start: { ...posRef.current }, t: 0 };
          } else {
            boxRef.current = { x: newX, y: tgt.y };
          }
        } else if (phaseRef.current === "mic-arcing" && arcStateRef.current) {
          arcStateRef.current.t = Math.min(1, arcStateRef.current.t + dt / 1500);
          const u = arcStateRef.current.t;
          const startX = arcStateRef.current.start.x;
          const startY = arcStateRef.current.start.y;
          const endX = tgt.x;
          const endY = tgt.y - 6;
          const apexX = (startX + endX) / 2;
          const apexY = Math.min(startY, tgt.y) - 90;
          const oneMinusU = 1 - u;
          // Base bezier
          const baseX = oneMinusU * oneMinusU * startX + 2 * oneMinusU * u * apexX + u * u * endX;
          const baseY = oneMinusU * oneMinusU * startY + 2 * oneMinusU * u * apexY + u * u * endY;
          // Small wobble that fades to 0 as it lands (so it docks cleanly)
          const wobbleAmp = (1 - u) * 4;
          const wobX = Math.sin(now * 0.012) * wobbleAmp;
          const wobY = Math.cos(now * 0.014) * wobbleAmp * 0.6;
          posRef.current = { x: baseX + wobX, y: baseY + wobY };
          if (arcStateRef.current.t >= 1) {
            setMode("boxed");
            return;
          }
        }
      }

      scheduleRender();
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [mode, boxTarget]); // intentionally NOT depending on pos/box refs

  const openCoupon = () => setMode("coupon");

  const closeCoupon = () => {
    setMode("pacing");
    boxRef.current = { x: -90, y: 0 };
    chaseAccumMs.current = 0;
    arcStateRef.current = null;
  };

  const [copied, setCopied] = useState(false);
  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(COUPON_CODE);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // ignore
    }
  };

  const showFloatingMic = mode === "flying" || mode === "homing";
  const inFlight = mode === "flying" || mode === "homing" || mode === "boxed";
  const showBox = mode === "homing" || mode === "boxed";

  // Box visually transitions from "open flaps" (during homing + first beat of boxed)
  // to "closed flaps + ribbon" (rest of boxed mode). Trigger via timed class.
  const [boxClosed, setBoxClosed] = useState(false);
  useEffect(() => {
    if (mode === "boxed") {
      // 250ms delay so the mic visually settles inside before flaps close
      const t = setTimeout(() => setBoxClosed(true), 250);
      return () => clearTimeout(t);
    }
    setBoxClosed(false);
  }, [mode]);

  const renderMic = (showWings = inFlight) => (
    <svg viewBox="0 0 32 32" className="w-full h-full" fill="none">
      {showWings && (
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
      {mode === "pacing" && (
        <button
          type="button"
          aria-label="Catch the mascot"
          onClick={enterFlying}
          className="mascot-mic hidden lg:block w-8 h-8 cursor-pointer hover:scale-110 transition-transform"
          style={{ background: "transparent", border: "none", padding: 0 }}
        >
          {renderMic(false)}
        </button>
      )}

      {showFloatingMic && (
        <div
          aria-hidden
          style={{
            position: "fixed",
            left: `${posRef.current.x}px`,
            top: `${posRef.current.y}px`,
            width: 40,
            height: 40,
            transform: "translate(-50%, -50%)",
            zIndex: 60,
            pointerEvents: "none",
            willChange: "left, top",
          }}
        >
          {renderMic(true)}
        </div>
      )}

      {showBox && (
        <button
          type="button"
          aria-label={mode === "boxed" ? "Open the box to reveal your coupon" : "Box arriving"}
          onClick={mode === "boxed" ? openCoupon : undefined}
          disabled={mode !== "boxed"}
          style={{
            position: "fixed",
            left: `${boxRef.current.x}px`,
            top: `${boxRef.current.y}px`,
            transform: "translate(-50%, -50%)",
            zIndex: 55,
            width: 110,
            height: 110,
            background: "transparent",
            border: "none",
            padding: 0,
            cursor: mode === "boxed" ? "pointer" : "default",
            filter: mode === "boxed"
              ? "drop-shadow(0 8px 22px rgba(236,72,153,0.5))"
              : "drop-shadow(0 4px 10px rgba(0,0,0,0.4))",
            transition: "filter 220ms ease",
            willChange: "left, top",
          }}
          className={mode === "boxed" ? "mascot-box-wiggle hover:scale-105" : ""}
        >
          {/* Cardboard box SVG — flaps angle outward when "open", flat with ribbon when "closed" */}
          <svg viewBox="0 0 100 100" width="100%" height="100%" fill="none" aria-hidden style={{ pointerEvents: "none" }}>
            <defs>
              <linearGradient id="cardboard" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#d4a574" />
                <stop offset="55%" stopColor="#b88758" />
                <stop offset="100%" stopColor="#8a6240" />
              </linearGradient>
              <linearGradient id="cardboard-dark" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#9c7350" />
                <stop offset="100%" stopColor="#6b4830" />
              </linearGradient>
              <linearGradient id="ribbon" x1="0" x2="1" y1="0" y2="0">
                <stop offset="0%" stopColor="#fb7299" />
                <stop offset="50%" stopColor="#ec4899" />
                <stop offset="100%" stopColor="#be1d6d" />
              </linearGradient>
            </defs>

            {/* Box body (4-sided) */}
            <path d="M 24 52 L 76 52 L 78 90 L 22 90 Z" fill="url(#cardboard)" stroke="rgba(0,0,0,0.25)" strokeWidth="0.5" />
            {/* Center seam tape */}
            <rect x="48" y="52" width="4" height="38" fill="rgba(0,0,0,0.18)" />

            {/* Left flap — open angled out by default, rotates flat when closed */}
            <g
              className={boxClosed ? "box-flap box-flap-l-closed" : "box-flap box-flap-l-open"}
              style={{ transformOrigin: "50px 52px" }}
            >
              <path d="M 24 52 L 50 52 L 50 36 L 12 30 Z" fill="url(#cardboard-dark)" stroke="rgba(0,0,0,0.3)" strokeWidth="0.5" />
            </g>
            {/* Right flap */}
            <g
              className={boxClosed ? "box-flap box-flap-r-closed" : "box-flap box-flap-r-open"}
              style={{ transformOrigin: "50px 52px" }}
            >
              <path d="M 76 52 L 50 52 L 50 36 L 88 30 Z" fill="url(#cardboard-dark)" stroke="rgba(0,0,0,0.3)" strokeWidth="0.5" />
            </g>

            {/* Ribbon — appears only when closed */}
            {boxClosed && (
              <>
                {/* Horizontal strap across body */}
                <rect x="22" y="60" width="56" height="6" fill="url(#ribbon)" />
                {/* Vertical strap (front) */}
                <rect x="46" y="52" width="8" height="38" fill="url(#ribbon)" />
                {/* Bow on top — two leaves + center knot */}
                <ellipse cx="42" cy="48" rx="9" ry="6" fill="url(#ribbon)" transform="rotate(-18 42 48)" />
                <ellipse cx="58" cy="48" rx="9" ry="6" fill="url(#ribbon)" transform="rotate(18 58 48)" />
                <circle cx="50" cy="50" r="3.5" fill="#be1d6d" />
                {/* Bow streamers */}
                <path d="M 46 56 L 42 66" stroke="url(#ribbon)" strokeWidth="2.4" strokeLinecap="round" />
                <path d="M 54 56 L 58 66" stroke="url(#ribbon)" strokeWidth="2.4" strokeLinecap="round" />
              </>
            )}
          </svg>

          {mode === "boxed" && boxClosed && (
            <span
              aria-hidden
              style={{
                position: "absolute",
                left: "50%",
                top: "22px",
                width: 28,
                height: 28,
                transform: "translateX(-50%) rotate(-7deg)",
                pointerEvents: "none",
                filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.35))",
              }}
            >
              {renderMic(false)}
            </span>
          )}

          {/* "Tap to open" hint — only when boxed + flaps closed */}
          {mode === "boxed" && boxClosed && (
            <span
              aria-hidden
              style={{
                position: "absolute",
                left: "50%",
                top: "calc(100% + 4px)",
                transform: "translateX(-50%)",
                fontSize: 9,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.7)",
                whiteSpace: "nowrap",
                fontWeight: 600,
                pointerEvents: "none",
              }}
            >
              Tap to open
            </span>
          )}
        </button>
      )}

      <Link
        href="/book"
        className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/45 border border-white/10 hover:border-pink-400/40 backdrop-blur transition-colors group"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_10px_#34d399]" />
        <span className="text-[10px] tracking-[0.3em] uppercase text-zinc-300 group-hover:text-foreground font-medium transition-colors">
          Now Booking 2026 &amp; 2027
        </span>
      </Link>

      {mode === "coupon" && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center px-4 bg-black/90 animate-fade-in"
          role="dialog"
          aria-modal="true"
          aria-labelledby="mascot-coupon-title"
        >
          <div
            className="rounded-3xl px-7 py-7 max-w-sm w-full text-center relative"
            style={{
              background: "#0a0c12",
              border: "1px solid rgba(255,255,255,0.12)",
              boxShadow: "0 30px 80px -20px rgba(236,72,153,0.35), 0 0 0 1px rgba(255,255,255,0.04)",
            }}
          >
            <button
              type="button"
              onClick={closeCoupon}
              aria-label="Close"
              className="absolute top-3 right-3 w-7 h-7 rounded-full flex items-center justify-center text-zinc-400 hover:text-foreground hover:bg-white/10 transition-colors"
            >
              <span aria-hidden className="text-base leading-none">×</span>
            </button>
            <p className="text-3xl mb-3" aria-hidden>🎟️</p>
            <p
              id="mascot-coupon-title"
              className="font-display uppercase text-xl tracking-tight text-foreground mb-2"
            >
              Beta Site Coupon Code
            </p>
            <p className="text-xs text-zinc-300 leading-relaxed mb-5">
              Thanks for becoming an early user, we hope you enjoy our site, to
              reward you for finding an Easter Egg, here&apos;s a 10% off coupon
              code!
            </p>
            <button
              type="button"
              onClick={copyCode}
              className="rounded-2xl px-4 py-3 mb-5"
              style={{
                background: "#06080d",
                border: "1px solid rgba(236,72,153,0.4)",
              }}
            >
              <p className="text-[9px] tracking-[0.25em] uppercase text-zinc-500 mb-1">Ticket coupon code</p>
              <span className="flex items-center justify-center gap-3">
                <span className="font-mono text-xl tracking-[0.18em] text-foreground select-all">{COUPON_CODE}</span>
                <Copy size={16} className="text-pink-300" aria-hidden />
              </span>
              <span className="sr-only">Copy coupon code</span>
            </button>
            <p className="text-[10px] text-zinc-400 leading-relaxed mb-5">
              Terms: Code valid for all HighLife Live ticketed events unless
              specifically specified in event terms, offer valid for all events
              until September 1st 2026. 1:00GMT
            </p>
            <Link
              href="/events"
              onClick={async (e) => {
                // Copy code to clipboard before navigating
                try {
                  await navigator.clipboard.writeText(COUPON_CODE);
                  setCopied(true);
                } catch { /* ignore */ }
                closeCoupon();
              }}
              className="w-full py-3 rounded-full btn-gradient text-xs tracking-[0.18em] uppercase font-bold inline-flex items-center justify-center gap-2"
            >
              {copied ? "Copied · " : ""}Buy Tickets →
            </Link>
            <p className="mt-3 text-[10px] text-zinc-500 tracking-[0.18em] uppercase">
              Code copied to clipboard when you tap
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
