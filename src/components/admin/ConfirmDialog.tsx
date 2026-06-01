"use client";

import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, X } from "lucide-react";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  danger = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onCancel} />
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className={`relative glass-card rounded-2xl p-6 max-w-sm w-full ${danger ? "border border-red-500/20" : ""}`}
          >
            <button
              onClick={onCancel}
              className="absolute top-4 right-4 text-zinc-500 hover:text-foreground transition-colors"
            >
              <X size={16} />
            </button>
            <div className="flex items-center gap-3 mb-3">
              {danger && (
                <div className="w-9 h-9 rounded-full bg-red-500/10 flex items-center justify-center shrink-0">
                  <AlertTriangle size={16} className="text-red-400" />
                </div>
              )}
              <h3 className="font-display text-lg uppercase tracking-tight">{title}</h3>
            </div>
            <p className="text-sm text-zinc-400 mb-5">{message}</p>
            <div className="flex items-center gap-2">
              <button
                onClick={onCancel}
                className="flex-1 py-2.5 rounded-xl border border-white/10 hover:border-white/25 bg-black/40 text-sm text-zinc-400 hover:text-foreground transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                  danger
                    ? "bg-red-500 text-white hover:bg-red-600"
                    : "btn-gradient"
                }`}
              >
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
