"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Search, RefreshCw, Mic, ExternalLink } from "lucide-react";
import { canViewAuditions, getAdminSession, type AdminSession } from "@/lib/admin-auth";

interface Audition {
  id: string;
  classification: string;
  actStageName: string;
  fullName: string;
  email: string;
  phone: string;
  status: string;
  source: string;
  submittedAt: string;
  uploads: unknown;
}

const STATUS_FILTERS = ["All", "New", "Reviewed", "Replied", "Booked", "Lost"];

const STATUS_COLOR: Record<string, { bg: string; text: string; border: string }> = {
  New: { bg: "bg-amber-400/10", text: "text-amber-300", border: "border-amber-400/30" },
  Reviewed: { bg: "bg-sky-400/10", text: "text-sky-300", border: "border-sky-400/30" },
  Replied: { bg: "bg-violet-400/10", text: "text-violet-300", border: "border-violet-400/30" },
  Booked: { bg: "bg-emerald-400/10", text: "text-emerald-300", border: "border-emerald-400/30" },
  Lost: { bg: "bg-rose-400/10", text: "text-rose-300", border: "border-rose-400/30" },
};

export default function AuditionsPage() {
  const router = useRouter();
  const [session, setSession] = useState<AdminSession | null>(null);
  const [accessChecked, setAccessChecked] = useState(false);
  const [rows, setRows] = useState<Audition[]>([]);
  const [status, setStatus] = useState("All");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchRows = async () => {
    if (!session || !canViewAuditions(session)) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (status !== "All") params.set("status", status);
      if (search.trim()) params.set("q", search.trim());
      const res = await fetch(`/api/admin/auditions?${params}`, {
        headers: { "x-admin-email": session.email },
      });
      const data = await res.json();
      setRows(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const current = getAdminSession();
    if (!current || !canViewAuditions(current)) {
      router.replace("/admin");
      return;
    }
    setSession(current);
    setAccessChecked(true);
  }, [router]);

  useEffect(() => {
    if (accessChecked) fetchRows();
  }, [accessChecked, status]); // eslint-disable-line react-hooks/exhaustive-deps

  const newCount = rows.filter((r) => r.status === "New").length;

  if (!accessChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="text-[10px] tracking-[0.3em] uppercase text-zinc-500">Checking access...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-foreground">
      <div className="border-b border-white/8 px-6 lg:px-10 py-6">
        <p className="text-[10px] tracking-[0.3em] uppercase text-zinc-500 mb-1">
          HighLife Live · Auditions Pipeline
        </p>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h1 className="font-display uppercase text-3xl tracking-tight">Auditions</h1>
            {newCount > 0 && (
              <span className="inline-flex items-center gap-1 text-[10px] tracking-[0.18em] uppercase text-pink-200 bg-pink-500/15 border border-pink-500/30 rounded-full px-2.5 py-1">
                {newCount} New
              </span>
            )}
          </div>
          <button
            onClick={fetchRows}
            disabled={loading}
            className="p-2 rounded-lg border border-white/10 hover:border-white/25 bg-black/40 text-zinc-300 hover:text-foreground transition-colors disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      <div className="px-6 lg:px-10 py-6 space-y-5">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && fetchRows()}
              placeholder="Search by act name, full name, or email..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white/4 border border-white/8 text-sm text-foreground placeholder:text-zinc-500 focus:outline-none focus:border-pink-500/40"
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {STATUS_FILTERS.map((s) => (
              <button
                key={s}
                onClick={() => setStatus(s)}
                className={`text-[10px] tracking-[0.18em] uppercase px-3 py-2 rounded-full border transition-colors ${
                  status === s
                    ? "bg-foreground text-background border-foreground"
                    : "bg-transparent text-zinc-300 border-white/10 hover:border-white/25 hover:text-foreground"
                }`}
              >
                {s}
                {s !== "All" && rows.filter((r) => r.status === s).length > 0 && status === "All" && (
                  <span className="ml-1.5 text-pink-300">
                    {rows.filter((r) => r.status === s).length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        <p className="text-[10px] tracking-[0.18em] uppercase text-zinc-500">
          {rows.length} audition{rows.length === 1 ? "" : "s"}
        </p>

        {rows.length === 0 ? (
          <div className="glass-card rounded-2xl p-12 text-center">
            <Mic size={28} strokeWidth={1.5} className="mx-auto mb-4 text-zinc-600" />
            <p className="text-sm text-zinc-400">
              {loading ? "Loading..." : "No auditions match the current filter."}
            </p>
          </div>
        ) : (
          <div className="glass-card rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[10px] tracking-[0.18em] uppercase text-zinc-500 border-b border-white/8">
                    <th className="text-left font-normal px-4 py-3">Act</th>
                    <th className="text-left font-normal px-4 py-3 hidden md:table-cell">Classification</th>
                    <th className="text-left font-normal px-4 py-3 hidden lg:table-cell">Contact</th>
                    <th className="text-left font-normal px-4 py-3">Files</th>
                    <th className="text-left font-normal px-4 py-3">Status</th>
                    <th className="text-left font-normal px-4 py-3 hidden lg:table-cell">Submitted</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => {
                    const sc = STATUS_COLOR[row.status] ?? {
                      bg: "bg-zinc-400/10",
                      text: "text-zinc-400",
                      border: "border-zinc-400/30",
                    };
                    const uploadCount = Array.isArray(row.uploads) ? row.uploads.length : 0;
                    return (
                      <motion.tr
                        key={row.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.25, delay: i * 0.02 }}
                        className="border-b border-white/4 last:border-0 hover:bg-white/4 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <Link
                            href={`/admin/auditions/${row.id}`}
                            className="flex flex-col group"
                          >
                            <span className="text-zinc-200 group-hover:text-foreground font-medium">
                              {row.actStageName}
                            </span>
                            <span className="text-[10px] text-zinc-500 mt-0.5">{row.fullName}</span>
                          </Link>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell text-zinc-400 text-[11px]">
                          {row.classification}
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell">
                          <span className="text-zinc-300 text-[11px] block">{row.email}</span>
                          <span className="text-zinc-500 text-[10px]">{row.phone}</span>
                        </td>
                        <td className="px-4 py-3 text-zinc-300 text-[11px]">
                          {uploadCount > 0 ? `${uploadCount} file${uploadCount === 1 ? "" : "s"}` : "—"}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`text-[10px] tracking-[0.18em] uppercase rounded-full px-2.5 py-1 border ${sc.bg} ${sc.text} ${sc.border}`}
                          >
                            {row.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell text-zinc-500 text-[11px]">
                          {new Date(row.submittedAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="pt-2 text-[10px] tracking-[0.18em] uppercase text-zinc-600 flex items-center gap-2">
          <ExternalLink size={11} />
          Public submission form: /findanagent
        </div>
      </div>
    </div>
  );
}
