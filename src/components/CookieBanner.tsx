"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const STORAGE_KEY = "hll_cookie_consent_v1";

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const dismissed = localStorage.getItem(STORAGE_KEY);
      if (!dismissed) setVisible(true);
    } catch {
      // localStorage unavailable (private browsing edge case) — don't show banner
    }
  }, []);

  const dismiss = () => {
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // ignore
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="region"
      aria-label="Cookie notice"
      className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-4 sm:px-6 sm:pb-6 pointer-events-none"
    >
      <div className="max-w-2xl mx-auto glass-card rounded-2xl px-5 py-4 flex flex-col sm:flex-row items-start sm:items-center gap-4 pointer-events-auto border border-white/10">
        <p className="flex-1 text-[13px] text-silver leading-relaxed">
          This site uses essential cookies to operate. No advertising or tracking
          cookies are used.{" "}
          <Link
            href="/cookies"
            className="text-pink-300 hover:text-pink-200 underline underline-offset-4 transition-colors whitespace-nowrap"
          >
            See our Cookie Policy
          </Link>
          .
        </p>
        <button
          onClick={dismiss}
          className="shrink-0 px-5 py-2 bg-foreground text-background text-xs font-semibold tracking-[0.14em] uppercase rounded-full hover:bg-foreground/90 transition-colors"
        >
          Got it
        </button>
      </div>
    </div>
  );
}
