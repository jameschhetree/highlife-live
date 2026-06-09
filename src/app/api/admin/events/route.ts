// GET  /api/admin/events  -- owner full, agent scoped to events with at least
//                            one of their assigned artists in featuredArtistIds.
//                            Agents cannot change published/isPast — gated in PATCH.
// POST /api/admin/events  -- owner-only create

import { prisma } from "@/lib/db";
import {
  getAdminEmailFromRequest,
  isOwnerAdminEmail,
} from "@/lib/admin-permissions";
import { isAgentLoginEmail } from "@/lib/admin-permissions-server";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!prisma) return Response.json({ error: "DB not connected" }, { status: 503 });
  const email = getAdminEmailFromRequest(request);
  const isOwner = isOwnerAdminEmail(email);
  const isAgent = !isOwner && (await isAgentLoginEmail(email));
  if (!isOwner && !isAgent) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const rows = await prisma.event.findMany({
    orderBy: [{ isPast: "asc" }, { startAt: "asc" }, { createdAt: "desc" }],
  });

  if (isOwner) return Response.json(rows);

  // Agent scope: only events whose featuredArtistIds intersects with this agent's assignments.
  const agent = await prisma.agentLogin.findFirst({
    where: { email, isActive: true },
    include: { artistAssignments: { select: { artistId: true } } },
  });
  if (!agent) return Response.json([]);
  const assigned = new Set(agent.artistAssignments.map((a) => a.artistId));
  const visible = rows.filter((e) => (e.featuredArtistIds ?? []).some((id) => assigned.has(id)));
  return Response.json(visible);
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
    featuredArtistIds?: string[];
    externalArtists?: string[];
    ticketStatus?: string;
    ticketUrl?: string;
    isPast?: boolean;
    published?: boolean;
    description?: string;
    showDescription?: boolean;
    address?: string;
    showAddress?: boolean;
    customBannerEnabled?: boolean;
    bannerUrl?: string;
    bookingId?: string;
    fromEventCardRequestId?: string;
  };

  const title = (body.title ?? "").trim();
  const date = (body.date ?? "").trim();
  const city = (body.city ?? "").trim();
  const venue = (body.venue ?? "").trim();
  if (!title || !date || !city || !venue) {
    return Response.json({ error: "title, date, city, venue are required" }, { status: 400 });
  }

  const featuredArtistIds = Array.isArray(body.featuredArtistIds)
    ? body.featuredArtistIds.filter((s): s is string => typeof s === "string")
    : [];
  const externalArtists = Array.isArray(body.externalArtists)
    ? body.externalArtists.filter((s): s is string => typeof s === "string")
    : [];

  // Back-compat: populate featuredArtists from DB names + externals (legacy field
  // is still read by some public surfaces — keep mirrored on write).
  let featuredArtistsMirror: string[] = [];
  if (featuredArtistIds.length > 0) {
    const artists = await prisma.artist.findMany({
      where: { id: { in: featuredArtistIds } },
      select: { name: true },
    });
    featuredArtistsMirror = artists.map((a) => a.name);
  }
  featuredArtistsMirror.push(...externalArtists);

  const row = await prisma.event.create({
    data: {
      title,
      date,
      startAt: body.startAt ? new Date(body.startAt) : null,
      city,
      venue,
      featuredArtists: featuredArtistsMirror.length > 0 ? featuredArtistsMirror : (body.featuredArtists ?? []),
      featuredArtistIds,
      externalArtists,
      ticketStatus: ["Available", "Limited", "Sold Out"].includes(body.ticketStatus ?? "")
        ? body.ticketStatus!
        : "Available",
      ticketUrl: body.ticketUrl?.trim() || null,
      isPast: Boolean(body.isPast),
      published: body.published !== false,
      description: body.description?.trim() || null,
      showDescription: body.showDescription !== false,
      address: body.address?.trim() || null,
      showAddress: body.showAddress !== false,
      customBannerEnabled: Boolean(body.customBannerEnabled),
      bannerUrl: body.bannerUrl?.trim() || null,
    },
  });

  // If linked to a Booking, set Booking.eventId so the inverse `event.booking`
  // accessor resolves.
  if (body.bookingId) {
    await prisma.booking.update({
      where: { id: body.bookingId },
      data: { eventId: row.id },
    });
  }

  // If created from an EventCardRequest, mark request status=Created.
  if (body.fromEventCardRequestId) {
    await prisma.eventCardRequest
      .update({ where: { id: body.fromEventCardRequestId }, data: { status: "Created" } })
      .catch(() => {
        /* non-fatal */
      });
  }

  return Response.json(row, { status: 201 });
}
