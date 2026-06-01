"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";
import { login } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Simulate network delay
    await new Promise((r) => setTimeout(r, 600));

    if (login(email, password)) {
      router.push("/portal");
    } else {
      setError("Invalid credentials. Try demo@demo.com / demo");
      setLoading(false);
    }
  };

  return (
    <div className="pt-28 pb-24 min-h-screen flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
        className="w-full max-w-md mx-auto px-6"
      >
        <div className="text-center mb-10">
          <div className="w-12 h-12 border border-border mx-auto mb-6 flex items-center justify-center">
            <span className="font-serif text-lg font-semibold">H</span>
          </div>
          <h1 className="font-serif text-3xl md:text-4xl font-light tracking-tight mb-3">
            Promoter Login
          </h1>
          <p className="text-sm text-silver">
            Access your booking dashboard, track inquiries, and manage artist
            requests.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="email"
              className="text-xs tracking-[0.15em] uppercase text-muted block mb-2"
            >
              Email or Username
            </label>
            <input
              id="email"
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-soft-gray border border-border text-sm px-4 py-3 text-foreground placeholder:text-muted focus:outline-none focus:border-silver transition-colors"
              placeholder="demo@demo.com"
              required
              autoComplete="email"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="text-xs tracking-[0.15em] uppercase text-muted block mb-2"
            >
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-soft-gray border border-border text-sm px-4 py-3 pr-12 text-foreground placeholder:text-muted focus:outline-none focus:border-silver transition-colors"
                placeholder="Enter password"
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-silver transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && (
            <motion.p
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-red-400 text-sm text-center"
            >
              {error}
            </motion.p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-foreground text-background text-sm tracking-[0.15em] uppercase font-medium rounded-full hover:bg-foreground/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div className="mt-8 p-4 bg-card border border-border/30 text-center">
          <p className="text-xs text-muted">
            Demo credentials:{" "}
            <span className="text-silver">demo@demo.com</span> /{" "}
            <span className="text-silver">demo</span>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
