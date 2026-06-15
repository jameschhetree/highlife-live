"use client";

import { useEffect, useRef } from "react";
import { useTheme } from "@/components/ThemeProvider";

const COLORS: [number, number, number][] = [
  [59, 130, 246],   // blue
  [253, 200, 60],   // yellow
  [236, 72, 153],   // pink
];

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function easeInOut(t: number) {
  return t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
}

function lerpColor(t: number, phase: number): [number, number, number] {
  const cycleTime = 6;
  const p = ((t / cycleTime) + phase / 3) % 1;
  const idx = p * 3;
  const i = Math.floor(idx) % 3;
  const frac = idx - Math.floor(idx);
  const next = (i + 1) % 3;
  return [
    lerp(COLORS[i][0], COLORS[next][0], frac),
    lerp(COLORS[i][1], COLORS[next][1], frac),
    lerp(COLORS[i][2], COLORS[next][2], frac),
  ];
}

function getLeftAngle(t: number): number {
  const p = (1 - Math.cos(2 * Math.PI * t / 4)) / 2;
  return lerp(-45, 10, p);
}

function getRightAngle(t: number): number {
  const p = (1 - Math.cos(2 * Math.PI * t / 4)) / 2;
  return lerp(45, -10, p);
}

function getMiddleAngle(t: number): number {
  const phase = t % 6;
  if (phase < 1.5) {
    return lerp(0, -30, easeInOut(phase / 1.5));
  } else if (phase < 4.5) {
    return lerp(-30, 30, easeInOut((phase - 1.5) / 3));
  } else {
    return lerp(30, 0, easeInOut((phase - 4.5) / 1.5));
  }
}

const SPOTS = [
  { x: 22, colorPhase: 2, getAngle: getLeftAngle },
  { x: 50, colorPhase: 1, getAngle: getMiddleAngle },
  { x: 78, colorPhase: 0, getAngle: getRightAngle },
];

export function HeroLights() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { animationsEnabled } = useTheme();

  useEffect(() => {
    if (!animationsEnabled) return;
    const container = containerRef.current;
    if (!container) return;

    const beams = container.querySelectorAll<HTMLDivElement>("[data-spotlight]");
    let raf: number;
    const startTime = performance.now();

    function animate(now: number) {
      const elapsed = (now - startTime) / 1000;

      beams.forEach((beam, i) => {
        const cfg = SPOTS[i];
        const angle = cfg.getAngle(elapsed);
        const [r, g, b] = lerpColor(elapsed, cfg.colorPhase);

        beam.style.transform = `rotate(${angle}deg)`;
        beam.style.background = `linear-gradient(180deg, rgba(${Math.round(r)},${Math.round(g)},${Math.round(b)},0.18) 0%, rgba(${Math.round(r)},${Math.round(g)},${Math.round(b)},0.06) 45%, transparent 80%)`;
      });

      raf = requestAnimationFrame(animate);
    }

    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [animationsEnabled]);

  if (!animationsEnabled) return null;

  return (
    <div
      ref={containerRef}
      aria-hidden
      className="absolute top-0 left-0 right-0 h-[65vh] pointer-events-none overflow-hidden"
      style={{ zIndex: 1 }}
    >
      {SPOTS.map((spot, i) => (
        <div
          key={i}
          data-spotlight
          className="absolute"
          style={{
            top: "-2%",
            left: `${spot.x}%`,
            width: "420px",
            height: "58vh",
            marginLeft: "-210px",
            transformOrigin: "50% 0%",
            clipPath: "polygon(50% 0%, 12% 100%, 88% 100%)",
            filter: "blur(30px)",
            willChange: "transform, background",
          }}
        />
      ))}
    </div>
  );
}
