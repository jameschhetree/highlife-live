"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Sun, Moon, Sparkles, Zap } from "lucide-react";
import { isAuthenticated } from "@/lib/auth";
import { PortalTransition } from "@/components/PortalTransition";
import { useTheme } from "@/components/ThemeProvider";

// Phase 3.9 / 2026-06-08 — env-gated nav. Shop appears only on demo builds
// (NEXT_PUBLIC_BUILD_TARGET=demo). Production hides Shop until it's real.
// Env var is set per Vercel environment: "prod" on Production, "demo" on Preview.
const isDemoBuild = process.env.NEXT_PUBLIC_BUILD_TARGET === "demo";

const navLinks: { href: string; label: string }[] = [
  { href: "/roster", label: "Roster" },
  { href: "/events", label: "Events" },
  { href: "/book", label: "Book" },
  ...(isDemoBuild ? [{ href: "/shop", label: "Shop" }] : []),
];

export function Header() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [authed, setAuthed] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showAnimTip, setShowAnimTip] = useState(false);
  const { theme, setTheme, animationsEnabled, setAnimationsEnabled } = useTheme();
  const hidden =
    pathname?.startsWith("/admin") ||
    (pathname?.startsWith("/roster/") && pathname.endsWith("-epk"));

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    const frame = window.requestAnimationFrame(() => {
      setAuthed(isAuthenticated());
      onScroll();
    });
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
    };
  }, [pathname]);

  useEffect(() => {
    if (pathname !== "/") { setShowAnimTip(false); return; }
    if (typeof window === "undefined") return;
    if (localStorage.getItem("hll_seen_anim_tip")) return;
    setShowAnimTip(true);
    localStorage.setItem("hll_seen_anim_tip", "1");
    const timer = setTimeout(() => setShowAnimTip(false), 10000);
    return () => clearTimeout(timer);
  }, [pathname]);

  // Admin and standalone EPK microsites have their own shells.
  if (hidden) return null;

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const toggleAnimations = () => {
    setAnimationsEnabled(!animationsEnabled);
  };

  const isLight = theme === "light";

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
          {/* Left: Toggle controls + Logo */}
          <div className="flex items-center gap-2.5">
            {/* Animations toggle — leftmost */}
            <div className="relative">
              <button
                type="button"
                onClick={toggleAnimations}
                aria-label={animationsEnabled ? "Disable animations" : "Enable animations"}
                title={animationsEnabled ? "Disable animations" : "Enable animations"}
                className={`relative w-8 h-8 flex items-center justify-center rounded-full border transition-all duration-200
                  ${isLight
                    ? "border-black/12 bg-white/60 hover:bg-white/90 text-neutral-600 hover:text-neutral-900"
                    : "border-white/10 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white/90"
                  }`}
              >
                {animationsEnabled ? (
                  <Sparkles size={14} />
                ) : (
                  <Zap size={14} className="opacity-50" />
                )}
              </button>

              {/* First-time animation tip bubble */}
              <AnimatePresence>
                {showAnimTip && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
                    className="absolute left-1/2 -translate-x-1/2 top-10 z-50 hidden sm:block"
                  >
                    <div className="relative bg-white text-neutral-900 text-[11px] tracking-wide font-medium px-3 py-1.5 rounded-lg shadow-lg whitespace-nowrap">
                      <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white rotate-45" />
                      Turn off animations
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Theme toggle — to the left of logo */}
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={isLight ? "Switch to dark mode" : "Switch to light mode"}
              title={isLight ? "Switch to dark mode" : "Switch to light mode"}
              className={`relative w-8 h-8 flex items-center justify-center rounded-full border transition-all duration-200
                ${isLight
                  ? "border-black/12 bg-white/60 hover:bg-white/90 text-neutral-600 hover:text-neutral-900"
                  : "border-white/10 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white/90"
                }`}
            >
              <AnimatePresence mode="wait" initial={false}>
                {isLight ? (
                  <motion.span
                    key="moon"
                    initial={{ opacity: 0, rotate: -30, scale: 0.7 }}
                    animate={{ opacity: 1, rotate: 0, scale: 1 }}
                    exit={{ opacity: 0, rotate: 30, scale: 0.7 }}
                    transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
                    className="flex items-center justify-center"
                  >
                    <Moon size={14} />
                  </motion.span>
                ) : (
                  <motion.span
                    key="sun"
                    initial={{ opacity: 0, rotate: 30, scale: 0.7 }}
                    animate={{ opacity: 1, rotate: 0, scale: 1 }}
                    exit={{ opacity: 0, rotate: -30, scale: 0.7 }}
                    transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
                    className="flex items-center justify-center"
                  >
                    <Sun size={14} />
                  </motion.span>
                )}
              </AnimatePresence>
            </button>

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
          </div>

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
            {/* Agent Login text-link — routes through portal-transition overlay */}
            <PortalTransition to="/admin/login" direction="entering">
              {(start) => (
                <button
                  type="button"
                  onClick={start}
                  className="hidden sm:inline text-xs tracking-[0.18em] uppercase text-white/85 hover:text-white underline underline-offset-4 decoration-white/40 hover:decoration-white/80 transition-colors bg-transparent border-none cursor-pointer p-0"
                >
                  Agent Login
                </button>
              )}
            </PortalTransition>

            {/* Partner Login button -- animated glow border, not the rainbow gradient */}
            <Link
              href={authed ? "/portal" : "/login"}
              className="hidden md:inline-flex items-center gap-2 px-5 py-2 text-xs tracking-[0.18em] uppercase font-semibold rounded-full partner-login-btn"
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
                <PortalTransition to="/admin/login" direction="entering">
                  {(start) => (
                    <button
                      type="button"
                      onClick={() => { setMobileOpen(false); start(); }}
                      className="text-xl font-display tracking-[0.15em] uppercase text-white/85 underline underline-offset-4 decoration-white/40 bg-transparent border-none cursor-pointer"
                    >
                      Agent Login
                    </button>
                  )}
                </PortalTransition>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.3 }}
              >
                <Link
                  href={authed ? "/portal" : "/login"}
                  onClick={() => setMobileOpen(false)}
                  className="mt-2 px-8 py-3 text-lg tracking-wide uppercase font-semibold rounded-full partner-login-btn"
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
