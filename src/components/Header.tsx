"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import { isAuthenticated } from "@/lib/auth";

const navLinks = [
  { href: "/roster", label: "Roster" },
  { href: "/events", label: "Events" },
  { href: "/book", label: "Book" },
];

export function Header() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [authed, setAuthed] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Admin console has its own shell — don't render the public header inside /admin
  if (pathname?.startsWith("/admin")) return null;

  useEffect(() => {
    setAuthed(isAuthenticated());

    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  useEffect(() => {
    setAuthed(isAuthenticated());
  }, [pathname]);

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled
            ? "bg-background/75 backdrop-blur-xl border-b border-border/50"
            : "bg-transparent"
        }`}
      >
        <nav className="max-w-7xl mx-auto flex items-center justify-between px-5 py-3.5 lg:px-8">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group" aria-label="HighLife Live Home">
            <span className="relative w-10 h-10 inline-block shrink-0">
              <Image
                src="/HighLifeLogo.png"
                alt=""
                fill
                priority
                sizes="40px"
                className="object-contain"
              />
            </span>
            <span className="font-display text-base tracking-[0.18em] uppercase hidden sm:block">
              HighLife Live
            </span>
            <span className="font-display text-base tracking-[0.18em] uppercase sm:hidden">
              HighLife
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-7">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-xs tracking-[0.18em] uppercase transition-colors duration-300 ${
                  pathname === link.href
                    ? "text-foreground"
                    : "text-silver hover:text-foreground"
                }`}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/findanagent"
              className={`text-xs tracking-[0.18em] uppercase transition-colors duration-300 underline-offset-4 hover:underline ${
                pathname === "/findanagent" ? "text-foreground" : "text-silver hover:text-foreground"
              }`}
            >
              Auditions
            </Link>
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-3 sm:gap-5">
            {/* Agent Login text-link (formerly Partner Login slot) */}
            <Link
              href="/admin/login"
              className="hidden sm:inline text-xs tracking-[0.18em] uppercase text-white/85 hover:text-white underline underline-offset-4 decoration-white/40 hover:decoration-white/80 transition-colors"
            >
              Agent Login
            </Link>

            {/* Partner Login button (formerly Book Talent slot) — brighter gray, on-theme, not gradient */}
            <Link
              href={authed ? "/portal" : "/login"}
              className="hidden md:inline-flex items-center gap-2 px-5 py-2 text-xs tracking-[0.18em] uppercase font-semibold rounded-full bg-white/10 border border-white/20 text-white hover:bg-white/15 hover:border-white/35 transition-colors"
            >
              {authed ? "Portal" : "Partner Login"}
            </Link>

            {/* Mobile Menu Toggle */}
            <button
              className="lg:hidden p-2 text-foreground"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </nav>
      </header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
            className="fixed inset-0 z-40 bg-background/98 backdrop-blur-xl flex flex-col items-center justify-center lg:hidden"
          >
            <nav className="flex flex-col items-center gap-8">
              {navLinks.map((link, i) => (
                <motion.div
                  key={link.href}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 + i * 0.05, duration: 0.3 }}
                >
                  <Link
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className={`text-2xl font-display tracking-[0.15em] uppercase ${
                      pathname === link.href ? "text-foreground" : "text-silver"
                    }`}
                  >
                    {link.label}
                  </Link>
                </motion.div>
              ))}
              <Link
                href="/findanagent"
                onClick={() => setMobileOpen(false)}
                className="text-xl font-display tracking-[0.15em] uppercase text-silver"
              >
                Auditions
              </Link>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25, duration: 0.3 }}
              >
                <Link
                  href="/admin/login"
                  onClick={() => setMobileOpen(false)}
                  className="text-xl font-display tracking-[0.15em] uppercase text-white/85 underline underline-offset-4 decoration-white/40"
                >
                  Agent Login
                </Link>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.3 }}
              >
                <Link
                  href={authed ? "/portal" : "/login"}
                  onClick={() => setMobileOpen(false)}
                  className="mt-2 px-8 py-3 text-lg tracking-wide uppercase font-semibold rounded-full bg-white/10 border border-white/20 text-white hover:bg-white/15"
                >
                  {authed ? "Portal" : "Partner Login"}
                </Link>
              </motion.div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
