"use client";

// GSAP char-by-char hero entry. Each char ascends + fades in with the Apple
// cubic-bezier ease used elsewhere on the site. Subtle: total stagger lasts
// ~700ms, no bouncing, no overshoot. Replaces framer-motion's coarse h1 fade
// where it lives.

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

type LineSegment = { text: string; gradient?: boolean };
type LineInput = string | LineSegment[];

type Props = {
  /**
   * Each entry is either a plain string (gradient applied to the whole line)
   * or an array of { text, gradient } segments rendered inline.
   */
  lines: LineInput[];
  /** Pass through h1 className */
  className?: string;
};

export function GsapHeroText({ lines, className }: Props) {
  const wrapperRef = useRef<HTMLHeadingElement>(null);

  useGSAP(
    () => {
      if (!wrapperRef.current) return;
      const chars = wrapperRef.current.querySelectorAll<HTMLElement>("[data-gh-char]");
      gsap.fromTo(
        chars,
        { yPercent: 110, opacity: 0 },
        {
          yPercent: 0,
          opacity: 1,
          duration: 0.9,
          ease: "expo.out",
          stagger: {
            each: 0.03,
            from: "start",
          },
          delay: 0.15,
        },
      );
    },
    { scope: wrapperRef },
  );

  const ariaLabel = lines
    .map((l) => (typeof l === "string" ? l : l.map((s) => s.text).join("")))
    .join(" ");

  return (
    <h1 ref={wrapperRef} className={className} aria-label={ariaLabel}>
      {lines.map((line, li) => {
        const segments: LineSegment[] =
          typeof line === "string" ? [{ text: line, gradient: true }] : line;
        return (
          <span key={li} className="block overflow-hidden">
            {segments.map((seg, si) => (
              <span key={si} className={seg.gradient ? "text-gradient-hero" : undefined}>
                {Array.from(seg.text).map((ch, ci) => (
                  <span
                    key={ci}
                    data-gh-char
                    aria-hidden
                    className="inline-block will-change-transform"
                    style={{ whiteSpace: ch === " " ? "pre" : "normal" }}
                  >
                    {ch}
                  </span>
                ))}
              </span>
            ))}
          </span>
        );
      })}
    </h1>
  );
}
