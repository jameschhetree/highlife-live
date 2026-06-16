"use client";

import { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[HighLife Live] Uncaught error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-radial-atmosphere flex flex-col items-center justify-center px-5">
      <div className="w-full max-w-md text-center">
        <Link
          href="/"
          className="flex items-center gap-3 mb-10 justify-center"
        >
          <span className="relative w-12 h-12 inline-block">
            <Image
              src="/HighLifeLogo.png"
              alt=""
              fill
              sizes="48px"
              className="object-contain"
            />
          </span>
          <span className="font-display text-xl tracking-[0.2em] uppercase">
            HighLife Live
          </span>
        </Link>

        <div className="glass-card rounded-3xl p-8 sm:p-10">
          <p className="text-[10px] tracking-[0.3em] uppercase text-pink-300 mb-3">
            Something went wrong
          </p>
          <h1 className="font-display uppercase text-3xl sm:text-4xl tracking-tight leading-[0.95] mb-3">
            <span className="text-gradient-hero">Technical difficulty.</span>
          </h1>
          <p className="text-sm text-zinc-400 leading-relaxed mb-8">
            We hit an unexpected error loading this page. Try again or head back
            to the homepage.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button
              onClick={reset}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full btn-gradient text-[10px] tracking-[0.18em] uppercase font-bold"
            >
              Try Again
            </button>
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-white/8 border border-white/15 hover:bg-white/12 hover:border-white/25 text-[10px] tracking-[0.18em] uppercase font-bold text-foreground transition-colors"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
