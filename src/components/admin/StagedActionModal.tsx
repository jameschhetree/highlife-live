"use client";

// Phase 3.8 scaffolding — reusable "this lives in a later phase" modal.
// Use anywhere a button is visible but the backend flow isn't ready yet.
// Honest staging instead of dead buttons or false promises.

import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles } from "lucide-react";

interface StagedActionModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  body?: React.ReactNode;
  targetPhase?: string; // e.g. "Phase 4.5", "Phase 5.5"
  icon?: React.ReactNode;
}

export function StagedActionModal({
  open,
  onClose,
  title,
  body,
  targetPhase = "a future update",
  icon,
}: StagedActionModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onClick={onClose}
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="glass-card rounded-2xl p-6 sm:p-7 max-w-md w-full"
          >
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400/20 to-violet-400/20 inline-flex items-center justify-center shrink-0">
                  {icon ?? <Sparkles size={16} className="text-pink-200" />}
                </div>
                <div>
                  <p className="text-[10px] tracking-[0.18em] uppercase text-zinc-500">Coming in {targetPhase}</p>
                  <h2 className="mt-0.5 font-display uppercase text-lg tracking-tight">{title}</h2>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg border border-white/10 hover:border-white/25 text-zinc-400 hover:text-foreground transition-colors"
                aria-label="Close"
              >
                <X size={14} />
              </button>
            </div>

            {body && (
              <div className="text-sm text-zinc-300 leading-relaxed mb-5">
                {body}
              </div>
            )}

            <button
              onClick={onClose}
              className="w-full py-2.5 rounded-full border border-white/10 hover:border-white/25 bg-black/40 text-xs tracking-[0.18em] uppercase text-zinc-300 hover:text-foreground transition-colors"
            >
              Got it
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
