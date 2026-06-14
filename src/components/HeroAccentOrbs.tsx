"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const PAIRS = [
  // Left pair
  { color: "168,85,247",  opacity: 0.22, size: 320, top: "-4%",  left: "-3%",  right: undefined },
  { color: "253,224,71",  opacity: 0.14, size: 240, top: "2%",   left: "1%",   right: undefined },
  // Right pair
  { color: "236,72,153",  opacity: 0.20, size: 280, top: "-6%",  left: undefined, right: "-7%" },
  { color: "52,211,153",  opacity: 0.13, size: 220, top: "-1%",  left: undefined, right: "-3%" },
];

export function HeroAccentOrbs() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const orbRefs = useRef<(HTMLDivElement | null)[]>([]);

  useGSAP(
    () => {
      if (!wrapRef.current) return;
      const orbs = orbRefs.current.filter(Boolean) as HTMLDivElement[];
      if (orbs.length < 4) return;

      const section = wrapRef.current.closest("section");
      if (!section) return;

      // Left pair orbits each other
      const drift = [
        { xStart: 0, yStart: 0, xEnd: -40,  yEnd: 60,  scaleEnd: 1.2, rotEnd: 15  },
        { xStart: 0, yStart: 0, xEnd: 35,   yEnd: -45, scaleEnd: 0.85, rotEnd: -10 },
        // Right pair orbits each other
        { xStart: 0, yStart: 0, xEnd: 45,   yEnd: 55,  scaleEnd: 1.15, rotEnd: -12 },
        { xStart: 0, yStart: 0, xEnd: -30,  yEnd: -40, scaleEnd: 0.9,  rotEnd: 8   },
      ];

      orbs.forEach((orb, i) => {
        const d = drift[i];
        gsap.fromTo(
          orb,
          { x: d.xStart, y: d.yStart, scale: 1 },
          {
            x: d.xEnd,
            y: d.yEnd,
            scale: d.scaleEnd,
            ease: "none",
            scrollTrigger: {
              trigger: section,
              start: "top top",
              end: "bottom top",
              scrub: 1.5,
            },
          },
        );
      });
    },
    { scope: wrapRef },
  );

  return (
    <div ref={wrapRef} className="absolute inset-0 pointer-events-none" aria-hidden>
      {PAIRS.map((orb, i) => (
        <div
          key={i}
          ref={(el) => { orbRefs.current[i] = el; }}
          className="absolute rounded-full will-change-transform"
          style={{
            width: orb.size,
            height: orb.size,
            top: orb.top,
            left: orb.left,
            right: orb.right,
            background: `radial-gradient(circle, rgba(${orb.color},${orb.opacity}) 0%, transparent 60%)`,
            filter: "blur(60px)",
          }}
        />
      ))}
    </div>
  );
}
