"use client";

import { useEffect, useRef } from "react";
import { useTheme } from "@/components/ThemeProvider";

const LIGHTS = [
  { x: 20, y: 18, size: 340, duration: 4, driftX: 12, driftY: 4, r: 255, g: 160, b: 50 },
  { x: 48, y: 12, size: 300, duration: 4, driftX: 10, driftY: 3, r: 253, g: 190, b: 55 },
  { x: 78, y: 15, size: 320, duration: 4, driftX: 11, driftY: 5, r: 255, g: 145, b: 45 },
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

        const warmShift = Math.sin((t + phase * 1.3) * Math.PI * 2) * 10;
        const r = Math.min(255, cfg.r + warmShift * 0.2);
        const g = Math.max(120, cfg.g + warmShift * 0.7);
        const b = Math.max(25, cfg.b + warmShift * 0.3);

        const pulse = 0.22 + Math.sin((t + phase) * Math.PI * 2 * 1.2) * 0.08;

        orb.style.transform = `translate(${dx}px, ${dy}px)`;
        orb.style.background = `radial-gradient(circle, rgba(${Math.round(r)},${Math.round(g)},${Math.round(b)},${pulse}) 0%, rgba(${Math.round(r)},${Math.round(g)},${Math.round(b)},0.06) 50%, transparent 75%)`;
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
            filter: "blur(55px)",
            willChange: "transform, background",
          }}
        />
      ))}
    </div>
  );
}
