"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const ORBS = [
  { color: "168, 85, 247", size: 900, x: "18%", y: "22%" },
  { color: "236, 72, 153", size: 900, x: "82%", y: "24%" },
  { color: "253, 224, 71", size: 720, x: "50%", y: "78%" },
  { color: "52, 211, 153", size: 640, x: "12%", y: "78%" },
];

export function AtmosphereOrbs() {
  const containerRef = useRef<HTMLDivElement>(null);
  const orbRefs = useRef<(HTMLDivElement | null)[]>([]);

  useGSAP(
    () => {
      if (!containerRef.current) return;
      const orbs = orbRefs.current.filter(Boolean) as HTMLDivElement[];
      if (orbs.length < 4) return;

      const centerX = typeof window !== "undefined" ? window.innerWidth / 2 : 700;
      const centerY = typeof window !== "undefined" ? window.innerHeight / 2 : 450;

      orbs.forEach((orb, i) => {
        const angle = (i / orbs.length) * Math.PI * 2;
        const radiusX = 280 + i * 40;
        const radiusY = 200 + i * 30;
        const direction = i % 2 === 0 ? 1 : -1;

        gsap.to(orb, {
          scrollTrigger: {
            trigger: document.documentElement,
            start: "top top",
            end: "bottom bottom",
            scrub: 1.5,
          },
          motionPath: undefined,
          keyframes: {
            "0%": {
              x: 0,
              y: 0,
              scale: 1,
            },
            "25%": {
              x: direction * radiusX * Math.cos(angle + Math.PI * 0.5),
              y: direction * radiusY * Math.sin(angle + Math.PI * 0.5),
              scale: 1.15,
            },
            "50%": {
              x: direction * radiusX * Math.cos(angle + Math.PI),
              y: direction * radiusY * Math.sin(angle + Math.PI),
              scale: 0.9,
            },
            "75%": {
              x: direction * radiusX * Math.cos(angle + Math.PI * 1.5),
              y: direction * radiusY * Math.sin(angle + Math.PI * 1.5),
              scale: 1.1,
            },
            "100%": {
              x: direction * radiusX * Math.cos(angle + Math.PI * 2),
              y: direction * radiusY * Math.sin(angle + Math.PI * 2),
              scale: 1,
            },
          },
          ease: "none",
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
            background: `radial-gradient(circle, rgba(${orb.color}, 0.25) 0%, transparent 55%)`,
            filter: "blur(80px)",
          }}
        />
      ))}
    </div>
  );
}
