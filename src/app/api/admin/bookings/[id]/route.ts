// /api/admin/bookings/[id] — operational booking detail + edit.
// Owner: full read/write. Agent: must be the booking's agentLoginId or assigned
// to the booking's artist. Status field is read-allowed but no longer
// surfaced as workflow truth (Liam 3.9 lock).

import { prisma } from "@/lib/db";
import {
  getAdminEmailFromRequest,
  isOwnerAdminEmail,
} from "@/lib/admin-permissions";
import { isAgentLoginEmail } from "@/lib/admin-permissions-server";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

const EDITABLE_FIELDS = new Set([
  "eventTitle",
  "eventDescriptionPublic",
  "finalOffer",
  "ticketUrl",
  "ticketsSold",
  "eventDate",
  "artistId",
  "venueId",
  "venueName",
  "venueAddress",
  "contactName",
  "contactEmail",
  "contactPhone",
  "messageToAgent",
]);

async function loadBookingForCaller(id: string, callerEmail: string) {
  if (!prisma) return null;
  const b = await prisma.booking.findUnique({
    where: { id },
    include: {
      materials: { orderBy: { createdAt: "asc" } },
      event: { select: { id: true, title: true, published: true } },
      inquiry: { select: { id: true, inquiryNumber: true, status: true } },
    },
  });
  if (!b) return null;

  if (isOwnerAdminEmail(callerEmail)) return b;

  // Agent: must be the booking's agentLoginId OR the booking's artist must be assigned.
  const agent = await prisma.agentLogin.findFirst({
    where: { email: callerEmail, isActive: true },
    include: { artistAssignments: { select: { artistId: true } } },
  });
  if (!agent) return null;
  const ownsBooking = b.agentLoginId === agent.id;
  const artistAssigned = b.artistId && agent.artistAssignments.some((a) => a.artistId === b.artistId);
  if (!ownsBooking && !artistAssigned) return null;
  return b;
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  if (!prisma) return Response.json({ error: "DB not connected" }, { status: 503 });
  const email = getAdminEmailFromRequest(request);
  const isOwner = isOwnerAdminEmail(email);
  if (!isOwner && !(await isAgentLoginEmail(email))) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await context.params;
  const b = await loadBookingForCaller(id, email);
  if (!b) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json(b);
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  if (!prisma) return Response.json({ error: "DB not connected" }, { status: 503 });
  const email = getAdminEmailFromRequest(request);
  const isOwner = isOwnerAdminEmail(email);
  if (!isOwner && !(await isAgentLoginEmail(email))) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await context.params;
  const existing = await loadBookingForCaller(id, email);
  if (!existing) return Response.json({ error: "Not found" }, { status: 404 });

  const body = (await request.json()) as Record<string, unknown>;
  const patch: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(body)) {
    if (EDITABLE_FIELDS.has(k)) patch[k] = v;
  }
  if (Object.keys(patch).length === 0) {
    return Response.json({ error: "No editable fields" }, { status: 400 });
  }

  // If changing artistId on agent edit, enforce assignment scope.
  if ("artistId" in patch && !isOwner) {
    const agent = await prisma.agentLogin.findFirst({
      where: { email, isActive: true },
      include: { artistAssignments: { select: { artistId: true } } },
    });
    const allowed = agent?.artistAssignments.some((a) => a.artistId === patch.artistId);
    if (!allowed) {
      return Response.json({ error: "Cannot reassign to unassigned artist" }, { status: 403 });
    }
  }

  // Resolve artist name/slug if artistId changed
  if (patch.artistId && typeof patch.artistId === "string") {
    const a = await prisma.artist.findUnique({
      where: { id: patch.artistId },
      select: { name: true },
    });
    if (a) {
      patch.artistName = a.name;
      patch.artistSlug = a.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
    }
  }

  const updated = await prisma.booking.update({ where: { id }, data: patch });
  return Response.json(updated);
}
