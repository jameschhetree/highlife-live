"use client";

import { useEffect, useRef } from "react";
import { useTheme } from "@/components/ThemeProvider";

const LIGHTS = [
  { x: 25, y: 6, size: 280, duration: 4, driftX: 18, driftY: 5, r: 255, g: 160, b: 50 },
  { x: 50, y: 8, size: 240, duration: 4, driftX: 14, driftY: 4, r: 253, g: 200, b: 60 },
  { x: 72, y: 5, size: 260, duration: 4, driftX: 16, driftY: 6, r: 255, g: 140, b: 40 },
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
        const phase = i * 0.8;

        const dx = Math.sin((t + phase) * Math.PI * 2) * cfg.driftX;
        const dy = Math.cos((t + phase) * Math.PI * 2 * 0.6) * cfg.driftY;

        const warmShift = Math.sin((t + phase * 1.3) * Math.PI * 2) * 15;
        const r = Math.min(255, cfg.r + warmShift * 0.3);
        const g = Math.max(100, cfg.g + warmShift);
        const b = Math.max(20, cfg.b + warmShift * 0.5);

        const pulse = 0.45 + Math.sin((t + phase) * Math.PI * 2 * 1.2) * 0.1;

        orb.style.transform = `translate(${dx}px, ${dy}px)`;
        orb.style.background = `radial-gradient(circle, rgba(${Math.round(r)},${Math.round(g)},${Math.round(b)},${pulse}) 0%, rgba(${Math.round(r)},${Math.round(g)},${Math.round(b)},0.12) 45%, transparent 70%)`;
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
      className="absolute top-0 left-0 right-0 h-[40vh] pointer-events-none"
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
            top: `${light.y}%`,
            marginLeft: -light.size / 2,
            marginTop: -light.size / 2,
            filter: "blur(35px)",
            willChange: "transform, background",
          }}
        />
      ))}
    </div>
  );
}
