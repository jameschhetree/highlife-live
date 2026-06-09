// /api/partner/hidden-inquiries — venue-scoped hide list.
// Auth: venue session cookie (same as /api/inquiries). Never trusts client venueLoginId.
// GET: returns inquiryIds the calling venue has hidden from their portal view.
// POST: body { inquiryId } → upsert hidden row (no-op if already hidden).
// DELETE: query ?inquiryId= → remove hidden row.
//
// Hidden is per VenueLogin via PartnerInquiryHidden; it does NOT delete the Inquiry.
// One venue cannot hide another venue's inquiries (scope enforced by session).

import { prisma } from "@/lib/db";
import { getVenueSessionId } from "@/lib/venue-session";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!prisma) return Response.json({ error: "DB not connected" }, { status: 503 });
  const venueLoginId = await getVenueSessionId();
  if (!venueLoginId) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const rows = await prisma.partnerInquiryHidden.findMany({
    where: { venueLoginId },
    select: { inquiryId: true },
  });
  return Response.json(rows.map((r) => r.inquiryId));
}

export async function POST(request: NextRequest) {
  if (!prisma) return Response.json({ error: "DB not connected" }, { status: 503 });
  const venueLoginId = await getVenueSessionId();
  if (!venueLoginId) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const body = (await request.json()) as { inquiryId?: string };
  if (!body.inquiryId) {
    return Response.json({ error: "inquiryId required" }, { status: 400 });
  }
  // Confirm the inquiry belongs to this venue (no cross-venue hides)
  const inq = await prisma.inquiry.findUnique({
    where: { id: body.inquiryId },
    select: { venueLoginId: true },
  });
  if (!inq || inq.venueLoginId !== venueLoginId) {
    return Response.json({ error: "Inquiry not found in your portal" }, { status: 404 });
  }
  await prisma.partnerInquiryHidden.upsert({
    where: {
      venueLoginId_inquiryId: { venueLoginId, inquiryId: body.inquiryId },
    },
    create: { venueLoginId, inquiryId: body.inquiryId },
    update: {},
  });
  return Response.json({ ok: true });
}

export async function DELETE(request: NextRequest) {
  if (!prisma) return Response.json({ error: "DB not connected" }, { status: 503 });
  const venueLoginId = await getVenueSessionId();
  if (!venueLoginId) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const inquiryId = request.nextUrl.searchParams.get("inquiryId");
  if (!inquiryId) return Response.json({ error: "inquiryId query param required" }, { status: 400 });
  await prisma.partnerInquiryHidden.deleteMany({
    where: { venueLoginId, inquiryId },
  });
  return Response.json({ ok: true });
}
