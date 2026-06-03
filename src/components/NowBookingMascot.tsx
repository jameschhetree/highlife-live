"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Copy } from "lucide-react";

// Official coupon code from James (HL Live, 2026-06-02).
const COUPON_CODE = "HLLbeta1.1-4jeremy";

type Mode = "pacing" | "flying" | "revealing" | "jumping" | "returning" | "boxed" | "coupon";

type Point = { x: number; y: number };

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
const lerp = (from: number, to: number, t: number) => from + (to - from) * t;
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeOutBack = (t: number) => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};

const catmullRom = (p0: Point, p1: Point, p2: Point, p3: Point, t: number): Point => {
  const t2 = t * t;
  const t3 = t2 * t;
  return {
    x: 0.5 * (
      2 * p1.x +
      (-p0.x + p2.x) * t +
      (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 +
      (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3
    ),
    y: 0.5 * (
      2 * p1.y +
      (-p0.y + p2.y) * t +
      (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 +
      (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3
    ),
  };
};

// Tuning calibrated to Dok's spec (HL Live, 2026-06-02 round 2):
//  - slower base loop so humans can actually keep up
//  - 7s required chase (down from 8)
//  - tolerant decay: brief misses drain chase slowly, never hard-reset to 0
const BASE_LOOP_SECONDS = 7.8;
const REVEAL_LOOP_SECONDS = 8.0;
const MOUSE_FRESH_MS = 650;
const CHASE_REQUIRED_MS = 7000;
const CHASE_DRAIN_RATE = 0.3;     // fraction of dt drained from chaseAccumMs each ms out of range
const GIVE_UP_MS = 36000;

export function NowBookingMascot() {
  const [mode, setMode] = useState<Mode>("pacing");

  // Positions live in refs to avoid useEffect re-runs on every frame.
  // We mirror them into state only when needed for render.
  const posRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const boxRef = useRef<{ x: number; y: number }>({ x: -90, y: 280 });
  const boxFrontRef = useRef(false);
  const homeRef = useRef<Point>({ x: 0, y: 0 });
  const pathProgressRef = useRef(0);
  const speedMultiplierRef = useRef(1);
  const flightStartedAtRef = useRef(0);
  const outOfRangeMsRef = useRef(0);
  const reachedCloseRadiusRef = useRef(false);
  const boxPassTargetRef = useRef(0);
  const boxRevealRef = useRef(0);
  const jumpRef = useRef<{ start: Point; t: number } | null>(null);
  const returnRef = useRef<{ start: Point; t: number } | null>(null);
  const micTransformRef = useRef("translate(-50%, -50%)");
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

  const heroCardRect = useCallback(() => {
    const card = containerRef.current?.closest(".glass-card");
    return card?.getBoundingClientRect();
  }, []);

  const boxTarget = useCallback((): Point => {
    if (typeof window === "undefined") return { x: 110, y: 300 };
    const card = heroCardRect();
    if (card) {
      return {
        x: clamp(card.left + 54, 86, window.innerWidth * 0.34),
        y: clamp(card.top + card.height * 0.31, 210, window.innerHeight - 170),
      };
    }
    return {
      x: Math.max(86, window.innerWidth * 0.08),
      y: Math.min(340, window.innerHeight * 0.36),
    };
  }, [heroCardRect]);

  const boxRevealPosition = useCallback((progress: number): Point => {
    const target = boxTarget();
    const card = heroCardRect();
    const t = clamp(progress, 0, 1);
    if (!card) {
      return {
        x: lerp(-90, target.x, easeInOut(t)),
        y: target.y,
      };
    }

    const behindX = card.left + 16;
    const revealX = Math.max(76, card.left - 62);
    const settleX = target.x;

    if (t < 0.58) {
      const u = easeOutBack(t / 0.58);
      return { x: lerp(behindX, revealX, u), y: target.y };
    }

    const u = easeInOut((t - 0.58) / 0.42);
    return { x: lerp(revealX, settleX, u), y: target.y };
  }, [boxTarget, heroCardRect]);

  const flightPath = useCallback((): Point[] => {
    const vw = typeof window === "undefined" ? 1200 : window.innerWidth;
    const vh = typeof window === "undefined" ? 820 : window.innerHeight;
    const box = boxTarget();
    const margin = 64;
    const home = homeRef.current;
    return [
      home,
      { x: clamp(vw * 0.61, margin, vw - margin), y: clamp(vh * 0.18, margin, vh - margin) },
      { x: clamp(vw * 0.82, margin, vw - margin), y: clamp(vh * 0.42, margin, vh - margin) },
      { x: clamp(vw * 0.66, margin, vw - margin), y: clamp(vh * 0.73, margin, vh - margin) },
      { x: clamp(vw * 0.30, margin, vw - margin), y: clamp(vh * 0.66, margin, vh - margin) },
      { x: box.x + 18, y: box.y - 18 },
      { x: clamp(vw * 0.18, margin, vw - margin), y: clamp(vh * 0.26, margin, vh - margin) },
      { x: clamp(vw * 0.49, margin, vw - margin), y: clamp(vh * 0.13, margin, vh - margin) },
    ];
  }, [boxTarget]);

  const pointOnPath = useCallback((progress: number) => {
    const points = flightPath();
    const total = points.length;
    const wrapped = ((progress % total) + total) % total;
    const i = Math.floor(wrapped);
    const t = wrapped - i;
    return catmullRom(
      points[(i - 1 + total) % total],
      points[i],
      points[(i + 1) % total],
      points[(i + 2) % total],
      t
    );
  }, [flightPath]);

  const chaseSpeed = useCallback((distance: number) => {
    if (typeof window === "undefined") return { multiplier: 1, tier: -1, outerRadius: 112 };
    const outerRadius = clamp(Math.min(window.innerWidth, window.innerHeight) * 0.125, 92, 132);
    if (distance > outerRadius) return { multiplier: 1, tier: -1, outerRadius };

    const innerRadius = outerRadius * 0.28;
    const step = (outerRadius - innerRadius) / 7;
    const tier = clamp(Math.floor((outerRadius - distance) / step), 0, 7);
    // Softer scaling: max 2.1× instead of 3.55× — the lap stays catchable
    // even when cursor is right on top of the mic, per Dok's "slow it down"
    // and "still doesn't move at a constant speed" notes.
    const multipliers = [1.08, 1.18, 1.30, 1.45, 1.62, 1.80, 1.96, 2.10];
    return { multiplier: multipliers[tier], tier, outerRadius };
  }, []);

  const nextBoxPassProgress = useCallback((progress: number) => {
    const boxPointIndex = 5;
    const total = flightPath().length;
    const cycle = Math.floor(progress / total);
    const currentInCycle = progress - cycle * total;
    return (currentInCycle < boxPointIndex ? cycle : cycle + 1) * total + boxPointIndex;
  }, [flightPath]);

  const enterFlying = useCallback(() => {
    // Capture the paced mic's ACTUAL rendered position (it's mid-bunny-hop with a
    // shifting margin-left), not the wrapper center — so the floating mic spawns
    // exactly where the paced mic was at the click moment. No entry snap.
    const pacedMic = containerRef.current?.querySelector<HTMLElement>(".mascot-mic");
    const rect = pacedMic?.getBoundingClientRect() ?? containerRef.current?.getBoundingClientRect();
    if (rect) {
      const spawn = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
      homeRef.current = spawn;
      posRef.current = spawn;
    }
    chaseAccumMs.current = 0;
    outOfRangeMsRef.current = 0;
    reachedCloseRadiusRef.current = false;
    pathProgressRef.current = 0;
    speedMultiplierRef.current = 1;
    flightStartedAtRef.current = performance.now();
    boxRevealRef.current = 0;
    boxFrontRef.current = false;
    jumpRef.current = null;
    returnRef.current = null;
    micTransformRef.current = "translate(-50%, -50%)";
    setMode("flying");
  }, []);

  // Cursor tracking — the path logic reads lastMouseRef every frame.
  // Desktop only per scope; touch handlers intentionally not added.
  useEffect(() => {
    if (mode === "pacing" || mode === "coupon") return;
    const onMove = (e: MouseEvent) => {
      lastMouseRef.current = { x: e.clientX, y: e.clientY, t: performance.now() };
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, [mode]);

  // Single animation loop for the desktop Easter egg. The mic follows a
  // repeatable path; the cursor changes speed and qualifies the chase, but it
  // does not steer the mic directly.
  useEffect(() => {
    if (mode !== "flying" && mode !== "revealing" && mode !== "jumping" && mode !== "returning") return;

    let rafId = 0;
    let lastT = performance.now();

    if (mode === "revealing") {
      boxRevealRef.current = 0;
      boxFrontRef.current = false;
      boxPassTargetRef.current = nextBoxPassProgress(pathProgressRef.current);
      boxRef.current = boxRevealPosition(0);
    }

    if (mode === "returning" && !returnRef.current) {
      returnRef.current = { start: { ...posRef.current }, t: 0 };
    }

    const tick = (now: number) => {
      const dt = Math.min(now - lastT, 60);
      lastT = now;

      if (mode === "flying") {
        const { x: mx, y: my, t: mouseT } = lastMouseRef.current;
        const current = pointOnPath(pathProgressRef.current);
        const dist = Math.hypot(current.x - mx, current.y - my);
        const { multiplier, tier, outerRadius } = chaseSpeed(dist);
        const mouseFresh = now - mouseT < MOUSE_FRESH_MS;
        const inRange = mouseFresh && dist <= outerRadius;
        const targetMultiplier = inRange ? multiplier : 1;
        speedMultiplierRef.current = lerp(
          speedMultiplierRef.current,
          targetMultiplier,
          clamp(dt / 180, 0, 1)
        );
        const loopSegmentsPerSecond = flightPath().length / BASE_LOOP_SECONDS;

        pathProgressRef.current += loopSegmentsPerSecond * speedMultiplierRef.current * (dt / 1000);
        posRef.current = pointOnPath(pathProgressRef.current);
        micTransformRef.current = `translate(-50%, -50%) rotate(${Math.sin(now * 0.006) * 5}deg)`;

        if (inRange) {
          outOfRangeMsRef.current = 0;
          chaseAccumMs.current += dt;
          if (chaseAccumMs.current >= CHASE_REQUIRED_MS) {
            boxPassTargetRef.current = nextBoxPassProgress(pathProgressRef.current);
            setMode("revealing");
            return;
          }
        } else if (chaseAccumMs.current > 0) {
          // Soft drain: brief misses cost a little, sustained misses cost more —
          // but the timer never hard-resets to 0. Keeps the catch forgiving.
          chaseAccumMs.current = Math.max(0, chaseAccumMs.current - dt * CHASE_DRAIN_RATE);
          outOfRangeMsRef.current += dt;
        }
        // tier-based gate retired — Dok's spec is "simple 7-second chase";
        // reaching the inner ring was an extra obstacle his ask removed.
        void tier;

        if (now - flightStartedAtRef.current > GIVE_UP_MS) {
          returnRef.current = { start: { ...posRef.current }, t: 0 };
          setMode("returning");
          return;
        }
      } else if (mode === "revealing") {
        boxRevealRef.current = Math.min(1, boxRevealRef.current + dt / 1200);
        boxFrontRef.current = boxRevealRef.current > 0.58;
        boxRef.current = boxRevealPosition(boxRevealRef.current);

        speedMultiplierRef.current = lerp(speedMultiplierRef.current, 1.08, clamp(dt / 220, 0, 1));
        const loopSegmentsPerSecond = flightPath().length / REVEAL_LOOP_SECONDS;
        pathProgressRef.current += loopSegmentsPerSecond * speedMultiplierRef.current * (dt / 1000);
        posRef.current = pointOnPath(pathProgressRef.current);
        micTransformRef.current = `translate(-50%, -50%) rotate(${Math.sin(now * 0.007) * 4}deg)`;

        if (boxRevealRef.current >= 1 && pathProgressRef.current >= boxPassTargetRef.current) {
          if (pathProgressRef.current - boxPassTargetRef.current > 0.45) {
            boxPassTargetRef.current = nextBoxPassProgress(pathProgressRef.current);
            scheduleRender();
            rafId = requestAnimationFrame(tick);
            return;
          }
          jumpRef.current = { start: { ...posRef.current }, t: 0 };
          setMode("jumping");
          return;
        }
      } else if (mode === "jumping") {
        const jump = jumpRef.current ?? { start: { ...posRef.current }, t: 0 };
        jumpRef.current = jump;
        jump.t = Math.min(1, jump.t + dt / 1450);
        const box = boxTarget();
        boxRef.current = box;
        boxFrontRef.current = true;

        const plant = { x: box.x + 62, y: box.y - 12 };
        const end = { x: box.x, y: box.y - 8 };
        if (jump.t < 0.32) {
          const u = easeInOut(jump.t / 0.32);
          posRef.current = {
            x: lerp(jump.start.x, plant.x, u),
            y: lerp(jump.start.y, plant.y, u),
          };
          micTransformRef.current = "translate(-50%, -50%) rotate(-8deg)";
        } else if (jump.t < 0.47) {
          const squash = Math.sin(((jump.t - 0.32) / 0.15) * Math.PI);
          posRef.current = plant;
          micTransformRef.current = `translate(-50%, -50%) scale(${1 + squash * 0.18}, ${1 - squash * 0.28}) rotate(-8deg)`;
        } else {
          const u = easeOutBack((jump.t - 0.47) / 0.53);
          const oneMinusU = 1 - u;
          const apex = { x: (plant.x + end.x) / 2, y: Math.min(plant.y, end.y) - 86 };
          posRef.current = {
            x: oneMinusU * oneMinusU * plant.x + 2 * oneMinusU * u * apex.x + u * u * end.x,
            y: oneMinusU * oneMinusU * plant.y + 2 * oneMinusU * u * apex.y + u * u * end.y,
          };
          micTransformRef.current = `translate(-50%, -50%) rotate(${lerp(-8, -24, u)}deg)`;
        }

        if (jump.t >= 1) {
          setMode("boxed");
          return;
        }
      } else if (mode === "returning") {
        const returning = returnRef.current ?? { start: { ...posRef.current }, t: 0 };
        returnRef.current = returning;
        returning.t = Math.min(1, returning.t + dt / 950);
        const u = easeInOut(returning.t);
        posRef.current = {
          x: lerp(returning.start.x, homeRef.current.x, u),
          y: lerp(returning.start.y, homeRef.current.y, u),
        };
        micTransformRef.current = `translate(-50%, -50%) rotate(${lerp(12, 0, u)}deg)`;
        if (returning.t >= 1) {
          chaseAccumMs.current = 0;
          outOfRangeMsRef.current = 0;
          reachedCloseRadiusRef.current = false;
          speedMultiplierRef.current = 1;
          micTransformRef.current = "translate(-50%, -50%)";
          setMode("pacing");
          return;
        }
      }

      scheduleRender();
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [mode, boxRevealPosition, boxTarget, chaseSpeed, flightPath, nextBoxPassProgress, pointOnPath]); // refs hold frame state

  const openCoupon = () => setMode("coupon");

  const closeCoupon = () => {
    // Route through "returning" instead of jumping straight to pacing — the
    // returning loop lerps the mic from its current position (inside the box)
    // back to the dock home over ~950ms via easeInOut. NO teleport on close.
    boxRef.current = { x: -90, y: 0 };
    boxFrontRef.current = false;
    boxRevealRef.current = 0;
    jumpRef.current = null;
    // Seed the return path from wherever the mic currently sits
    returnRef.current = { start: { ...posRef.current }, t: 0 };
    setMode("returning");
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

  const showFloatingMic = mode === "flying" || mode === "revealing" || mode === "jumping" || mode === "returning";
  const inFlight = showFloatingMic || mode === "boxed";
  const showBox = mode === "revealing" || mode === "jumping" || mode === "boxed";

  // Box visually transitions from "open flaps" (during jump + first beat of boxed)
  // to "closed flaps + ribbon" (rest of boxed mode). Trigger via timed class.
  const [boxClosed, setBoxClosed] = useState(false);
  useEffect(() => {
    if (mode === "boxed") {
      const t = setTimeout(() => setBoxClosed(true), 90);
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
            transform: micTransformRef.current,
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
            zIndex: boxFrontRef.current ? 55 : 35,
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

            {/* Box body (front face) */}
            <path d="M 24 52 L 76 52 L 78 90 L 22 90 Z" fill="url(#cardboard)" stroke="rgba(0,0,0,0.25)" strokeWidth="0.5" />
            {/* Center seam tape (only visible when open OR closed, sits on front face) */}
            <rect x="48" y="52" width="4" height="38" fill="rgba(0,0,0,0.18)" />

            {!boxClosed ? (
              /* OPEN STATE — two flaps angled outward like an open box top */
              <>
                <path
                  d="M 24 52 L 50 52 L 50 36 L 12 30 Z"
                  fill="url(#cardboard-dark)"
                  stroke="rgba(0,0,0,0.3)"
                  strokeWidth="0.5"
                  className="box-flap box-flap-l-open"
                  style={{ transformOrigin: "50px 52px" }}
                />
                <path
                  d="M 76 52 L 50 52 L 50 36 L 88 30 Z"
                  fill="url(#cardboard-dark)"
                  stroke="rgba(0,0,0,0.3)"
                  strokeWidth="0.5"
                  className="box-flap box-flap-r-open"
                  style={{ transformOrigin: "50px 52px" }}
                />
              </>
            ) : (
              /* CLOSED STATE — flat lid surface (parallelogram seen at a slight angle)
                 sitting on top of the box body, with a thin top-front edge,
                 plus the ribbon wrapping over the whole thing. */
              <>
                {/* Lid top surface — a parallelogram skewed back so it reads as
                    the top of a 3D box, not a wedge pointing up */}
                <path
                  d="M 24 52 L 76 52 L 70 44 L 30 44 Z"
                  fill="url(#cardboard-dark)"
                  stroke="rgba(0,0,0,0.32)"
                  strokeWidth="0.5"
                />
                {/* Center lid seam */}
                <line x1="50" y1="52" x2="50" y2="44" stroke="rgba(0,0,0,0.22)" strokeWidth="0.6" />
                {/* Small highlight on lid front to suggest depth */}
                <line x1="25" y1="52.3" x2="75" y2="52.3" stroke="rgba(255,255,255,0.18)" strokeWidth="0.6" />

                {/* Ribbon wraps over the closed lid */}
                {/* Horizontal strap across body */}
                <rect x="22" y="64" width="56" height="6" fill="url(#ribbon)" />
                {/* Vertical strap (front face) */}
                <rect x="46" y="52" width="8" height="38" fill="url(#ribbon)" />
                {/* Vertical strap continuation across the lid top */}
                <path d="M 47 44 L 53 44 L 52 52 L 48 52 Z" fill="url(#ribbon)" />
                {/* Bow on top — two leaves + center knot — sits above the lid */}
                <ellipse cx="43" cy="40" rx="8" ry="5.5" fill="url(#ribbon)" transform="rotate(-22 43 40)" />
                <ellipse cx="57" cy="40" rx="8" ry="5.5" fill="url(#ribbon)" transform="rotate(22 57 40)" />
                <circle cx="50" cy="42" r="3.2" fill="#be1d6d" />
                {/* Streamers trailing down the front */}
                <path d="M 46 46 L 41 56" stroke="url(#ribbon)" strokeWidth="2.4" strokeLinecap="round" />
                <path d="M 54 46 L 59 56" stroke="url(#ribbon)" strokeWidth="2.4" strokeLinecap="round" />
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
