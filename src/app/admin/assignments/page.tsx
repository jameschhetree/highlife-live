"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { UserCog, RefreshCw, X, Music, Mail } from "lucide-react";
import { isOwnerAdmin, getAdminSession, type AdminSession } from "@/lib/admin-auth";

interface Audition {
  id: string;
  actStageName: string;
  fullName: string;
  classification: string;
  email: string;
  status: string;
  submittedAt: string;
}

interface AgentOption {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
}

interface AssignmentRow {
  id: string;
  auditionId: string;
  agentLoginId: string;
  status: string;
  assignedAt: string;
  agentLogin: { id: string; name: string; email: string };
}

// Phase 3.7 B-assignments-ux — Dok HL Live 2026-06-03:
// "assignments will be a list of all auditions, status will be assigned, unassigned, and archived,
//  click an unassigned status to change its assignment, clicking on status will open a pop up unless
//  archived, popup will be a small page with page that has all agent logins in blocks, similar to the
//  way roster is setup but in a popup, agent can be selected for assignment which is shown by agent
//  block being outlined with thematic gradient, have a selection for unassign audition"
// "remove assign button from assignments page"
// "archived auditions are hidden on auditions page & assignments page"

export default function AssignmentsPage() {
  const router = useRouter();
  const [session, setSession] = useState<AdminSession | null>(null);
  const [accessChecked, setAccessChecked] = useState(false);
  const [auditions, setAuditions] = useState<Audition[]>([]);
  const [assignments, setAssignments] = useState<AssignmentRow[]>([]);
  const [agents, setAgents] = useState<AgentOption[]>([]);
  const [loading, setLoading] = useState(false);

  // Popup state — open per audition
  const [popupAuditionId, setPopupAuditionId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const s = getAdminSession();
    if (!s || !isOwnerAdmin(s)) {
      router.replace("/admin");
      return;
    }
    setSession(s);
    setAccessChecked(true);
  }, [router]);

  const fetchData = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    try {
      const headers = { "x-admin-email": session.email };
      const [audRes, assignRes, agentRes] = await Promise.all([
        fetch("/api/admin/auditions", { headers }),
        fetch("/api/admin/assignments", { headers }),
        fetch("/api/admin/agent-logins", { headers }),
      ]);
      const [audData, assignData, agentData] = await Promise.all([
        audRes.ok ? audRes.json() : [],
        assignRes.ok ? assignRes.json() : [],
        agentRes.ok ? agentRes.json() : [],
      ]);
      setAuditions(Array.isArray(audData) ? audData : []);
      setAssignments(Array.isArray(assignData) ? assignData : []);
      setAgents(
        Array.isArray(agentData)
          ? agentData.map((a: AgentOption) => ({ id: a.id, name: a.name, email: a.email, isActive: a.isActive }))
          : []
      );
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    if (accessChecked) fetchData();
  }, [accessChecked, fetchData]);

  // Map auditionId -> assignment for O(1) lookup
  const assignmentByAuditionId = useMemo(() => {
    const m = new Map<string, AssignmentRow>();
    for (const a of assignments) m.set(a.auditionId, a);
    return m;
  }, [assignments]);

  // Phase 3.7 B6 — archived auditions hidden on assignments page.
  const visibleAuditions = useMemo(
    () => auditions.filter((a) => a.status !== "Archived"),
    [auditions]
  );

  const handleAssignTo = async (auditionId: string, agentLoginId: string) => {
    if (!session) return;
    setSaving(true);
    try {
      await fetch("/api/admin/assignments", {
        method: "PUT",
        headers: { "Content-Type": "application/json", "x-admin-email": session.email },
        body: JSON.stringify({ auditionId, agentLoginId }),
      });
      await fetchData();
      setPopupAuditionId(null);
    } finally {
      setSaving(false);
    }
  };

  const handleUnassign = async (auditionId: string) => {
    if (!session) return;
    setSaving(true);
    try {
      await fetch(`/api/admin/assignments?auditionId=${encodeURIComponent(auditionId)}`, {
        method: "DELETE",
        headers: { "x-admin-email": session.email },
      });
      await fetchData();
      setPopupAuditionId(null);
    } finally {
      setSaving(false);
    }
  };

  if (!accessChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="text-[10px] tracking-[0.3em] uppercase text-zinc-500">Checking access...</span>
      </div>
    );
  }

  const popupAudition = popupAuditionId ? visibleAuditions.find((a) => a.id === popupAuditionId) : null;
  const popupCurrentAssignment = popupAudition ? assignmentByAuditionId.get(popupAudition.id) : undefined;

  return (
    <div className="min-h-screen text-foreground">
      <div className="border-b border-white/8 px-4 sm:px-6 lg:px-10 py-6">
        <p className="text-[10px] tracking-[0.3em] uppercase text-zinc-500 mb-1">
          HighLife Live · Assignment Queue
        </p>
        <div className="flex items-center justify-between gap-3">
          <h1 className="font-display uppercase text-3xl tracking-tight">Assignments</h1>
          <button
            onClick={fetchData}
            disabled={loading}
            className="p-2 rounded-lg border border-white/10 hover:border-white/25 bg-black/40 text-zinc-300 hover:text-foreground transition-colors disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-10 py-6 space-y-5">
        <p className="text-[10px] tracking-[0.18em] uppercase text-zinc-500">
          {visibleAuditions.length} audition{visibleAuditions.length === 1 ? "" : "s"} · click a status to change it
        </p>

        {visibleAuditions.length === 0 ? (
          <div className="glass-card rounded-2xl p-12 text-center">
            <UserCog size={28} strokeWidth={1.5} className="mx-auto mb-4 text-zinc-600" />
            <p className="text-sm text-zinc-400">{loading ? "Loading..." : "No active auditions."}</p>
          </div>
        ) : (
          <div className="overflow-x-auto glass-card rounded-2xl">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/8">
                  <th className="text-left text-[9px] tracking-[0.18em] uppercase text-zinc-600 py-3 px-4 font-medium">Act</th>
                  <th className="text-left text-[9px] tracking-[0.18em] uppercase text-zinc-600 py-3 px-4 font-medium hidden md:table-cell">Classification</th>
                  <th className="text-left text-[9px] tracking-[0.18em] uppercase text-zinc-600 py-3 px-4 font-medium hidden lg:table-cell">Contact</th>
                  <th className="text-left text-[9px] tracking-[0.18em] uppercase text-zinc-600 py-3 px-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {visibleAuditions.map((aud, i) => {
                  const assignment = assignmentByAuditionId.get(aud.id);
                  const isAssigned = !!assignment;
                  return (
                    <motion.tr
                      key={aud.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25, delay: i * 0.015 }}
                      className="border-b border-white/4 last:border-0 hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="py-3 px-4">
                        <span className="text-foreground font-medium">{aud.actStageName}</span>
                        {aud.fullName && <span className="block text-[10px] text-zinc-500">{aud.fullName}</span>}
                      </td>
                      <td className="py-3 px-4 text-zinc-400 hidden md:table-cell">{aud.classification}</td>
                      <td className="py-3 px-4 hidden lg:table-cell">
                        <span className="text-[11px] text-zinc-400">{aud.email}</span>
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => setPopupAuditionId(aud.id)}
                          className={`inline-flex items-center gap-1.5 text-[10px] tracking-[0.18em] uppercase rounded-full px-3 py-1.5 border transition-colors ${
                            isAssigned
                              ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-300 hover:border-emerald-400/70 hover:bg-emerald-400/20"
                              : "border-amber-400/40 bg-amber-400/10 text-amber-300 hover:border-amber-400/70 hover:bg-amber-400/20"
                          }`}
                        >
                          {isAssigned ? `Assigned · ${assignment!.agentLogin.name}` : "Unassigned"}
                        </button>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Assignment popup — roster-style agent picker */}
      <AnimatePresence>
        {popupAudition && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
            onClick={() => setPopupAuditionId(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
              className="glass-card rounded-2xl p-6 sm:p-7 max-w-3xl w-full max-h-[85vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-4 mb-5">
                <div>
                  <p className="text-[10px] tracking-[0.18em] uppercase text-zinc-500 inline-flex items-center gap-1.5">
                    <Music size={10} className="text-pink-300" /> Assign Audition
                  </p>
                  <h2 className="font-display uppercase text-xl tracking-tight mt-1">{popupAudition.actStageName}</h2>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    {popupAudition.fullName} · {popupAudition.classification}
                  </p>
                </div>
                <button
                  onClick={() => setPopupAuditionId(null)}
                  className="p-2 rounded-lg border border-white/10 hover:border-white/25 text-zinc-400 hover:text-foreground transition-colors"
                  title="Close"
                >
                  <X size={14} />
                </button>
              </div>

              <p className="text-[11px] tracking-[0.18em] uppercase text-zinc-500 mb-3">
                Select an agent
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                {agents.filter((a) => a.isActive).map((agent) => {
                  const selected = popupCurrentAssignment?.agentLoginId === agent.id;
                  return (
                    <button
                      key={agent.id}
                      onClick={() => handleAssignTo(popupAudition.id, agent.id)}
                      disabled={saving}
                      className={`group relative p-4 rounded-2xl transition-all text-left ${
                        selected
                          ? "bg-white/8 ring-2 ring-offset-0"
                          : "bg-white/3 hover:bg-white/6 border border-white/8 hover:border-white/20"
                      }`}
                      style={selected ? {
                        // Thematic gradient outline via background-clip trick
                        backgroundImage:
                          "linear-gradient(rgba(255,255,255,0.04), rgba(255,255,255,0.04)), linear-gradient(90deg, #fde047, #ec4899, #a855f7, #38bdf8, #34d399, #fde047)",
                        backgroundOrigin: "border-box",
                        backgroundClip: "padding-box, border-box",
                        border: "2px solid transparent",
                      } : undefined}
                    >
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-pink-400/30 to-violet-400/30 inline-flex items-center justify-center mb-2.5">
                        <UserCog size={14} className="text-pink-200" />
                      </div>
                      <div className="text-sm font-medium text-foreground truncate">{agent.name}</div>
                      <div className="text-[10px] text-zinc-500 truncate mt-0.5">{agent.email}</div>
                      {selected && (
                        <span className="absolute top-2.5 right-2.5 text-[8px] tracking-[0.2em] uppercase text-emerald-300">current</span>
                      )}
                    </button>
                  );
                })}
                {agents.filter((a) => a.isActive).length === 0 && (
                  <p className="col-span-full text-xs text-zinc-500 italic p-4">No active agents. Create one in /admin/agent-logins.</p>
                )}
              </div>

              {/* Unassign option (separate row) */}
              {popupCurrentAssignment && (
                <div className="pt-3 border-t border-white/5">
                  <button
                    onClick={() => handleUnassign(popupAudition.id)}
                    disabled={saving}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-rose-500/30 hover:border-rose-500/60 bg-rose-500/10 text-rose-300 hover:text-rose-200 text-[10px] tracking-[0.18em] uppercase font-bold transition-colors disabled:opacity-50"
                  >
                    <Mail size={12} /> Unassign Audition
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
