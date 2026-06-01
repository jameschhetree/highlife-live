"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function Footer() {
  const pathname = usePathname();
  if (pathname?.startsWith("/admin")) return null;

  return (
    <footer className="border-t border-border/50 bg-background">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 border border-foreground/30 flex items-center justify-center">
                <span className="font-serif text-sm font-semibold tracking-wide">H</span>
              </div>
              <span className="font-display text-lg tracking-[0.2em] uppercase font-medium">
                HighLife Records
              </span>
            </div>
            <p className="text-silver text-sm leading-relaxed max-w-md">
              The booking and artist development arm of the HighLife ecosystem.
              Connecting venues, promoters, brands, and private clients with
              talent that moves rooms.
            </p>
            <div className="mt-6">
              <a
                href="mailto:bookings@highliferecords.com"
                className="text-sm text-silver hover:text-foreground transition-colors"
              >
                bookings@highliferecords.com
              </a>
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-xs tracking-[0.2em] uppercase text-silver mb-4 font-medium">
              Navigate
            </h4>
            <div className="flex flex-col gap-3">
              {[
                { href: "/roster", label: "Artist Roster" },
                { href: "/events", label: "Events" },
                { href: "/book", label: "Book an Artist" },
                { href: "/shop", label: "Merch Shop" },
                { href: "/login", label: "Promoter Login" },
              ].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm text-silver hover:text-foreground transition-colors"
                >
                  {link.label}
                </Link>
              ))}
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
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.target as HTMLFormElement;
                const input = form.querySelector("input") as HTMLInputElement;
                if (input) input.value = "";
              }}
              className="flex"
            >
              <input
                type="email"
                placeholder="your@email.com"
                className="flex-1 bg-soft-gray border border-border text-sm px-4 py-2.5 text-foreground placeholder:text-muted focus:outline-none focus:border-silver transition-colors"
                aria-label="Email address for newsletter"
                required
              />
              <button
                type="submit"
                className="px-4 py-2.5 bg-foreground text-background text-sm font-medium tracking-wide uppercase hover:bg-foreground/90 transition-colors"
              >
                Join
              </button>
            </form>
            <div className="flex gap-4 mt-6">
              {["Instagram", "Twitter", "Spotify"].map((platform) => (
                <span
                  key={platform}
                  className="text-xs text-muted hover:text-silver cursor-pointer transition-colors uppercase tracking-wide"
                >
                  {platform}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-border/30 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-muted">
            &copy; {new Date().getFullYear()} HighLife Records. All rights reserved.
          </p>
          <p className="text-xs text-muted">
            Curated talent. Premium experiences. Artist-first booking.
          </p>
        </div>
      </div>
    </footer>
  );
}
