// Venue-partner-scoped inquiry detail.
// GET → return full inquiry IF the caller's venue session owns it. bookingOffer is
//       stripped (date + artist + bookingOffer are read-only per Phase 3.6 spec but
//       date/artist still need to be VISIBLE; bookingOffer is not exposed to the venue).
// PATCH → updates the editable fields (everything except eventDate, artistSlug,
//       artistName, bookingOffer, source, venueLoginId, status, inquiryNumber).
//
// Venue ownership = inquiry.venueLoginId === session venue id.

import { prisma } from "@/lib/db";
import { getVenueSessionId } from "@/lib/venue-session";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

const VENUE_EDITABLE_FIELDS = new Set([
  "venueName",
  "venueAddress",
  "contactName",
  "contactEmail",
  "contactPhone",
  "eventDescription",
  "messageToAgent",
]);

async function loadOwnedInquiry(id: string) {
  if (!prisma) return null;
  const sessionVenueId = await getVenueSessionId();
  if (!sessionVenueId) return null;
  const inq = await prisma.inquiry.findUnique({
    where: { id },
    include: {
      notes: {
        // Internal admin notes are filtered out for the venue view
        where: { authorType: { in: ["venue", "admin"] } },
        orderBy: { createdAt: "asc" },
      },
    },
  });
  if (!inq || inq.venueLoginId !== sessionVenueId) return null;
  return inq;
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  if (!prisma) return Response.json({ error: "DB not connected" }, { status: 503 });
  const { id } = await context.params;
  const inq = await loadOwnedInquiry(id);
  if (!inq) return Response.json({ error: "Not found" }, { status: 404 });
  // Strip money + admin-internal fields
  const { bookingOffer: _b, adminNotes: _a, ...safe } = inq;
  return Response.json(safe);
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  if (!prisma) return Response.json({ error: "DB not connected" }, { status: 503 });
  const { id } = await context.params;
  const inq = await loadOwnedInquiry(id);
  if (!inq) return Response.json({ error: "Not found" }, { status: 404 });

  // Once converted to event or finalized, the venue cannot edit anymore
  if (inq.status === "Booked" || inq.status === "Lost" || inq.convertedEventId) {
    return Response.json({ error: "Inquiry is finalized and cannot be edited." }, { status: 409 });
  }

  const body = (await request.json()) as Record<string, unknown>;
  const patch: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(body)) {
    if (VENUE_EDITABLE_FIELDS.has(k) && typeof v === "string") {
      patch[k] = v;
    }
  }
  if (Object.keys(patch).length === 0) {
    return Response.json({ error: "No editable fields in payload" }, { status: 400 });
  }

  const updated = await prisma.inquiry.update({
    where: { id },
    data: patch,
  });

  // Strip bookingOffer + adminNotes from venue response
  const { bookingOffer: _b, adminNotes: _a, ...safe } = updated;
  return Response.json(safe);
}
