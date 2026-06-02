// GET  /api/admin/events  -- owner-only list (includes unpublished)
// POST /api/admin/events  -- owner-only create

import { prisma } from "@/lib/db";
import { getAdminEmailFromRequest, isOwnerAdminEmail } from "@/lib/admin-permissions";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!prisma) return Response.json({ error: "DB not connected" }, { status: 503 });
  if (!isOwnerAdminEmail(getAdminEmailFromRequest(request))) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }
  const rows = await prisma.event.findMany({
    orderBy: [{ isPast: "asc" }, { startAt: "asc" }, { createdAt: "desc" }],
  });
  return Response.json(rows);
}

export async function POST(request: NextRequest) {
  if (!prisma) return Response.json({ error: "DB not connected" }, { status: 503 });
  if (!isOwnerAdminEmail(getAdminEmailFromRequest(request))) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = (await request.json()) as {
    title?: string;
    date?: string;
    startAt?: string;
    city?: string;
    venue?: string;
    featuredArtists?: string[];
    ticketStatus?: string;
    ticketUrl?: string;
    isPast?: boolean;
    published?: boolean;
  };

  const title = (body.title ?? "").trim();
  const date = (body.date ?? "").trim();
  const city = (body.city ?? "").trim();
  const venue = (body.venue ?? "").trim();
  if (!title || !date || !city || !venue) {
    return Response.json({ error: "title, date, city, venue are required" }, { status: 400 });
  }

  const row = await prisma.event.create({
    data: {
      title,
      date,
      startAt: body.startAt ? new Date(body.startAt) : null,
      city,
      venue,
      featuredArtists: Array.isArray(body.featuredArtists) ? body.featuredArtists.filter((s) => typeof s === "string") : [],
      ticketStatus: ["Available", "Limited", "Sold Out"].includes(body.ticketStatus ?? "")
        ? body.ticketStatus!
        : "Available",
      ticketUrl: body.ticketUrl?.trim() || null,
      isPast: Boolean(body.isPast),
      published: body.published !== false,
    },
  });
  return Response.json(row, { status: 201 });
}
