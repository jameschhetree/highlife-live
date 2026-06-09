// /api/admin/event-card-requests — agent → owner queue for proposing public events.
// GET: list (owner sees all, agent sees only their own).
// POST: agent (or owner) creates a request, typically from a Booking detail page.
// Owners create real Events directly; agents propose via this queue.

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

  const where: Record<string, unknown> = {};
  if (isAgent) {
    const agent = await prisma.agentLogin.findFirst({
      where: { email, isActive: true },
      select: { id: true },
    });
    if (!agent) return Response.json([]);
    where.requestedByAgentLoginId = agent.id;
  }

  const rows = await prisma.eventCardRequest.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      requestedByAgent: { select: { id: true, email: true, name: true } },
      booking: { select: { id: true, artistName: true } },
      inquiry: { select: { id: true, inquiryNumber: true } },
    },
  });
  return Response.json(rows);
}

type CreateBody = {
  bookingId?: string;
  inquiryId?: string;
  artistIds?: string[];
  eventTitle: string;
  eventDate: string;
  venueName: string;
  venueAddress?: string;
  ticketLink?: string;
  description?: string;
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
  if (!body.eventTitle?.trim() || !body.eventDate?.trim() || !body.venueName?.trim()) {
    return Response.json(
      { error: "eventTitle, eventDate, venueName are required" },
      { status: 400 },
    );
  }

  // Identify requester. Agents authenticate via AgentLogin row; owners attach to
  // their AgentLogin if one exists, otherwise we need an owner row to satisfy the
  // required FK. If owner has no AgentLogin row, return a clear error.
  const requester = await prisma.agentLogin.findFirst({
    where: { email, isActive: true },
    select: { id: true },
  });
  if (!requester) {
    return Response.json(
      {
        error:
          "Requester must have an AgentLogin row. Owner: create one via /admin/agent-logins to file event card requests, or create the Event directly.",
      },
      { status: 400 },
    );
  }

  // If bookingId given, owner OR booking-owner agent only.
  if (body.bookingId && !isOwner) {
    const b = await prisma.booking.findUnique({
      where: { id: body.bookingId },
      select: { agentLoginId: true, artistId: true },
    });
    if (!b) return Response.json({ error: "Booking not found" }, { status: 404 });
    const owns = b.agentLoginId === requester.id;
    const agent = await prisma.agentLogin.findUnique({
      where: { id: requester.id },
      include: { artistAssignments: { select: { artistId: true } } },
    });
    const artistAssigned = b.artistId && agent?.artistAssignments.some((a) => a.artistId === b.artistId);
    if (!owns && !artistAssigned) {
      return Response.json({ error: "Cannot request event card on unauthorized booking" }, { status: 403 });
    }
  }

  const created = await prisma.eventCardRequest.create({
    data: {
      requestedByAgentLoginId: requester.id,
      bookingId: body.bookingId ?? null,
      inquiryId: body.inquiryId ?? null,
      artistIds: body.artistIds ?? [],
      eventTitle: body.eventTitle.trim(),
      eventDate: body.eventDate.trim(),
      venueName: body.venueName.trim(),
      venueAddress: body.venueAddress?.trim() || null,
      ticketLink: body.ticketLink?.trim() || null,
      description: body.description?.trim() || null,
      status: "Pending",
    },
  });

  return Response.json(created, { status: 201 });
}
