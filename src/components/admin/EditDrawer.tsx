"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

interface EditDrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export default function EditDrawer({ open, onClose, title, children }: EditDrawerProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
            className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-lg overflow-y-auto bg-[#0a0a0a] border-l border-white/8"
          >
            <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-white/8 bg-[#0a0a0a]/90 backdrop-blur-md">
              <h2 className="font-display uppercase text-lg tracking-tight text-foreground">{title}</h2>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg border border-white/8 hover:bg-white/4 text-zinc-400 hover:text-foreground transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            <div className="px-6 py-6 space-y-5">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ── Reusable form field components ──────────────────────────

export function FieldText({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div>
      <label className="text-[9px] tracking-[0.18em] uppercase text-zinc-600 block mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 rounded-xl bg-white/4 border border-white/8 text-sm text-foreground placeholder:text-zinc-600 focus:outline-none focus:border-pink-500/40"
      />
    </div>
  );
}

export function FieldTextArea({
  label,
  value,
  onChange,
  placeholder,
  rows = 3,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <div>
      <label className="text-[9px] tracking-[0.18em] uppercase text-zinc-600 block mb-1">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full px-3 py-2 rounded-xl bg-white/4 border border-white/8 text-sm text-foreground placeholder:text-zinc-600 focus:outline-none focus:border-pink-500/40 resize-none"
      />
    </div>
  );
}

export function FieldSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <div>
      <label className="text-[9px] tracking-[0.18em] uppercase text-zinc-600 block mb-1">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 rounded-xl bg-white/4 border border-white/8 text-sm text-zinc-300 focus:outline-none focus:border-pink-500/40 appearance-none cursor-pointer"
      >
        {options.map((o) => (
          <option key={o} value={o} className="bg-zinc-900">{o}</option>
        ))}
      </select>
    </div>
  );
}

export function FieldNumber({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="text-[9px] tracking-[0.18em] uppercase text-zinc-600 block mb-1">{label}</label>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        placeholder={placeholder}
        className="w-full px-3 py-2 rounded-xl bg-white/4 border border-white/8 text-sm text-foreground placeholder:text-zinc-600 focus:outline-none focus:border-pink-500/40"
      />
    </div>
  );
}

export function FieldTags({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
}) {
  const [draft, setDraft] = React.useState(value.join(", "));
  const suppressSync = React.useRef(false);

  // Sync draft when parent value changes externally (e.g. form reset)
  React.useEffect(() => {
    if (suppressSync.current) {
      suppressSync.current = false;
      return;
    }
    setDraft(value.join(", "));
  }, [value]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const text = e.target.value;
    setDraft(text);
    // Keep parent state updated so saves mid-typing aren't lost,
    // but suppress the useEffect re-sync so the draft isn't clobbered.
    suppressSync.current = true;
    onChange(text.split(",").map((s) => s.trim()).filter(Boolean));
  }

  function handleBlur() {
    // Normalize: trim, dedupe empties, and re-sync the display.
    const parsed = draft.split(",").map((s) => s.trim()).filter(Boolean);
    setDraft(parsed.join(", "));
    suppressSync.current = true;
    onChange(parsed);
  }

  return (
    <div>
      <label className="text-[9px] tracking-[0.18em] uppercase text-zinc-600 block mb-1">{label}</label>
      <input
        type="text"
        value={draft}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder={placeholder || "Comma-separated values"}
        className="w-full px-3 py-2 rounded-xl bg-white/4 border border-white/8 text-sm text-foreground placeholder:text-zinc-600 focus:outline-none focus:border-pink-500/40"
      />
    </div>
  );
}
