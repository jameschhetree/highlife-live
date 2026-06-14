"use client";

import { useState } from "react";
import { ScrollReveal } from "@/components/ScrollReveal";
import Link from "next/link";

export default function UnsubscribePage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error" | "not_found">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) return;

    setStatus("loading");
    setErrorMsg("");

    try {
      const res = await fetch("/api/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed }),
      });

      if (res.ok) {
        setStatus("success");
      } else if (res.status === 404) {
        setStatus("not_found");
      } else {
        const data = await res.json().catch(() => ({}));
        setErrorMsg(data.error || "Something went wrong. Please try again.");
        setStatus("error");
      }
    } catch {
      setErrorMsg("Something went wrong. Please try again.");
      setStatus("error");
    }
  };

  return (
    <div className="bg-radial-atmosphere min-h-screen">
      <div className="pt-32 pb-24">
        <div className="max-w-lg mx-auto px-6 lg:px-8">
          <ScrollReveal>
            <div className="text-center mb-10">
              <span className="chip mb-5 inline-flex">Email Preferences</span>
              <h1 className="font-display uppercase text-5xl sm:text-6xl tracking-tight leading-[0.92] mb-5">
                Unsubscribe
              </h1>
              <p className="text-silver leading-relaxed">
                Enter your email address below to unsubscribe from HighLife Live
                marketing emails.
              </p>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={0.05}>
            {status === "success" ? (
              <div className="glass-card rounded-3xl p-8 sm:p-10 text-center">
                <div className="w-12 h-12 mx-auto mb-5 rounded-full bg-emerald-400/10 border border-emerald-400/30 flex items-center justify-center">
                  <span className="text-emerald-400 text-xl">&#10003;</span>
                </div>
                <h2 className="text-foreground font-display text-2xl tracking-tight uppercase mb-3">
                  You&rsquo;re unsubscribed
                </h2>
                <p className="text-silver text-sm leading-relaxed">
                  You have been removed from our mailing list and will no longer
                  receive marketing emails from HighLife Live.
                </p>
                <Link
                  href="/"
                  className="inline-block mt-6 text-xs tracking-[0.18em] uppercase text-silver hover:text-foreground transition-colors"
                >
                  Back to Home
                </Link>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="glass-card rounded-3xl p-8 sm:p-10 space-y-6"
              >
                <div>
                  <label
                    htmlFor="unsub-email"
                    className="block text-[11px] tracking-[0.2em] uppercase text-silver font-medium mb-2"
                  >
                    Email Address
                  </label>
                  <input
                    id="unsub-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    required
                    disabled={status === "loading"}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-zinc-500 focus:outline-none focus:border-pink-400/60 transition-colors disabled:opacity-50"
                  />
                </div>

                {status === "not_found" && (
                  <p className="text-[13px] text-zinc-400 leading-relaxed">
                    That email address was not found in our mailing list. You may
                    already be unsubscribed, or you may not have signed up with this
                    address.
                  </p>
                )}

                {status === "error" && (
                  <p className="text-[13px] text-rose-400 leading-relaxed">
                    {errorMsg}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={status === "loading" || !email.trim()}
                  className="w-full py-3.5 bg-foreground text-background text-xs tracking-[0.18em] uppercase font-bold rounded-full hover:bg-foreground/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {status === "loading" ? "Processing..." : "Unsubscribe"}
                </button>

                <p className="text-[11px] text-muted text-center leading-relaxed">
                  You will continue to receive transactional emails such as booking
                  confirmations. Only marketing emails will be stopped.
                </p>
              </form>
            )}
          </ScrollReveal>
        </div>
      </div>
    </div>
  );
}
