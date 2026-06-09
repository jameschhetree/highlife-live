"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

export function Footer() {
  const pathname = usePathname();
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [subscribing, setSubscribing] = useState(false);

  if (pathname?.startsWith("/admin")) return null;

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || subscribing) return;
    setSubscribing(true);
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      if (res.ok) {
        setSubscribed(true);
        setEmail("");
      }
    } catch {
      // silently fail
    } finally {
      setSubscribing(false);
    }
  };

  return (
    <footer className="border-t border-border/50 bg-background">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <span className="relative w-10 h-10 inline-block shrink-0">
                <Image
                  src="/HighLifeLogo.png"
                  alt="HighLife Live"
                  fill
                  sizes="40px"
                  className="object-contain"
                />
              </span>
              <span className="font-display text-lg tracking-[0.2em] uppercase font-medium">
                HighLife Live
              </span>
            </div>
            <p className="text-silver text-sm leading-relaxed max-w-md">
              The booking and artist development arm of the HighLife ecosystem.
              Connecting venues, promoters, brands, and private clients with
              talent that moves rooms.
            </p>
            <div className="mt-6">
              {/* Phase 3.8 — Liam directive: no email-client links yet (Phase 4.5+).
                  Address displayed as plain text for now. */}
              <span className="text-sm text-silver select-all">
                info@highlifelive.com
              </span>
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-xs tracking-[0.2em] uppercase text-silver mb-4 font-medium">
              Navigate
            </h4>
            <div className="flex flex-col gap-3">
              {[
                { href: "/findanagent", label: "Auditions" },
                { href: "/roster", label: "Entertainment Roster" },
                { href: "/events", label: "Events" },
                { href: "/book", label: "Book an Artist" },
                { href: "/login", label: "Partner Login" },
              ].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm text-silver hover:text-foreground transition-colors"
                >
                  {link.label}
                </Link>
              ))}
              <a
                href="https://highlifedmv.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-silver hover:text-foreground transition-colors"
              >
                Music & Podcast Studio
              </a>
            </div>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="text-xs tracking-[0.2em] uppercase text-silver mb-4 font-medium">
              Stay Connected
            </h4>
            <p className="text-sm text-silver mb-4 leading-relaxed">
              Get first access to events, artist drops, and booking
              availability.
            </p>
            {subscribed ? (
              <p className="text-sm text-emerald-400">You are subscribed.</p>
            ) : (
              <form onSubmit={handleSubscribe} className="flex">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="flex-1 bg-soft-gray border border-border text-sm px-4 py-2.5 text-foreground placeholder:text-muted focus:outline-none focus:border-silver transition-colors"
                  aria-label="Email address for newsletter"
                  required
                />
                <button
                  type="submit"
                  disabled={subscribing}
                  className="px-4 py-2.5 bg-foreground text-background text-sm font-medium tracking-wide uppercase hover:bg-foreground/90 transition-colors disabled:opacity-50"
                >
                  {subscribing ? "..." : "Join"}
                </button>
              </form>
            )}
            <div className="flex gap-4 mt-6">
              <a
                href="https://www.instagram.com/highlifeliveent/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-muted hover:text-silver cursor-pointer transition-colors uppercase tracking-wide"
              >
                Instagram
              </a>
            </div>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-border/30 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-muted">
            &copy; {new Date().getFullYear()} HighLife Live. All rights reserved.
          </p>
          <p className="text-xs text-muted">
            Curated talent. Premium experiences. Artist-first booking.
          </p>
        </div>
      </div>
    </footer>
  );
}
