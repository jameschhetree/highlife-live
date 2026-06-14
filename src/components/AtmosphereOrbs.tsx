"use client";

import { useRef } from "react";
import { usePathname } from "next/navigation";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const ORBS: Orb[] = [
  { r: 168, g: 85,  b: 247, opacity: 0.32, size: 900, x: "12%", xInner: "17%", y: "16%" },
  { r: 236, g: 72,  b: 153, opacity: 0.26, size: 900, x: "88%", xInner: "83%", y: "18%" },
  { r: 253, g: 224, b: 71,  opacity: 0.18, size: 720, x: "50%", xInner: "50%", y: "72%" },
  { r: 52,  g: 211, b: 153, opacity: 0.16, size: 640, x: "6%",  xInner: "11%", y: "72%" },
  // Hero accent pair — homepage only
  { r: 168, g: 85,  b: 247, opacity: 0.22, size: 320, x: "22%", xInner: "22%", y: "38%",  homeOnly: true },
  { r: 56,  g: 120, b: 255, opacity: 0.20, size: 280, x: "78%", xInner: "78%", y: "36%",  homeOnly: true },
  // Inner-page accent lights — top sides + center
  { r: 168, g: 85,  b: 247, opacity: 0.16, size: 340, x: "8%",  xInner: "8%",  y: "6%",   nonHomeOnly: true },
  { r: 56,  g: 120, b: 255, opacity: 0.14, size: 300, x: "92%", xInner: "92%", y: "8%",   nonHomeOnly: true },
  { r: 236, g: 72,  b: 153, opacity: 0.12, size: 260, x: "48%", xInner: "48%", y: "12%",  nonHomeOnly: true },
];

type Orb = {
  r: number; g: number; b: number;
  opacity: number; size: number;
  x: string; xInner: string; y: string;
  homeOnly?: boolean; nonHomeOnly?: boolean;
};

export function AtmosphereOrbs() {
  const containerRef = useRef<HTMLDivElement>(null);
  const orbRefs = useRef<(HTMLDivElement | null)[]>([]);
  const pathname = usePathname();
  const isHome = pathname === "/";

  const activeOrbs = ORBS.filter((o) =>
    isHome ? !o.nonHomeOnly : !o.homeOnly,
  );

  useGSAP(
    () => {
      if (!containerRef.current) return;
      const orbs = orbRefs.current.filter(Boolean) as HTMLDivElement[];
      if (orbs.length === 0) return;

      const allColors = activeOrbs;

      orbs.forEach((orb, i) => {
        const angle = (i / orbs.length) * Math.PI * 2;
        const radius = 220 + (i % 4) * 50;
        const dir = i % 2 === 0 ? 1 : -1;

        const self = allColors[i];
        const next = allColors[(i + 1) % allColors.length];
        const next2 = allColors[(i + 2) % allColors.length];
        const next3 = allColors[(i + 3) % allColors.length];

        const steps = 8;
        const kf: Record<string, Record<string, number>> = {};
        for (let s = 0; s <= steps; s++) {
          const pct = `${Math.round((s / steps) * 100)}%`;
          const theta = angle + dir * (s / steps) * Math.PI * 2;
          const progress = s / steps;

          let tr: number, tg: number, tb: number;
          if (progress < 0.25) {
            const t = progress / 0.25;
            tr = self.r + (next.r - self.r) * t;
            tg = self.g + (next.g - self.g) * t;
            tb = self.b + (next.b - self.b) * t;
          } else if (progress < 0.5) {
            const t = (progress - 0.25) / 0.25;
            tr = next.r + (next2.r - next.r) * t;
            tg = next.g + (next2.g - next.g) * t;
            tb = next.b + (next2.b - next.b) * t;
          } else if (progress < 0.75) {
            const t = (progress - 0.5) / 0.25;
            tr = next2.r + (next3.r - next2.r) * t;
            tg = next2.g + (next3.g - next2.g) * t;
            tb = next2.b + (next3.b - next2.b) * t;
          } else {
            const t = (progress - 0.75) / 0.25;
            tr = next3.r + (self.r - next3.r) * t;
            tg = next3.g + (self.g - next3.g) * t;
            tb = next3.b + (self.b - next3.b) * t;
          }

          kf[pct] = {
            xPercent: Math.cos(theta) * radius * 0.1,
            yPercent: Math.sin(theta) * radius * 0.1,
            scale: 1 + 0.15 * Math.sin(theta * 2),
            "--orb-r": Math.round(tr),
            "--orb-g": Math.round(tg),
            "--orb-b": Math.round(tb),
          };
        }

        gsap.to(orb, {
          keyframes: kf,
          ease: "none",
          scrollTrigger: {
            trigger: document.body,
            start: "top top",
            end: "bottom bottom",
            scrub: 2,
          },
        });
      });
    },
    { scope: containerRef, dependencies: [isHome] },
  );

  return (
    <div
      ref={containerRef}
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      aria-hidden="true"
    >
      {activeOrbs.map((orb, i) => (
        <div
          key={`${orb.x}-${orb.y}-${i}`}
          ref={(el) => { orbRefs.current[i] = el; }}
          className="absolute rounded-full will-change-transform"
          style={{
            width: orb.size,
            height: orb.size,
            left: isHome ? orb.x : orb.xInner,
            top: isHome ? orb.y : `calc(${orb.y} - 20%)`,
            transform: "translate(-50%, -50%)",
            ["--orb-r" as string]: orb.r,
            ["--orb-g" as string]: orb.g,
            ["--orb-b" as string]: orb.b,
            background: `radial-gradient(circle, rgba(var(--orb-r), var(--orb-g), var(--orb-b), ${orb.opacity}) 0%, transparent 55%)`,
            filter: `blur(${orb.homeOnly ? 60 : 80}px)`,
          }}
        />
      ))}
    </div>
  );
}
