"use client";

import { useEffect, useRef } from "react";
import { useTheme } from "@/components/ThemeProvider";

const LIGHTS = [
  { x: 18, color: [168, 85, 247], size: 220, duration: 12, driftX: 8, driftY: 3 },
  { x: 50, color: [236, 72, 153], size: 180, duration: 15, driftX: 10, driftY: 4 },
  { x: 80, color: [56, 189, 248], size: 200, duration: 13, driftX: 7, driftY: 3.5 },
];

const COLOR_CYCLE = [
  [168, 85, 247],
  [236, 72, 153],
  [56, 189, 248],
  [253, 224, 71],
  [52, 211, 153],
];

export function HeroLights() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { animationsEnabled } = useTheme();

  useEffect(() => {
    if (!animationsEnabled) return;
    const container = containerRef.current;
    if (!container) return;

    const orbs = container.querySelectorAll<HTMLDivElement>("[data-hero-light]");
    const frames: number[] = [];
    const startTime = performance.now();

    function animate(now: number) {
      const elapsed = (now - startTime) / 1000;

      orbs.forEach((orb, i) => {
        const cfg = LIGHTS[i];
        const t = elapsed / cfg.duration;
        const colorIdx = Math.floor((elapsed / 8) + i) % COLOR_CYCLE.length;
        const nextIdx = (colorIdx + 1) % COLOR_CYCLE.length;
        const colorT = ((elapsed / 8) + i) % 1;

        const r = Math.round(COLOR_CYCLE[colorIdx][0] + (COLOR_CYCLE[nextIdx][0] - COLOR_CYCLE[colorIdx][0]) * colorT);
        const g = Math.round(COLOR_CYCLE[colorIdx][1] + (COLOR_CYCLE[nextIdx][1] - COLOR_CYCLE[colorIdx][1]) * colorT);
        const b = Math.round(COLOR_CYCLE[colorIdx][2] + (COLOR_CYCLE[nextIdx][2] - COLOR_CYCLE[colorIdx][2]) * colorT);

        const dx = Math.sin(t * Math.PI * 2) * cfg.driftX;
        const dy = Math.cos(t * Math.PI * 2 * 0.7) * cfg.driftY;
        const pulse = 0.35 + Math.sin(t * Math.PI * 2 * 1.3) * 0.15;

        orb.style.transform = `translate(${dx}px, ${dy}px)`;
        orb.style.background = `radial-gradient(circle, rgba(${r},${g},${b},${pulse}) 0%, rgba(${r},${g},${b},0.08) 40%, transparent 70%)`;
      });

      frames.push(requestAnimationFrame(animate));
    }

    frames.push(requestAnimationFrame(animate));
    return () => frames.forEach(cancelAnimationFrame);
  }, [animationsEnabled]);

  if (!animationsEnabled) return null;

  return (
    <div
      ref={containerRef}
      aria-hidden
      className="absolute top-0 left-0 right-0 h-[35vh] pointer-events-none overflow-hidden"
      style={{ zIndex: 1 }}
    >
      {LIGHTS.map((light, i) => (
        <div
          key={i}
          data-hero-light
          className="absolute rounded-full"
          style={{
            width: light.size,
            height: light.size,
            left: `${light.x}%`,
            top: "8%",
            transform: "translate(-50%, -50%)",
            filter: "blur(40px)",
            willChange: "transform, background",
          }}
        />
      ))}
    </div>
  );
}
