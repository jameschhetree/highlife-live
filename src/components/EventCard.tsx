"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Calendar, MapPin, Users } from "lucide-react";
import type { Event } from "@/lib/data";

interface EventCardProps {
  event: Event;
  index?: number;
}

const statusColors = {
  Available: "bg-foreground/90 text-background",
  Limited: "bg-silver/20 text-silver border border-silver/30",
  "Sold Out": "bg-muted/30 text-muted",
};

export function EventCard({ event, index = 0 }: EventCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: index * 0.08, ease: [0.32, 0.72, 0, 1] }}
      className="group relative border border-border/40 bg-card hover:border-border hover:bg-card-hover transition-all duration-500"
    >
      {/* Top Bar */}
      <div className="h-px bg-gradient-to-r from-transparent via-silver/30 to-transparent" />

      <div className="p-6 lg:p-8">
        <div className="flex items-start justify-between mb-4">
          <div>
            <span className="text-[10px] tracking-[0.2em] uppercase text-muted block mb-2">
              {event.isPast ? "Past Event" : "Upcoming"}
            </span>
            <h3 className="font-serif text-2xl font-medium tracking-wide">
              {event.title}
            </h3>
          </div>
          <span
            className={`text-[10px] tracking-[0.2em] uppercase px-3 py-1 ${statusColors[event.ticketStatus]}`}
          >
            {event.ticketStatus}
          </span>
        </div>

        <div className="flex flex-wrap gap-4 mb-5 text-sm text-silver">
          <span className="flex items-center gap-1.5">
            <Calendar size={13} strokeWidth={1.5} />
            {event.date}
          </span>
          <span className="flex items-center gap-1.5">
            <MapPin size={13} strokeWidth={1.5} />
            {event.city}
          </span>
          <span className="flex items-center gap-1.5">
            <Users size={13} strokeWidth={1.5} />
            {event.venue}
          </span>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          {event.featuredArtists.map((artist) => (
            <span
              key={artist}
              className="text-xs tracking-wide px-3 py-1 bg-soft-gray text-silver border border-border/50"
            >
              {artist}
            </span>
          ))}
        </div>

        {!event.isPast && event.ticketStatus !== "Sold Out" && (
          <Link
            href="/book"
            className="inline-flex items-center gap-2 text-xs tracking-[0.15em] uppercase bg-foreground text-background px-5 py-2.5 hover:bg-foreground/90 transition-colors duration-300"
          >
            Request Access
          </Link>
        )}
      </div>
    </motion.div>
  );
}
