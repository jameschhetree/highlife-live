"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const ORBS = [
  { color: "168, 85, 247", opacity: 0.28, size: 900, x: "18%", y: "22%" },
  { color: "236, 72, 153", opacity: 0.22, size: 900, x: "82%", y: "24%" },
  { color: "253, 224, 71", opacity: 0.14, size: 720, x: "50%", y: "78%" },
  { color: "52, 211, 153", opacity: 0.12, size: 640, x: "12%", y: "78%" },
];

export function AtmosphereOrbs() {
  const containerRef = useRef<HTMLDivElement>(null);
  const orbRefs = useRef<(HTMLDivElement | null)[]>([]);

  useGSAP(
    () => {
      if (!containerRef.current) return;
      const orbs = orbRefs.current.filter(Boolean) as HTMLDivElement[];
      if (orbs.length < 4) return;

      orbs.forEach((orb, i) => {
        const angle = (i / orbs.length) * Math.PI * 2;
        const radius = 220 + i * 50;
        const dir = i % 2 === 0 ? 1 : -1;

        const steps = 8;
        const kf: Record<string, { xPercent: number; yPercent: number; scale: number }> = {};
        for (let s = 0; s <= steps; s++) {
          const pct = `${Math.round((s / steps) * 100)}%`;
          const theta = angle + dir * (s / steps) * Math.PI * 2;
          kf[pct] = {
            xPercent: Math.cos(theta) * radius * 0.1,
            yPercent: Math.sin(theta) * radius * 0.1,
            scale: 1 + 0.15 * Math.sin(theta * 2),
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
    { scope: containerRef },
  );

  return (
    <div
      ref={containerRef}
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      aria-hidden="true"
    >
      {ORBS.map((orb, i) => (
        <div
          key={i}
          ref={(el) => { orbRefs.current[i] = el; }}
          className="absolute rounded-full will-change-transform"
          style={{
            width: orb.size,
            height: orb.size,
            left: orb.x,
            top: orb.y,
            transform: "translate(-50%, -50%)",
            background: `radial-gradient(circle, rgba(${orb.color}, ${orb.opacity}) 0%, transparent 55%)`,
            filter: "blur(80px)",
          }}
        />
      ))}
    </div>
  );
}
