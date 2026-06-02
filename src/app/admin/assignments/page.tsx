"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { UserCog, RefreshCw, Plus, CheckCircle } from "lucide-react";
import { isOwnerAdmin, getAdminSession, type AdminSession } from "@/lib/admin-auth";

interface AuditionForAssign {
  id: string;
  actStageName: string;
  fullName: string;
  classification: string;
  email: string;
  status: string;
}

interface AgentOption {
  id: string;
  name: string;
  email: string;
}

interface AssignmentRow {
  id: string;
  auditionId: string;
  agentLoginId: string;
  notes: string;
  status: string;
  assignedAt: string;
  agentLogin: { id: string; name: string; email: string };
  audition: { actStageName: string; fullName: string; classification: string; email: string } | null;
}

export default function AssignmentsPage() {
  const router = useRouter();
  const [session, setSession] = useState<AdminSession | null>(null);
  const [accessChecked, setAccessChecked] = useState(false);
  const [assignments, setAssignments] = useState<AssignmentRow[]>([]);
  const [auditions, setAuditions] = useState<AuditionForAssign[]>([]);
  const [agents, setAgents] = useState<AgentOption[]>([]);
  const [loading, setLoading] = useState(false);

  // Assign form
  const [showAssign, setShowAssign] = useState(false);
  const [selectedAudition, setSelectedAudition] = useState("");
  const [selectedAgent, setSelectedAgent] = useState("");
  const [assignNotes, setAssignNotes] = useState("");
  const [assigning, setAssigning] = useState(false);
  const [assignSuccess, setAssignSuccess] = useState(false);

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
      const [assignRes, audRes, agentRes] = await Promise.all([
        fetch("/api/admin/assignments", { headers: { "x-admin-email": session.email } }),
        fetch("/api/admin/auditions", { headers: { "x-admin-email": session.email } }),
        fetch("/api/admin/agent-logins", { headers: { "x-admin-email": session.email } }),
      ]);
      const [assignData, audData, agentData] = await Promise.all([
        assignRes.ok ? assignRes.json() : [],
        audRes.ok ? audRes.json() : [],
        agentRes.ok ? agentRes.json() : [],
      ]);
      setAssignments(Array.isArray(assignData) ? assignData : []);
      setAuditions(Array.isArray(audData) ? audData : []);
      setAgents(Array.isArray(agentData) ? agentData.map((a: AgentOption) => ({ id: a.id, name: a.name, email: a.email })) : []);
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    if (accessChecked) fetchData();
  }, [accessChecked, fetchData]);

  const handleAssign = async () => {
    if (!session || !selectedAudition || !selectedAgent) return;
    setAssigning(true);
    try {
      const res = await fetch("/api/admin/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-email": session.email },
        body: JSON.stringify({ auditionId: selectedAudition, agentLoginId: selectedAgent, notes: assignNotes }),
      });
      if (res.ok) {
        setAssignSuccess(true);
        setShowAssign(false);
        setSelectedAudition("");
        setSelectedAgent("");
        setAssignNotes("");
        fetchData();
        setTimeout(() => setAssignSuccess(false), 3000);
      }
    } finally {
      setAssigning(false);
    }
  };

  // Unassigned auditions (not yet in assignments)
  const assignedAuditionIds = new Set(assignments.map((a) => a.auditionId));
  const unassignedAuditions = auditions.filter((a) => !assignedAuditionIds.has(a.id));

  if (!accessChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="text-[10px] tracking-[0.3em] uppercase text-zinc-500">Checking access...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-foreground">
      <div className="border-b border-white/8 px-4 sm:px-6 lg:px-10 py-6">
        <p className="text-[10px] tracking-[0.3em] uppercase text-zinc-500 mb-1">
          HighLife Live · Assignment Queue
        </p>
        <div className="flex items-center justify-between gap-3">
          <h1 className="font-display uppercase text-3xl tracking-tight">Assignments</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAssign(!showAssign)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border border-white/10 hover:border-white/25 bg-black/40 text-zinc-300 hover:text-foreground transition-colors text-[10px] tracking-[0.18em] uppercase"
            >
              <Plus size={13} /> Assign
            </button>
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
      </div>

      <div className="px-4 sm:px-6 lg:px-10 py-6 space-y-6">
        {assignSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 px-4 py-3 rounded-xl border border-emerald-500/30 bg-emerald-500/5 text-emerald-300 text-sm"
          >
            <CheckCircle size={14} /> Assignment created and notification email sent.
          </motion.div>
        )}

        {/* Assign form */}
        {showAssign && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="glass-card rounded-2xl p-5 space-y-4"
          >
            <h2 className="text-[11px] tracking-[0.22em] uppercase text-zinc-300">New Assignment</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[9px] tracking-[0.18em] uppercase text-zinc-600 block mb-1">Audition</label>
                <select
                  value={selectedAudition}
                  onChange={(e) => setSelectedAudition(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-pink-400/60 appearance-none"
                >
                  <option value="">Select audition...</option>
                  {unassignedAuditions.map((a) => (
                    <option key={a.id} value={a.id}>{a.actStageName} ({a.classification})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[9px] tracking-[0.18em] uppercase text-zinc-600 block mb-1">Agent</label>
                <select
                  value={selectedAgent}
                  onChange={(e) => setSelectedAgent(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-pink-400/60 appearance-none"
                >
                  <option value="">Select agent...</option>
                  {agents.map((a) => (
                    <option key={a.id} value={a.id}>{a.name} ({a.email})</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="text-[9px] tracking-[0.18em] uppercase text-zinc-600 block mb-1">Notes (optional)</label>
              <textarea
                value={assignNotes}
                onChange={(e) => setAssignNotes(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-pink-400/60 resize-y"
                rows={2}
              />
            </div>
            <button
              onClick={handleAssign}
              disabled={assigning || !selectedAudition || !selectedAgent}
              className="px-5 py-2.5 rounded-full btn-gradient text-xs tracking-[0.18em] uppercase font-bold disabled:opacity-50"
            >
              {assigning ? "Assigning..." : "Create Assignment"}
            </button>
          </motion.div>
        )}

        {/* Existing assignments */}
        <p className="text-[10px] tracking-[0.18em] uppercase text-zinc-500">
          {assignments.length} assignment{assignments.length === 1 ? "" : "s"}
        </p>

        {assignments.length === 0 ? (
          <div className="glass-card rounded-2xl p-12 text-center">
            <UserCog size={28} strokeWidth={1.5} className="mx-auto mb-4 text-zinc-600" />
            <p className="text-sm text-zinc-400">No assignments yet. Assign auditions to agents above.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/8">
                  <th className="text-left text-[9px] tracking-[0.18em] uppercase text-zinc-600 pb-3 px-2.5 sm:px-4 font-medium">Act</th>
                  <th className="text-left text-[9px] tracking-[0.18em] uppercase text-zinc-600 pb-3 px-2.5 sm:px-4 font-medium hidden md:table-cell">Classification</th>
                  <th className="text-left text-[9px] tracking-[0.18em] uppercase text-zinc-600 pb-3 px-2.5 sm:px-4 font-medium">Agent</th>
                  <th className="text-left text-[9px] tracking-[0.18em] uppercase text-zinc-600 pb-3 px-2.5 sm:px-4 font-medium">Status</th>
                  <th className="text-left text-[9px] tracking-[0.18em] uppercase text-zinc-600 pb-3 px-2.5 sm:px-4 font-medium hidden lg:table-cell">Assigned</th>
                </tr>
              </thead>
              <tbody>
                {assignments.map((a, i) => (
                  <motion.tr
                    key={a.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: i * 0.02 }}
                    className="border-b border-white/4 hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="py-3 px-2.5 sm:px-4">
                      <span className="text-foreground font-medium">{a.audition?.actStageName || "Unknown"}</span>
                      {a.audition?.fullName && <span className="block text-[10px] text-zinc-500">{a.audition.fullName}</span>}
                    </td>
                    <td className="py-3 px-2.5 sm:px-4 text-zinc-400 hidden md:table-cell">{a.audition?.classification || "-"}</td>
                    <td className="py-3 px-2.5 sm:px-4">
                      <span className="text-zinc-200">{a.agentLogin.name}</span>
                      <span className="block text-[10px] text-zinc-500">{a.agentLogin.email}</span>
                    </td>
                    <td className="py-3 px-2.5 sm:px-4">
                      <span className="text-[9px] tracking-[0.18em] uppercase text-sky-300 bg-sky-400/10 border border-sky-400/20 rounded-full px-2.5 py-0.5">
                        {a.status}
                      </span>
                    </td>
                    <td className="py-3 px-2.5 sm:px-4 text-zinc-500 text-xs hidden lg:table-cell">
                      {new Date(a.assignedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
