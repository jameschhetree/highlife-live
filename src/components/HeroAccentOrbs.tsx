"use client";

import { useRef, useEffect, useState } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const PAIRS = [
  { color: "168,85,247", opacity: 0.22, size: 320, top: "-4%",  left: "-3%",  right: undefined },
  { color: "253,224,71", opacity: 0.14, size: 240, top: "2%",   left: "1%",   right: undefined },
  { color: "236,72,153", opacity: 0.20, size: 280, top: "-6%",  left: undefined, right: "-7%" },
  { color: "52,211,153", opacity: 0.13, size: 220, top: "-1%",  left: undefined, right: "-3%" },
];

export function HeroAccentOrbs() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const orbRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [heroSection, setHeroSection] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (wrapRef.current) {
      setHeroSection(wrapRef.current.closest("section"));
    }
  }, []);

  useGSAP(
    () => {
      if (!heroSection) return;
      const orbs = orbRefs.current.filter(Boolean) as HTMLDivElement[];
      if (orbs.length < 4) return;

      const drift = [
        { xEnd: -80,  yEnd: 120, scaleEnd: 1.25 },
        { xEnd: 70,   yEnd: -90, scaleEnd: 0.8  },
        { xEnd: 90,   yEnd: 110, scaleEnd: 1.2  },
        { xEnd: -60,  yEnd: -80, scaleEnd: 0.85 },
      ];

      orbs.forEach((orb, i) => {
        const d = drift[i];
        gsap.fromTo(
          orb,
          { x: 0, y: 0, scale: 1 },
          {
            x: d.xEnd,
            y: d.yEnd,
            scale: d.scaleEnd,
            ease: "none",
            scrollTrigger: {
              trigger: heroSection,
              start: "top top",
              end: "bottom top",
              scrub: 1.5,
            },
          },
        );
      });
    },
    { dependencies: [heroSection] },
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
