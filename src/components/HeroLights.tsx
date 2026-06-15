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

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
  }
  return [h, s, l];
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  if (s === 0) return [l * 255, l * 255, l * 255];
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  return [
    hue2rgb(p, q, h + 1 / 3) * 255,
    hue2rgb(p, q, h) * 255,
    hue2rgb(p, q, h - 1 / 3) * 255,
  ];
}

function lerpColor(t: number, phase: number): [number, number, number] {
  const cycleTime = 6;
  const p = ((t / cycleTime) + phase / 3) % 1;
  const idx = p * 3;
  const i = Math.floor(idx) % 3;
  const frac = idx - Math.floor(idx);
  const next = (i + 1) % 3;
  const r = lerp(COLORS[i][0], COLORS[next][0], frac);
  const g = lerp(COLORS[i][1], COLORS[next][1], frac);
  const b = lerp(COLORS[i][2], COLORS[next][2], frac);
  const [h, s, l] = rgbToHsl(r, g, b);
  return hslToRgb(h, Math.max(s, 0.75), l);
}

function getLeftAngle(t: number): number {
  const p = (1 - Math.cos(2 * Math.PI * t / 7)) / 2;
  return lerp(-45, 10, p);
}

function getRightAngle(t: number): number {
  const p = (1 - Math.cos(2 * Math.PI * t / 4)) / 2;
  return lerp(45, -10, p);
}

function getMiddleAngle(t: number): number {
  return -30 * Math.sin(2 * Math.PI * t / 6);
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
        beam.style.background = `linear-gradient(180deg, rgba(${Math.round(r)},${Math.round(g)},${Math.round(b)},0.22) 0%, rgba(${Math.round(r)},${Math.round(g)},${Math.round(b)},0.09) 45%, transparent 82%)`;
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
      className="absolute top-0 left-0 right-0 h-[75vh] pointer-events-none overflow-hidden"
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
            width: "440px",
            height: "66vh",
            marginLeft: "-220px",
            transformOrigin: "50% 0%",
            clipPath: "polygon(50% 0%, 10% 100%, 90% 100%)",
            filter: "blur(40px)",
            willChange: "transform, background",
          }}
        />
      ))}
    </div>
  );
}
