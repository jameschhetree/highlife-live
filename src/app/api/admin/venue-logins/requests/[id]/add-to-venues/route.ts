// POST /api/admin/venue-logins/requests/[id]/add-to-venues
// Creates a Venue row from a PartnerLoginRequest with autofill.
// Owner-admin only. Idempotent: if a Venue with the same name already exists, returns it.

import { prisma } from "@/lib/db";
import { canManageVenueLoginsEmail, getAdminEmailFromRequest } from "@/lib/admin-permissions";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  if (!prisma) return Response.json({ error: "DB not connected" }, { status: 503 });
  if (!canManageVenueLoginsEmail(getAdminEmailFromRequest(request))) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await context.params;
  const req = await prisma.partnerLoginRequest.findUnique({ where: { id } });
  if (!req) return Response.json({ error: "Request not found" }, { status: 404 });

  // Idempotency: don't duplicate
  const existing = await prisma.venue.findFirst({
    where: { name: { equals: req.organizationName, mode: "insensitive" } },
    select: { id: true, name: true },
  });
  if (existing) {
    return Response.json({ ok: true, venue: existing, created: false });
  }

  // Best-effort city/state parse from address — autofill is opportunistic.
  // Format admins enter is "STREET, CITY, STATE ZIP" typically.
  let city = "";
  let state = "";
  if (req.address) {
    const parts = req.address.split(",").map((p) => p.trim());
    if (parts.length >= 2) city = parts[parts.length - 2] || "";
    if (parts.length >= 1) {
      const tail = parts[parts.length - 1] || "";
      const stateMatch = tail.match(/^([A-Z]{2})\b/i);
      if (stateMatch) state = stateMatch[1].toUpperCase();
    }
  }

  const created = await prisma.venue.create({
    data: {
      name: req.organizationName,
      contactPerson: req.contactName,
      contactTitle: req.role,
      email: req.workEmail,
      phone: req.workPhone || req.mobilePhone,
      address: req.address,
      city,
      state,
      bookingEmail: req.workEmail,
      source: "Partner Request",
      sourceDate: new Date().toISOString().slice(0, 10),
      reviewStatus: "Needs Review",
      relationshipStatus: "Warm",
      isDemo: false,
    },
    select: { id: true, name: true },
  });

  // Link any existing VenueLogin(s) that were created from this same request
  // back to the newly created Venue. This fixes the detached-login bug where
  // approving a request that creates both a VenueLogin and a Venue left them unlinked.
  await prisma.venueLogin.updateMany({
    where: { sourceRequestId: req.id, venueId: null },
    data: { venueId: created.id },
  });

  // Also try linking by organization name match (case-insensitive)
  await prisma.venueLogin.updateMany({
    where: {
      organizationName: { equals: req.organizationName, mode: "insensitive" },
      venueId: null,
    },
    data: { venueId: created.id },
  });

  await prisma.auditLog.create({
    data: {
      action: "create_venue_from_request",
      entityType: "venue",
      entityId: created.id,
      userId: getAdminEmailFromRequest(request),
      details: { sourceRequestId: req.id, venueName: created.name },
    },
  });

  return Response.json({ ok: true, venue: created, created: true });
}
