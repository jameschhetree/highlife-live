"use client";

// Scroll-tied parallax — image drifts up at 65% of scroll speed within its
// section, with a slight scale (1.05 → 1.0) tied to the same scrub. Subtle:
// the image doesn't overshoot the container and never blocks clicks. ScrollTrigger
// scrub=0.6 gives a soft lag so motion feels physical, not linear.

import { useRef, type CSSProperties } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export function GsapParallaxImage({
  src,
  alt,
  className,
  containerClassName,
  overlayClassName,
}: {
  src: string;
  alt: string;
  className?: string;
  containerClassName?: string;
  overlayClassName?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!containerRef.current || !imageRef.current) return;
      gsap.fromTo(
        imageRef.current,
        { yPercent: -6, scale: 1.05 },
        {
          yPercent: 6,
          scale: 1,
          ease: "none",
          scrollTrigger: {
            trigger: containerRef.current,
            start: "top bottom",
            end: "bottom top",
            scrub: 0.6,
          },
        },
      );
    },
    { scope: containerRef },
  );

  const bgStyle: CSSProperties = {
    backgroundImage: `url(${src})`,
  };

  return (
    <div ref={containerRef} className={containerClassName ?? "relative aspect-[4/5] overflow-hidden rounded-2xl border border-border/30 bg-card"}>
      <div
        ref={imageRef}
        className={`absolute inset-0 bg-cover bg-center ${className ?? ""}`}
        style={bgStyle}
        role="img"
        aria-label={alt}
      />
      {overlayClassName ? <div className={`absolute inset-0 pointer-events-none ${overlayClassName}`} /> : null}
    </div>
  );
}
