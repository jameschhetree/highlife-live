"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Mail, Phone, ArrowRight } from "lucide-react";
import { ScrollReveal } from "@/components/ScrollReveal";

const agents = [
  {
    name: "Jaco",
    role: "Founder & Head Agent",
    territories: "DC · Maryland · Virginia · Festivals & Cultural Programming",
    email: "jaco@highlifedmv.com",
    phone: "+1 (202) 555-0191",
  },
  {
    name: "Liam",
    role: "Founder & Head Agent",
    territories: "DMV · Northeast Corridor · Club & Lounge Programming",
    email: "liam@highlifedmv.com",
    phone: "+1 (202) 555-0192",
  },
  {
    name: "Arthur",
    role: "Booking Agent",
    territories: "Mid-Atlantic · Private Events & Brand Activations",
    email: "arthur@highlifedmv.com",
    phone: "+1 (202) 555-0193",
  },
];

export default function FindAnAgentPage() {
  return (
    <div className="bg-radial-atmosphere min-h-screen pt-32 pb-24">
      <div className="max-w-5xl mx-auto px-6 lg:px-8">
        <ScrollReveal>
          <span className="chip mb-6 inline-flex">For Venues & Promoters</span>
          <h1 className="font-display uppercase text-5xl sm:text-6xl md:text-7xl tracking-tight leading-[0.92] mb-6">
            <span className="text-gradient-hero">Find</span> an agent
          </h1>
          <p className="text-silver max-w-2xl text-base sm:text-lg leading-relaxed mb-12">
            Connect directly with the HighLife Records booking team. We take
            inquiries from venues, promoters, talent buyers, and event
            organizers — no artist or fan accounts required.
          </p>
        </ScrollReveal>

        <div className="grid md:grid-cols-2 gap-5">
          {agents.map((agent, i) => (
            <motion.div
              key={agent.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 + i * 0.1, ease: [0.32, 0.72, 0, 1] }}
              className="glass-card rounded-2xl p-7"
            >
              <div className="flex items-start gap-4 mb-5">
                <span className="relative w-12 h-12 inline-block shrink-0">
                  <Image src="/logo.png" alt="" fill sizes="48px" className="object-contain" />
                </span>
                <div>
                  <h3 className="font-display text-2xl uppercase tracking-wide leading-tight">
                    {agent.name}
                  </h3>
                  <p className="text-xs tracking-[0.18em] uppercase text-silver mt-1">
                    {agent.role}
                  </p>
                </div>
              </div>
              <p className="text-sm text-zinc-400 leading-relaxed mb-5">
                {agent.territories}
              </p>
              <div className="flex flex-col gap-2.5 text-sm">
                <a
                  href={`mailto:${agent.email}`}
                  className="flex items-center gap-3 text-zinc-300 hover:text-foreground transition-colors group"
                >
                  <Mail size={15} className="text-zinc-500 group-hover:text-pink-400 transition-colors" strokeWidth={1.5} />
                  {agent.email}
                </a>
                <a
                  href={`tel:${agent.phone.replace(/[^\d+]/g, "")}`}
                  className="flex items-center gap-3 text-zinc-300 hover:text-foreground transition-colors group"
                >
                  <Phone size={15} className="text-zinc-500 group-hover:text-pink-400 transition-colors" strokeWidth={1.5} />
                  {agent.phone}
                </a>
              </div>
            </motion.div>
          ))}
        </div>

        <ScrollReveal>
          <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/book"
              className="group inline-flex items-center gap-2.5 px-7 py-3.5 btn-gradient text-xs tracking-[0.18em] uppercase font-bold rounded-full"
            >
              Submit a Booking Request
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/roster"
              className="text-xs tracking-[0.18em] uppercase text-silver hover:text-foreground transition-colors"
            >
              Browse the Roster
            </Link>
          </div>
        </ScrollReveal>
      </div>
    </div>
  );
}
