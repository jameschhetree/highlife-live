"use client";

import { useEffect, useRef } from "react";
import { useTheme } from "@/components/ThemeProvider";

const LIGHTS = [
  { x: 15, size: 420, duration: 14, driftX: 30, driftY: 12 },
  { x: 50, size: 380, duration: 18, driftX: 25, driftY: 10 },
  { x: 85, size: 400, duration: 16, driftX: 28, driftY: 14 },
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
    let raf: number;
    const startTime = performance.now();

    function animate(now: number) {
      const elapsed = (now - startTime) / 1000;

      orbs.forEach((orb, i) => {
        const cfg = LIGHTS[i];
        const t = elapsed / cfg.duration;

        const colorIdx = Math.floor((elapsed / 6) + i * 1.7) % COLOR_CYCLE.length;
        const nextIdx = (colorIdx + 1) % COLOR_CYCLE.length;
        const colorT = ((elapsed / 6) + i * 1.7) % 1;

        const r = Math.round(COLOR_CYCLE[colorIdx][0] + (COLOR_CYCLE[nextIdx][0] - COLOR_CYCLE[colorIdx][0]) * colorT);
        const g = Math.round(COLOR_CYCLE[colorIdx][1] + (COLOR_CYCLE[nextIdx][1] - COLOR_CYCLE[colorIdx][1]) * colorT);
        const b = Math.round(COLOR_CYCLE[colorIdx][2] + (COLOR_CYCLE[nextIdx][2] - COLOR_CYCLE[colorIdx][2]) * colorT);

        const dx = Math.sin(t * Math.PI * 2) * cfg.driftX;
        const dy = Math.cos(t * Math.PI * 2 * 0.7) * cfg.driftY;
        const pulse = 0.55 + Math.sin(t * Math.PI * 2 * 1.3) * 0.2;

        orb.style.transform = `translate(${dx}px, ${dy}px)`;
        orb.style.background = `radial-gradient(circle, rgba(${r},${g},${b},${pulse}) 0%, rgba(${r},${g},${b},0.2) 45%, transparent 72%)`;
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
      className="absolute top-0 left-0 right-0 h-[50vh] pointer-events-none"
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
            top: "12%",
            marginLeft: -light.size / 2,
            marginTop: -light.size / 2,
            filter: "blur(30px)",
            willChange: "transform, background",
          }}
        />
      ))}
    </div>
  );
}
