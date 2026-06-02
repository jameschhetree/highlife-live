"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Trash2, ExternalLink, Mail, Phone, Music } from "lucide-react";
import { canViewAuditions, getAdminSession, type AdminSession } from "@/lib/admin-auth";

interface Audition {
  id: string;
  classification: string;
  classificationOther?: string;
  actStageName: string;
  fullName: string;
  email: string;
  phone: string;
  performanceLinks: string;
  instagram: string;
  facebook: string;
  uploads: Array<{ url?: string; pathname?: string; filename?: string; size?: number; contentType?: string }>;
  source: string;
  status: string;
  submittedAt: string;
}

const STATUS_OPTIONS = ["New", "Reviewed", "Replied", "Booked", "Lost"];

export default function AuditionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const [session, setSession] = useState<AdminSession | null>(null);
  const [row, setRow] = useState<Audition | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const current = getAdminSession();
    if (!current || !canViewAuditions(current)) {
      router.replace("/admin");
      return;
    }
    setSession(current);

    fetch(`/api/admin/auditions/${id}`, {
      headers: { "x-admin-email": current.email },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then(setRow)
      .finally(() => setLoading(false));
  }, [id, router]);

  const updateStatus = async (newStatus: string) => {
    if (!row || !session) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/auditions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-admin-email": session.email },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        const updated = await res.json();
        setRow(updated);
      }
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!session) return;
    if (!confirm("Delete this audition? This cannot be undone.")) return;
    await fetch(`/api/admin/auditions/${id}`, {
      method: "DELETE",
      headers: { "x-admin-email": session.email },
    });
    router.push("/admin/auditions");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="text-[10px] tracking-[0.3em] uppercase text-zinc-500">Loading...</span>
      </div>
    );
  }

  if (!row) {
    return (
      <div className="min-h-screen flex items-center justify-center flex-col gap-4">
        <span className="text-sm text-zinc-400">Audition not found.</span>
        <Link
          href="/admin/auditions"
          className="text-xs tracking-[0.18em] uppercase text-zinc-300 hover:text-foreground"
        >
          ← Back to Auditions
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-foreground">
      <div className="border-b border-white/8 px-4 sm:px-6 lg:px-10 py-6">
        <Link
          href="/admin/auditions"
          className="inline-flex items-center gap-2 text-xs tracking-[0.18em] uppercase text-zinc-400 hover:text-foreground transition-colors mb-3"
        >
          <ArrowLeft size={13} /> All Auditions
        </Link>
        <p className="text-[10px] tracking-[0.3em] uppercase text-zinc-500 mb-1">
          HighLife Live · Audition Detail
        </p>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="font-display uppercase text-3xl tracking-tight leading-[0.95]">
              {row.actStageName}
            </h1>
            <p className="text-sm text-zinc-400 mt-1">
              {row.fullName} · {row.classification}
              {row.classificationOther ? ` (${row.classificationOther})` : ""}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={row.status}
              onChange={(e) => updateStatus(e.target.value)}
              disabled={saving}
              className="bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-xs tracking-[0.18em] uppercase text-foreground focus:outline-none focus:border-pink-400/60"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s} className="bg-zinc-900">
                  {s}
                </option>
              ))}
            </select>
            <button
              onClick={remove}
              className="p-2 rounded-xl border border-rose-500/30 hover:border-rose-500/60 bg-rose-500/10 text-rose-300 hover:text-rose-200 transition-colors"
              title="Delete audition"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-10 py-8 grid lg:grid-cols-3 gap-5">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="lg:col-span-2 space-y-5"
        >
          <div className="glass-card rounded-2xl p-6">
            <h2 className="text-[11px] tracking-[0.22em] uppercase text-zinc-400 mb-4">Contact</h2>
            <div className="space-y-3">
              <a
                href={`mailto:${row.email}`}
                className="flex items-center gap-3 text-sm text-zinc-200 hover:text-foreground"
              >
                <Mail size={14} className="text-zinc-500" /> {row.email}
              </a>
              <a
                href={`tel:${row.phone.replace(/[^\d+]/g, "")}`}
                className="flex items-center gap-3 text-sm text-zinc-200 hover:text-foreground"
              >
                <Phone size={14} className="text-zinc-500" /> {row.phone}
              </a>
              {row.instagram && (
                <div className="flex items-center gap-3 text-sm text-zinc-200">
                  <span className="w-3.5 h-3.5 text-zinc-500 text-[11px]">IG</span> {row.instagram}
                </div>
              )}
              {row.facebook && (
                <div className="flex items-center gap-3 text-sm text-zinc-200">
                  <span className="w-3.5 h-3.5 text-zinc-500 text-[11px]">FB</span> {row.facebook}
                </div>
              )}
            </div>
          </div>

          {row.performanceLinks && (
            <div className="glass-card rounded-2xl p-6">
              <h2 className="text-[11px] tracking-[0.22em] uppercase text-zinc-400 mb-3">Performance Links</h2>
              <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">
                {row.performanceLinks}
              </p>
            </div>
          )}

          <div className="glass-card rounded-2xl p-6">
            <h2 className="text-[11px] tracking-[0.22em] uppercase text-zinc-400 mb-4 flex items-center gap-2">
              <Music size={13} className="text-pink-300" /> Uploaded Media
              <span className="text-zinc-500 normal-case tracking-normal">
                ({row.uploads?.length ?? 0})
              </span>
            </h2>
            {!row.uploads || row.uploads.length === 0 ? (
              <p className="text-sm text-zinc-500">No files uploaded.</p>
            ) : (
              <div className="space-y-2">
                {row.uploads.map((file, i) => {
                  const name = file.filename || file.pathname?.split("/").pop() || `File ${i + 1}`;
                  const sizeMb = file.size ? (file.size / 1024 / 1024).toFixed(1) : "?";
                  return (
                    <a
                      key={i}
                      href={file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between gap-3 p-3 rounded-xl border border-white/8 hover:border-white/20 bg-black/30 hover:bg-black/50 transition-colors group"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="text-sm text-zinc-200 truncate group-hover:text-foreground">
                          {name}
                        </div>
                        <div className="text-[10px] tracking-wide uppercase text-zinc-500 mt-0.5">
                          {file.contentType || "media"} · {sizeMb} MB
                        </div>
                      </div>
                      <ExternalLink size={13} className="text-zinc-500 group-hover:text-zinc-300 shrink-0" />
                    </a>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="space-y-5"
        >
          <div className="glass-card rounded-2xl p-6">
            <h2 className="text-[11px] tracking-[0.22em] uppercase text-zinc-400 mb-4">Meta</h2>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-[10px] tracking-[0.18em] uppercase text-zinc-500">Submitted</dt>
                <dd className="text-zinc-200 mt-1">
                  {new Date(row.submittedAt).toLocaleString("en-US", {
                    dateStyle: "medium",
                    timeStyle: "short",
                    timeZone: "America/New_York",
                  })}{" "}
                  ET
                </dd>
              </div>
              <div>
                <dt className="text-[10px] tracking-[0.18em] uppercase text-zinc-500">Source</dt>
                <dd className="text-zinc-200 mt-1">{row.source}</dd>
              </div>
              <div>
                <dt className="text-[10px] tracking-[0.18em] uppercase text-zinc-500">Reference ID</dt>
                <dd className="text-zinc-300 mt-1 font-mono text-[11px]">{row.id}</dd>
              </div>
            </dl>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
