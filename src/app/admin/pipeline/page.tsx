"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { GripVertical } from "lucide-react";
import { useOpportunities, triggerStoreUpdate } from "@/hooks/useAdminStore";
import { updateOpportunity } from "@/lib/admin-store";
import type { OpportunityStatus, AdminOpportunity } from "@/lib/admin-data";

const columns: OpportunityStatus[] = [
  "Lead",
  "Contacted",
  "Replied",
  "Interested",
  "Negotiating",
  "Contract Pending",
  "Booked",
  "Lost",
];

const columnColor: Record<string, string> = {
  Lead: "border-t-zinc-500",
  Contacted: "border-t-blue-400",
  Replied: "border-t-cyan-400",
  Interested: "border-t-amber-400",
  Negotiating: "border-t-orange-400",
  "Contract Pending": "border-t-purple-400",
  Booked: "border-t-emerald-400",
  Lost: "border-t-red-400",
};

const feeColor: Record<string, string> = {
  Lead: "text-zinc-400",
  Contacted: "text-blue-300",
  Replied: "text-cyan-300",
  Interested: "text-amber-300",
  Negotiating: "text-orange-300",
  "Contract Pending": "text-purple-300",
  Booked: "text-emerald-300",
  Lost: "text-red-400",
};

function PipelineCard({
  opp,
  onDragStart,
}: {
  opp: AdminOpportunity;
  onDragStart: (id: string) => void;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.25 }}
      draggable
      onDragStart={() => onDragStart(opp.id)}
      className="glass-card rounded-xl p-3 cursor-grab active:cursor-grabbing hover:border-white/16 transition-colors group"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="text-xs font-medium text-zinc-200 group-hover:text-pink-200 transition-colors">
          {opp.artistName}
        </div>
        <GripVertical size={12} className="text-zinc-600 shrink-0 mt-0.5" />
      </div>
      <div className="text-[11px] text-zinc-500 mb-2">{opp.venueName}</div>
      <div className="flex items-center justify-between">
        <span className={`text-xs font-medium ${feeColor[opp.status]}`}>
          ${opp.expectedFee.toLocaleString()}
        </span>
        <span className="text-[9px] text-zinc-600">{opp.probability}%</span>
      </div>
      {opp.eventDate && (
        <div className="text-[10px] text-zinc-600 mt-1.5 pt-1.5 border-t border-white/6">
          {opp.eventDate}
        </div>
      )}
      <div className="text-[10px] text-zinc-600 mt-1 truncate" title={opp.nextTask}>
        {opp.nextTask}
      </div>
    </motion.div>
  );
}

export default function PipelinePage() {
  const opportunities = useOpportunities();
  const [dragId, setDragId] = useState<string | null>(null);

  const getColumnOpps = (status: OpportunityStatus) =>
    opportunities.filter((o) => o.status === status);

  const totalValue = opportunities
    .filter((o) => o.status !== "Lost")
    .reduce((sum, o) => sum + o.expectedFee, 0);

  const bookedValue = opportunities
    .filter((o) => o.status === "Booked")
    .reduce((sum, o) => sum + (o.confirmedFee || o.expectedFee), 0);

  const handleDrop = useCallback(
    (newStatus: OpportunityStatus) => {
      if (!dragId) return;
      const opp = opportunities.find((o) => o.id === dragId);
      if (!opp || opp.status === newStatus) {
        setDragId(null);
        return;
      }
      const probabilityMap: Partial<Record<OpportunityStatus, number>> = {
        Lead: 10,
        Contacted: 20,
        Replied: 30,
        Interested: 40,
        Negotiating: 60,
        "Contract Pending": 90,
        Booked: 100,
        Lost: 0,
      };
      updateOpportunity(dragId, {
        status: newStatus,
        probability: probabilityMap[newStatus] ?? opp.probability,
      });
      triggerStoreUpdate();
      setDragId(null);
    },
    [dragId, opportunities]
  );

  return (
    <div className="min-h-screen text-foreground">
      <div className="border-b border-white/8 px-4 sm:px-6 lg:px-10 py-6">
        <p className="text-[10px] tracking-[0.3em] uppercase text-zinc-500 mb-1">
          HighLife Live · Booking Pipeline
        </p>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <h1 className="font-display uppercase text-3xl tracking-tight">Pipeline</h1>
          <div className="flex items-center gap-6">
            <div className="text-right">
              <div className="text-[9px] tracking-[0.18em] uppercase text-zinc-500">Pipeline Value</div>
              <div className="font-display text-xl text-gradient-hero">${totalValue.toLocaleString()}</div>
            </div>
            <div className="text-right">
              <div className="text-[9px] tracking-[0.18em] uppercase text-zinc-500">Booked</div>
              <div className="font-display text-xl text-emerald-300">${bookedValue.toLocaleString()}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-10 py-6">
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-3 min-w-[1200px]">
            {columns.map((col) => {
              const opps = getColumnOpps(col);
              const colTotal = opps.reduce((s, o) => s + o.expectedFee, 0);
              return (
                <div
                  key={col}
                  className="flex-1 min-w-[160px]"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => handleDrop(col)}
                >
                  <div className={`rounded-xl border border-white/6 border-t-2 ${columnColor[col]} bg-white/2 p-2 min-h-[300px]`}>
                    <div className="px-2 py-2 mb-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] tracking-[0.18em] uppercase text-zinc-400 font-medium">
                          {col}
                        </span>
                        <span className="text-[9px] tracking-[0.18em] uppercase text-zinc-600 bg-white/6 rounded-full px-1.5 py-0.5">
                          {opps.length}
                        </span>
                      </div>
                      {colTotal > 0 && (
                        <div className="text-[10px] text-zinc-600 mt-0.5">
                          ${colTotal.toLocaleString()}
                        </div>
                      )}
                    </div>
                    <div className="space-y-2 min-h-[100px]">
                      {opps.map((opp) => (
                        <PipelineCard key={opp.id} opp={opp} onDragStart={setDragId} />
                      ))}
                      {opps.length === 0 && (
                        <div className="text-[10px] text-zinc-700 text-center py-6">
                          No deals
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
