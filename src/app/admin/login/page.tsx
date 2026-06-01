"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Lock, ArrowRight } from "lucide-react";
import { adminLogin } from "@/lib/admin-auth";

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const ok = adminLogin(username, password);
    if (!ok) {
      setError("Invalid credentials");
      return;
    }
    router.push("/admin");
  };

  return (
    <div className="min-h-screen bg-radial-atmosphere flex items-center justify-center px-5">
      <div className="w-full max-w-md">
        <Link
          href="/"
          className="flex items-center gap-3 mb-10 justify-center"
        >
          <span className="relative w-12 h-12 inline-block">
            <Image src="/logo.png" alt="" fill sizes="48px" className="object-contain" />
          </span>
          <span className="font-display text-xl tracking-[0.2em] uppercase">
            HighLife Live
          </span>
        </Link>

        <div className="glass-card rounded-3xl p-8 sm:p-10">
          <div className="flex items-center gap-2 mb-6 justify-center">
            <Lock size={14} className="text-pink-300" strokeWidth={1.5} />
            <span className="text-[10px] tracking-[0.3em] uppercase text-zinc-300">
              Admin Console
            </span>
          </div>

          <h1 className="font-display uppercase text-3xl sm:text-4xl tracking-tight text-center leading-[0.95] mb-2">
            <span className="text-gradient-hero">Internal</span> access
          </h1>
          <p className="text-center text-zinc-400 text-sm mb-8">
            Booking operations · CRM · campaign approvals
          </p>

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <div>
              <label className="block text-[11px] tracking-[0.2em] uppercase text-silver mb-2">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  setError("");
                }}
                placeholder="admin"
                autoComplete="username"
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-zinc-500 focus:outline-none focus:border-pink-400/60 transition-colors"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] tracking-[0.2em] uppercase text-silver mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError("");
                }}
                autoComplete="current-password"
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-zinc-500 focus:outline-none focus:border-pink-400/60 transition-colors"
                required
              />
            </div>

            {error && (
              <p className="text-[12px] text-rose-400 text-center">{error}</p>
            )}

            <button
              type="submit"
              className="group w-full inline-flex items-center justify-center gap-2 px-7 py-3.5 btn-gradient text-xs tracking-[0.18em] uppercase font-bold rounded-full"
            >
              Enter Console
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </form>

          <p className="mt-6 text-center text-[10px] tracking-[0.18em] uppercase text-zinc-500">
            Demo creds · admin / admin
          </p>
        </div>

        <div className="text-center mt-6">
          <Link
            href="/"
            className="text-xs tracking-[0.18em] uppercase text-silver hover:text-foreground transition-colors"
          >
            ← Back to Public Site
          </Link>
        </div>
      </div>
    </div>
  );
}
