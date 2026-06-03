// POST /api/admin/inquiries/[id]/finalize
// Owner-admin: turn an inquiry into a published Event.
// Creates an Event row, marks the Inquiry as Booked, links convertedEventId.
// Idempotent: if already converted, returns the existing Event without creating a duplicate.

import { prisma } from "@/lib/db";
import { isOwnerAdminEmail, getAdminEmailFromRequest } from "@/lib/admin-permissions";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

function parseStartAt(eventDate: string): Date | null {
  if (!eventDate) return null;
  const d = new Date(eventDate);
  return Number.isNaN(d.getTime()) ? null : d;
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  if (!prisma) return Response.json({ error: "DB not connected" }, { status: 503 });
  const adminEmail = getAdminEmailFromRequest(request);
  if (!isOwnerAdminEmail(adminEmail)) {
    return Response.json({ error: "Forbidden — owner-admin only" }, { status: 403 });
  }

  const { id } = await context.params;
  const inq = await prisma.inquiry.findUnique({ where: { id } });
  if (!inq) return Response.json({ error: "Inquiry not found" }, { status: 404 });

  // Idempotency
  if (inq.convertedEventId) {
    const existing = await prisma.event.findUnique({ where: { id: inq.convertedEventId } });
    return Response.json({ ok: true, event: existing, created: false });
  }

  const body = (await request.json().catch(() => ({}))) as {
    title?: string;
    city?: string;
    venue?: string;
    featuredArtists?: string[];
    ticketStatus?: string;
    ticketUrl?: string;
    published?: boolean;
  };

  // Derive sensible defaults from the inquiry. Caller can override per body.
  const city = body.city ?? inq.venueAddress.split(",")[1]?.trim() ?? "";
  const venueName = body.venue ?? inq.venueName;
  const title = body.title ?? `${inq.artistName} at ${venueName}`;
  const startAt = parseStartAt(inq.eventDate);

  const event = await prisma.event.create({
    data: {
      title,
      date: inq.eventDate,
      startAt: startAt,
      city,
      venue: venueName,
      featuredArtists: body.featuredArtists ?? [inq.artistName],
      ticketStatus: body.ticketStatus ?? "Available",
      ticketUrl: body.ticketUrl ?? null,
      isPast: false,
      published: body.published ?? true,
    },
  });

  await prisma.inquiry.update({
    where: { id },
    data: {
      status: "Booked",
      convertedEventId: event.id,
    },
  });

  await prisma.auditLog.create({
    data: {
      action: "inquiry_finalized_as_event",
      entityType: "inquiry",
      entityId: inq.id,
      userId: adminEmail,
      details: { eventId: event.id, eventTitle: event.title, inquiryNumber: inq.inquiryNumber },
    },
  });

  return Response.json({ ok: true, event, created: true });
}
