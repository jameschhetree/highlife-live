"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Edit,
  CheckCircle,
  Send,
  ChevronDown,
  ChevronUp,
  Mail,
  Clock,
  Users,
  Trash,
} from "lucide-react";
import { useCampaigns, triggerStoreUpdate } from "@/hooks/useAdminStore";
import { updateCampaign, deleteCampaign } from "@/lib/admin-store";
import type { CampaignStatus } from "@/lib/admin-data";
import ConfirmDialog from "@/components/admin/ConfirmDialog";

const statusColor: Record<CampaignStatus, string> = {
  Draft: "text-zinc-400 bg-zinc-400/10 border-zinc-400/20",
  "Needs Approval": "text-amber-300 bg-amber-400/10 border-amber-400/20",
  Approved: "text-blue-300 bg-blue-400/10 border-blue-400/20",
  Running: "text-emerald-300 bg-emerald-400/10 border-emerald-400/20",
  Paused: "text-orange-300 bg-orange-400/10 border-orange-400/20",
  Completed: "text-purple-300 bg-purple-400/10 border-purple-400/20",
  Archived: "text-zinc-500 bg-zinc-500/10 border-zinc-500/20",
};

export default function CampaignDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const campaigns = useCampaigns();
  const campaign = campaigns.find((c) => c.id === id);
  const [expandedEmail, setExpandedEmail] = useState<number | null>(0);
  const [showDelete, setShowDelete] = useState(false);

  if (!campaign) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-display text-2xl uppercase mb-2">Campaign Not Found</h1>
          <Link href="/admin/campaigns" className="text-pink-300 text-sm hover:underline">Back to Campaigns</Link>
        </div>
      </div>
    );
  }

  const canApprove = campaign.status === "Draft" || campaign.status === "Needs Approval";
  const canSend = campaign.status === "Approved";

  function handleApprove() {
    updateCampaign(id, { status: "Approved", approvedBy: "James Carter" });
    triggerStoreUpdate();
  }

  function handleDelete() {
    deleteCampaign(id);
    triggerStoreUpdate();
    router.push("/admin/campaigns");
  }

  return (
    <div className="min-h-screen text-foreground">
      <div className="border-b border-white/8 px-6 lg:px-10 py-6">
        <Link href="/admin/campaigns" className="inline-flex items-center gap-1.5 text-[10px] tracking-[0.18em] uppercase text-zinc-500 hover:text-foreground mb-3 transition-colors">
          <ArrowLeft size={12} /> Back to Campaigns
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-display uppercase text-2xl lg:text-3xl tracking-tight">{campaign.name}</h1>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <span className={`text-[9px] tracking-[0.18em] uppercase border rounded-full px-2 py-0.5 ${statusColor[campaign.status]}`}>
                {campaign.status}
              </span>
              <span className="text-[11px] text-zinc-500">{campaign.id}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {canApprove && (
              <button onClick={handleApprove} className="btn-gradient px-4 py-2 rounded-xl text-sm font-semibold inline-flex items-center gap-2">
                <CheckCircle size={14} /> Approve
              </button>
            )}
            {canSend && (
              <button className="btn-gradient px-4 py-2 rounded-xl text-sm font-semibold inline-flex items-center gap-2">
                <Send size={14} /> Send Campaign
              </button>
            )}
            <button className="p-2 rounded-lg border border-white/8 hover:bg-white/4 text-zinc-400 hover:text-foreground transition-colors">
              <Edit size={14} />
            </button>
            <button onClick={() => setShowDelete(true)} className="p-2 rounded-lg border border-red-500/20 hover:bg-red-500/10 text-zinc-400 hover:text-red-400 transition-colors">
              <Trash size={14} />
            </button>
          </div>
        </div>
      </div>

      <div className="px-6 lg:px-10 py-8 space-y-8">
        {/* Approval Flow */}
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }} className="glass-card rounded-2xl p-5">
          <h2 className="text-[11px] tracking-[0.22em] uppercase text-zinc-300 mb-4">Approval Flow</h2>
          <div className="flex items-center gap-2 flex-wrap">
            {["Draft", "Needs Approval", "Approved", "Sent"].map((step, i) => {
              const steps: CampaignStatus[] = ["Draft", "Needs Approval", "Approved", "Running"];
              const currentIdx = steps.indexOf(campaign.status);
              const isComplete = i <= currentIdx;
              const isCurrent = i === currentIdx;
              return (
                <div key={step} className="flex items-center gap-2">
                  {i > 0 && <div className={`w-6 h-px ${isComplete ? "bg-pink-500" : "bg-white/10"}`} />}
                  <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] tracking-[0.18em] uppercase border ${
                    isCurrent
                      ? "text-pink-300 bg-pink-500/10 border-pink-500/30"
                      : isComplete
                      ? "text-emerald-300 bg-emerald-500/10 border-emerald-500/20"
                      : "text-zinc-500 bg-white/3 border-white/8"
                  }`}>
                    {isComplete && i < currentIdx && <CheckCircle size={10} />}
                    {step}
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.05, ease: [0.32, 0.72, 0, 1] }} className="glass-card rounded-2xl p-5">
              <h2 className="text-[11px] tracking-[0.22em] uppercase text-zinc-300 mb-4">Campaign Details</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  ["Artist", campaign.artistName],
                  ["Target Market", campaign.targetMarket],
                  ["Target Segment", campaign.targetSegment],
                  ["Objective", campaign.objective],
                  ["Platform", campaign.outreachPlatform],
                  ["Owner", campaign.owner],
                  ["Created", campaign.createdDate],
                  ["Approved By", campaign.approvedBy || "Pending"],
                  ["Sent Date", campaign.sentDate || "Not sent"],
                ].map(([label, value]) => (
                  <div key={label as string}>
                    <div className="text-[9px] tracking-[0.18em] uppercase text-zinc-600 mb-0.5">{label}</div>
                    <div className="text-sm text-zinc-300">{value}</div>
                  </div>
                ))}
              </div>
              {campaign.notes && (
                <div className="mt-4 pt-3 border-t border-white/6">
                  <div className="text-[9px] tracking-[0.18em] uppercase text-zinc-600 mb-1">Notes</div>
                  <p className="text-sm text-zinc-400">{campaign.notes}</p>
                </div>
              )}
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1, ease: [0.32, 0.72, 0, 1] }} className="space-y-3">
              <h2 className="text-[11px] tracking-[0.22em] uppercase text-zinc-300 flex items-center gap-2">
                <Mail size={14} className="text-pink-300" /> Email Sequence ({campaign.emailSequence.length} emails)
              </h2>
              {campaign.emailSequence.map((email, i) => (
                <div key={email.step} className="glass-card rounded-2xl overflow-hidden">
                  <button
                    onClick={() => setExpandedEmail(expandedEmail === i ? null : i)}
                    className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-white/3 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-white/8 flex items-center justify-center text-[10px] text-zinc-400 font-medium">
                        {email.step}
                      </div>
                      <div>
                        <div className="text-sm text-zinc-200">{email.label}</div>
                        <div className="text-[11px] text-zinc-500 flex items-center gap-2">
                          <Clock size={10} />
                          {email.delayDays === 0 ? "Immediate" : `+${email.delayDays} days`}
                        </div>
                      </div>
                    </div>
                    {expandedEmail === i ? <ChevronUp size={14} className="text-zinc-500" /> : <ChevronDown size={14} className="text-zinc-500" />}
                  </button>
                  {expandedEmail === i && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      transition={{ duration: 0.25 }}
                      className="px-5 pb-5 border-t border-white/6"
                    >
                      <div className="mt-4 space-y-3">
                        <div>
                          <div className="text-[9px] tracking-[0.18em] uppercase text-zinc-600 mb-1">Subject Line</div>
                          <div className="text-sm text-pink-200 font-medium">{email.subject}</div>
                        </div>
                        <div>
                          <div className="text-[9px] tracking-[0.18em] uppercase text-zinc-600 mb-1">Email Body</div>
                          <div className="text-sm text-zinc-400 leading-relaxed whitespace-pre-wrap bg-black/30 rounded-xl p-4 border border-white/4">
                            {email.body}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button className="px-3.5 py-2 rounded-lg border border-white/10 hover:border-white/25 bg-black/40 text-[10px] tracking-[0.18em] uppercase text-zinc-400 hover:text-foreground transition-colors">
                            Edit
                          </button>
                          <button className="px-3.5 py-2 rounded-lg border border-white/10 hover:border-white/25 bg-black/40 text-[10px] tracking-[0.18em] uppercase text-zinc-400 hover:text-foreground transition-colors">
                            Regenerate AI Draft
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              ))}
            </motion.div>
          </div>

          <div className="space-y-6">
            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.05, ease: [0.32, 0.72, 0, 1] }} className="glass-card rounded-2xl p-5 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Users size={14} className="text-pink-300" />
                <div className="text-[10px] tracking-[0.18em] uppercase text-zinc-500">Contacts</div>
              </div>
              <div className="font-display text-5xl text-gradient-hero leading-none mb-1">{campaign.contactCount}</div>
              <div className="text-[10px] text-zinc-500">in this campaign</div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1, ease: [0.32, 0.72, 0, 1] }} className="glass-card rounded-2xl p-5 space-y-3">
              <h2 className="text-[11px] tracking-[0.22em] uppercase text-zinc-300">Sequence Timing</h2>
              {campaign.emailSequence.map((email) => (
                <div key={email.step} className="flex items-center justify-between">
                  <span className="text-[10px] tracking-[0.18em] uppercase text-zinc-500">Email {email.step}</span>
                  <span className="text-xs text-zinc-300">
                    {email.delayDays === 0 ? "Day 0" : `Day ${email.delayDays}`}
                  </span>
                </div>
              ))}
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.15, ease: [0.32, 0.72, 0, 1] }} className="glass-card rounded-2xl p-5">
              <h2 className="text-[11px] tracking-[0.22em] uppercase text-zinc-300 mb-3">AI Draft Notice</h2>
              <p className="text-[11px] text-zinc-500 leading-relaxed">
                Email drafts were generated by AI and must be reviewed by a team member before approval. All outreach requires human approval before sending. No auto-send is enabled.
              </p>
            </motion.div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={showDelete}
        title="Delete Campaign"
        message={`Are you sure you want to delete "${campaign.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        danger
        onConfirm={handleDelete}
        onCancel={() => setShowDelete(false)}
      />
    </div>
  );
}
