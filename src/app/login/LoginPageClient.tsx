"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, ChevronDown, CheckCircle } from "lucide-react";
import { login } from "@/lib/auth";

const ACCOUNT_TYPES = ["Venue", "Promoter"] as const;
const ROLES = ["Owner", "Talent Buyer", "Promoter", "Venue Manager", "Event Coordinator", "Other"] as const;

export default function LoginPageClient() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Request form state
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [requestSubmitted, setRequestSubmitted] = useState(false);
  const [requestLoading, setRequestLoading] = useState(false);
  const [requestError, setRequestError] = useState("");

  const [accountType, setAccountType] = useState<string>("Venue");
  const [orgName, setOrgName] = useState("");
  const [address, setAddress] = useState("");
  const [role, setRole] = useState("");
  const [contactName, setContactName] = useState("");
  const [workPhone, setWorkPhone] = useState("");
  const [mobilePhone, setMobilePhone] = useState("");
  const [workEmail, setWorkEmail] = useState("");
  const [requestedLoginEmail, setRequestedLoginEmail] = useState("");
  const [howHeard, setHowHeard] = useState("");
  const [preferredGenre, setPreferredGenre] = useState("");
  const [extraNotes, setExtraNotes] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const ok = await login(email, password);
    if (ok) {
      router.push("/portal");
    } else {
      setError("Invalid credentials.");
      setLoading(false);
    }
  };

  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRequestError("");

    if (!orgName.trim()) {
      setRequestError(accountType === "Venue" ? "Venue name is required." : "Promotion name is required.");
      return;
    }
    if (accountType === "Venue" && !address.trim()) {
      setRequestError("Address is required for venue accounts.");
      return;
    }
    if (!role) {
      setRequestError("Please select a role.");
      return;
    }
    if (!contactName.trim()) {
      setRequestError("Your name is required.");
      return;
    }
    if (!workPhone.trim() && !mobilePhone.trim()) {
      setRequestError("At least one phone number is required.");
      return;
    }
    if (!workEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(workEmail.trim())) {
      setRequestError("A valid work email is required.");
      return;
    }
    if (!requestedLoginEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(requestedLoginEmail.trim())) {
      setRequestError("A valid requested login email is required.");
      return;
    }

    setRequestLoading(true);
    try {
      const res = await fetch("/api/partner-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountType,
          organizationName: orgName.trim(),
          address: address.trim(),
          role,
          contactName: contactName.trim(),
          workPhone: workPhone.trim(),
          mobilePhone: mobilePhone.trim(),
          workEmail: workEmail.trim(),
          requestedLoginEmail: requestedLoginEmail.trim(),
          howHeard: howHeard.trim(),
          preferredGenre: preferredGenre.trim(),
          extraNotes: extraNotes.trim(),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: "Submission failed." }));
        setRequestError(data.error || "Submission failed.");
        setRequestLoading(false);
        return;
      }

      setRequestSubmitted(true);
    } catch {
      setRequestError("Network error. Please try again.");
    } finally {
      setRequestLoading(false);
    }
  };

  const inputClass =
    "w-full bg-black/40 border border-white/10 rounded-xl text-sm px-4 py-3 text-foreground placeholder:text-zinc-500 focus:outline-none focus:border-pink-400/60 transition-colors";
  const labelClass =
    "text-[10px] tracking-[0.18em] uppercase text-zinc-400 block mb-2";

  return (
    <div className="pt-28 pb-24 min-h-screen bg-radial-atmosphere">
      <div className="max-w-6xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-start">
        {/* Left side -- Login form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
          className="w-full max-w-md mx-auto lg:mx-0"
        >
          <div className="text-center lg:text-left mb-10">
            <span className="relative w-14 h-14 inline-block mb-6">
              <Image
                src="/HighLifeLogo.png"
                alt="HighLife Live"
                fill
                sizes="56px"
                className="object-contain"
              />
            </span>
            <h1 className="font-display uppercase text-3xl md:text-4xl tracking-tight mb-3">
              <span className="text-gradient-hero">Partner</span> Login
            </h1>
            <p className="text-sm text-silver">
              Access your booking dashboard, track inquiries, and manage artist
              requests.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="glass-card rounded-2xl p-6 sm:p-8 space-y-5">
            <div>
              <label htmlFor="email" className={labelClass}>
                Email
              </label>
              <input
                id="email"
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
                placeholder="you@venue.com"
                required
                autoComplete="email"
              />
            </div>

            <div>
              <label htmlFor="password" className={labelClass}>
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`${inputClass} pr-12`}
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
                className="text-red-400 text-sm text-center lg:text-left"
              >
                {error}
              </motion.p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 btn-gradient text-xs tracking-[0.18em] uppercase font-bold rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>
        </motion.div>

        {/* Right side -- Request venue login */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15, ease: [0.32, 0.72, 0, 1] }}
          className="w-full max-w-md mx-auto lg:mx-0"
        >
          <div className="text-center lg:text-left mb-6">
            <h2 className="font-display uppercase text-xl tracking-tight mb-2">
              New here?
            </h2>
            <p className="text-sm text-silver">
              Venues and promoters can request a partner login to access the booking portal.
            </p>
          </div>

          {/* Toggle button */}
          <button
            type="button"
            onClick={() => setShowRequestForm(!showRequestForm)}
            className="w-full py-3.5 border border-white/10 text-sm tracking-[0.18em] uppercase font-medium rounded-full hover:border-white/25 hover:text-foreground text-zinc-300 transition-all flex items-center justify-center gap-2"
          >
            Request Partner Login
            <motion.span
              animate={{ rotate: showRequestForm ? 180 : 0 }}
              transition={{ duration: 0.3 }}
            >
              <ChevronDown size={16} />
            </motion.span>
          </button>

          <AnimatePresence>
            {showRequestForm && !requestSubmitted && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
                className="overflow-hidden"
              >
                <form onSubmit={handleRequestSubmit} className="glass-card rounded-2xl p-6 mt-4 space-y-4">
                  {/* Account Type */}
                  <div>
                    <label className={labelClass}>Account Type</label>
                    <div className="flex gap-3">
                      {ACCOUNT_TYPES.map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setAccountType(t)}
                          className={`flex-1 py-2.5 text-xs tracking-[0.15em] uppercase border rounded-lg transition-colors ${
                            accountType === t
                              ? "border-pink-400/60 text-foreground bg-pink-400/5"
                              : "border-white/10 text-zinc-400 hover:border-white/25"
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className={labelClass}>
                      {accountType === "Venue" ? "Venue Name" : "Promotion Name"}
                    </label>
                    <input type="text" value={orgName} onChange={(e) => setOrgName(e.target.value)} className={inputClass} placeholder={accountType === "Venue" ? "The Grand Venue" : "Nightlife Productions"} required />
                  </div>

                  <div>
                    <label className={labelClass}>
                      Venue Address
                      {accountType === "Venue" && <span className="text-pink-400 ml-1">*</span>}
                      {accountType === "Promoter" && <span className="text-zinc-600 ml-1">(optional)</span>}
                    </label>
                    <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} className={inputClass} placeholder="123 Main St, Washington, DC 20001" required={accountType === "Venue"} />
                  </div>

                  <div>
                    <label className={labelClass}>Role</label>
                    <select value={role} onChange={(e) => setRole(e.target.value)} className={`${inputClass} appearance-none`} required>
                      <option value="" disabled>Select your role</option>
                      {ROLES.map((r) => (<option key={r} value={r}>{r}</option>))}
                    </select>
                  </div>

                  <div>
                    <label className={labelClass}>Your Name</label>
                    <input type="text" value={contactName} onChange={(e) => setContactName(e.target.value)} className={inputClass} placeholder="John Smith" required />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelClass}>Work Phone</label>
                      <input type="tel" value={workPhone} onChange={(e) => setWorkPhone(e.target.value)} className={inputClass} placeholder="(202) 555-0100" />
                    </div>
                    <div>
                      <label className={labelClass}>Mobile Phone</label>
                      <input type="tel" value={mobilePhone} onChange={(e) => setMobilePhone(e.target.value)} className={inputClass} placeholder="(202) 555-0101" />
                    </div>
                  </div>
                  <p className="text-[10px] text-zinc-500 -mt-2">At least one phone number is required.</p>

                  <div>
                    <label className={labelClass}>Work Email</label>
                    <input type="email" value={workEmail} onChange={(e) => setWorkEmail(e.target.value)} className={inputClass} placeholder="john@venue.com" required />
                  </div>
                  <div>
                    <label className={labelClass}>Requested Login Email</label>
                    <input type="email" value={requestedLoginEmail} onChange={(e) => setRequestedLoginEmail(e.target.value)} className={inputClass} placeholder="login@venue.com" required />
                  </div>

                  <div>
                    <label className={labelClass}>How did you hear about us? <span className="text-zinc-600">(optional)</span></label>
                    <input type="text" value={howHeard} onChange={(e) => setHowHeard(e.target.value)} className={inputClass} placeholder="Referral, social media, event..." />
                  </div>

                  <div>
                    <label className={labelClass}>Preferred Genre / Act <span className="text-zinc-600">(optional)</span></label>
                    <input type="text" value={preferredGenre} onChange={(e) => setPreferredGenre(e.target.value)} className={inputClass} placeholder="R&B, Hip-Hop, Jazz..." />
                  </div>

                  <div>
                    <label className={labelClass}>Extra Notes <span className="text-zinc-600">(optional)</span></label>
                    <textarea value={extraNotes} onChange={(e) => setExtraNotes(e.target.value)} className={`${inputClass} resize-none`} rows={3} placeholder="Anything else you want us to know..." />
                  </div>

                  {requestError && (
                    <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="text-red-400 text-sm">{requestError}</motion.p>
                  )}

                  <button type="submit" disabled={requestLoading} className="w-full py-3.5 btn-gradient text-xs tracking-[0.18em] uppercase font-bold rounded-full disabled:opacity-50 disabled:cursor-not-allowed">
                    {requestLoading ? "Submitting..." : "Submit Request"}
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Success state */}
          <AnimatePresence>
            {requestSubmitted && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="mt-6 p-6 border border-emerald-500/30 bg-emerald-500/5 rounded-2xl text-center"
              >
                <CheckCircle size={32} className="text-emerald-400 mx-auto mb-3" />
                <h3 className="font-display uppercase text-lg mb-2">Request Submitted</h3>
                <p className="text-sm text-silver">
                  Your partner login request has been received. Our team will review it
                  and reach out with setup instructions.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
