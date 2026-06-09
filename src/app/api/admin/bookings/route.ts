// /api/admin/bookings — operational booking layer for Phase 3.9.
// GET: scoped list (owner = all, agent = only bookings on assigned artists).
//      Status field is intentionally NOT returned in list responses (Liam lock —
//      Booking.status retired as workflow truth in 3.9 even though the column
//      stays for back-compat).
// POST: create a new booking. Owner can create any; agent only for assigned artists.

import { prisma } from "@/lib/db";
import {
  getAdminEmailFromRequest,
  isOwnerAdminEmail,
} from "@/lib/admin-permissions";
import { isAgentLoginEmail } from "@/lib/admin-permissions-server";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

async function getAgentScope(email: string) {
  if (!prisma) return null;
  const agent = await prisma.agentLogin.findFirst({
    where: { email, isActive: true },
    include: { artistAssignments: true },
  });
  if (!agent) return null;
  const artistIds = agent.artistAssignments.map((a) => a.artistId);
  return { agentLoginId: agent.id, artistIds };
}

export async function GET(request: NextRequest) {
  if (!prisma) return Response.json({ error: "DB not connected" }, { status: 503 });
  const email = getAdminEmailFromRequest(request);
  const isOwner = isOwnerAdminEmail(email);
  const isAgent = !isOwner && (await isAgentLoginEmail(email));
  if (!isOwner && !isAgent) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const where: Record<string, unknown> = {};
  let agentArtistIds: string[] = [];
  if (isAgent) {
    const scope = await getAgentScope(email);
    if (!scope) return Response.json([]);
    agentArtistIds = scope.artistIds;
  }

  const rows = await prisma.booking.findMany({
    where,
    orderBy: { submittedAt: "desc" },
    select: {
      id: true,
      artistSlug: true,
      artistName: true,
      artistId: true,
      venueName: true,
      venueAddress: true,
      venueId: true,
      eventDate: true,
      eventTitle: true,
      finalOffer: true,
      proposedOffer: true,
      ticketUrl: true,
      ticketsSold: true,
      contactName: true,
      contactEmail: true,
      inquiryId: true,
      eventId: true,
      source: true,
      submittedAt: true,
    },
  });

  // For agents, restrict to bookings whose artist is in their assignments.
  // Match by artistId when present; fall back to artistSlug/name match for legacy rows.
  const filtered = isAgent
    ? rows.filter((r) => {
        if (r.artistId && agentArtistIds.includes(r.artistId)) return true;
        // legacy rows without artistId — flag as "view-restricted" by hiding for now
        return false;
      })
    : rows;

  // Mark per-row openability so the list UI can render closed rows distinctly.
  // Agents already filtered above, so all returned rows are openable.
  return Response.json(filtered.map((r) => ({ ...r, canOpen: true })));
}

type CreateBody = {
  inquiryId?: string;
  artistId?: string;
  artistSlug?: string;
  artistName?: string;
  venueId?: string;
  venueName?: string;
  venueAddress?: string;
  eventDate?: string;
  eventTitle?: string;
  eventDescriptionPublic?: string;
  finalOffer?: string;
  ticketUrl?: string;
  ticketsSold?: number;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  messageToAgent?: string;
};

export async function POST(request: NextRequest) {
  if (!prisma) return Response.json({ error: "DB not connected" }, { status: 503 });
  const email = getAdminEmailFromRequest(request);
  const isOwner = isOwnerAdminEmail(email);
  const isAgent = !isOwner && (await isAgentLoginEmail(email));
  if (!isOwner && !isAgent) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await request.json()) as CreateBody;

  // Agent scope check — artistId must be in their assignments.
  let agentLoginId: string | null = null;
  if (isAgent) {
    const scope = await getAgentScope(email);
    if (!scope) return Response.json({ error: "Agent has no scope" }, { status: 403 });
    if (!body.artistId || !scope.artistIds.includes(body.artistId)) {
      return Response.json(
        { error: "You can only create bookings for your assigned artists." },
        { status: 403 },
      );
    }
    agentLoginId = scope.agentLoginId;
  }

  // If artistId is given, resolve name/slug from DB (so the booking doesn't drift).
  let artistSlug = body.artistSlug ?? "";
  let artistName = body.artistName ?? "";
  if (body.artistId) {
    const a = await prisma.artist.findUnique({
      where: { id: body.artistId },
      select: { name: true },
    });
    if (a) {
      artistName = a.name;
      artistSlug =
        body.artistSlug ||
        a.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    }
  }

  const created = await prisma.booking.create({
    data: {
      artistSlug,
      artistName,
      artistId: body.artistId ?? null,
      venueId: body.venueId ?? null,
      venueName: body.venueName ?? "",
      venueAddress: body.venueAddress ?? "",
      eventDate: body.eventDate ?? "",
      eventTitle: body.eventTitle ?? null,
      eventDescription: body.messageToAgent ?? "",
      eventDescriptionPublic: body.eventDescriptionPublic ?? null,
      finalOffer: body.finalOffer ?? null,
      proposedOffer: "", // legacy column kept for compat
      ticketUrl: body.ticketUrl ?? null,
      ticketsSold: body.ticketsSold ?? 0,
      contactName: body.contactName ?? "",
      contactEmail: body.contactEmail ?? "",
      contactPhone: body.contactPhone ?? "",
      messageToAgent: body.messageToAgent ?? "",
      source: isOwner ? "owner_create" : "agent_create",
      inquiryId: body.inquiryId ?? null,
      agentLoginId,
    },
  });

  return Response.json(created, { status: 201 });
}
