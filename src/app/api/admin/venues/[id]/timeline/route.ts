// /api/admin/venues/[id]/timeline — venue activity timeline.
// GET: returns VenueTimelineEvent rows + joined Inquiries / Events / Bookings
//      attributed to this venue (by venueId where set, plus partner-venue inquiries
//      via venueLoginId → linked venueId).
// POST: append a note { body, kind?="note" }. Authored by the calling admin.

import { prisma } from "@/lib/db";
import {
  getAdminEmailFromRequest,
  isOwnerAdminEmail,
} from "@/lib/admin-permissions";
import { isAgentLoginEmail } from "@/lib/admin-permissions-server";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

interface Ctx {
  params: Promise<{ id: string }>;
}

const KINDS = new Set(["note", "inquiry", "event", "booking", "email", "other", "added", "responded", "booked", "event_hosted", "fell_through", "pushed_back", "negotiating"]);

export async function GET(request: NextRequest, ctx: Ctx) {
  if (!prisma) return Response.json({ error: "DB not connected" }, { status: 503 });
  const email = getAdminEmailFromRequest(request);
  if (!isOwnerAdminEmail(email) && !(await isAgentLoginEmail(email))) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await ctx.params;

  const [stored, bookings, inquiries] = await Promise.all([
    prisma.venueTimelineEvent.findMany({
      where: { venueId: id },
      orderBy: { createdAt: "desc" },
    }),
    prisma.booking.findMany({
      where: { venueId: id },
      select: {
        id: true,
        eventTitle: true,
        artistName: true,
        eventDate: true,
        submittedAt: true,
      },
      orderBy: { submittedAt: "desc" },
    }),
    prisma.inquiry.findMany({
      where: {
        OR: [{ venueName: { contains: "" } }],
        // Inquiry doesn't have venueId; attribute via venueLoginId → VenueLogin.venueId
      },
      select: {
        id: true,
        inquiryNumber: true,
        artistName: true,
        venueLoginId: true,
        venueName: true,
        eventDate: true,
        submittedAt: true,
      },
    }),
  ]);

  // Filter inquiries to those linked to this venueId via VenueLogin
  const venueLogins = await prisma.venueLogin.findMany({
    where: { venueId: id },
    select: { id: true },
  });
  const venueLoginIds = new Set(venueLogins.map((v) => v.id));
  const linkedInquiries = inquiries.filter(
    (i) => i.venueLoginId && venueLoginIds.has(i.venueLoginId),
  );

  const synthesized = [
    ...stored.map((s) => ({
      id: s.id,
      kind: s.kind,
      refId: s.refId,
      body: s.body,
      authorEmail: s.authorEmail,
      eventDate: s.eventDate,
      createdAt: s.createdAt,
    })),
    ...bookings.map((b) => ({
      id: `bk-${b.id}`,
      kind: "booking",
      refId: b.id,
      body: `${b.eventTitle || `${b.artistName} booking`} · ${b.eventDate || ""}`.trim(),
      authorEmail: "",
      createdAt: b.submittedAt,
    })),
    ...linkedInquiries.map((i) => ({
      id: `inq-${i.id}`,
      kind: "inquiry",
      refId: i.id,
      body: `${i.inquiryNumber} · ${i.artistName} (${i.eventDate || "no date"})`,
      authorEmail: "",
      createdAt: i.submittedAt,
    })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return Response.json(synthesized);
}

export async function POST(request: NextRequest, ctx: Ctx) {
  if (!prisma) return Response.json({ error: "DB not connected" }, { status: 503 });
  const email = getAdminEmailFromRequest(request);
  if (!isOwnerAdminEmail(email) && !(await isAgentLoginEmail(email))) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await ctx.params;
  const body = (await request.json()) as { body?: string; kind?: string; eventDate?: string; refId?: string };
  const text = (body.body ?? "").trim();
  const kind = KINDS.has(body.kind ?? "note") ? (body.kind ?? "note") : "note";
  // body text is optional for non-note kinds (e.g. "added" entries may have no body)
  if (kind === "note" && !text) return Response.json({ error: "body required" }, { status: 400 });

  const created = await prisma.venueTimelineEvent.create({
    data: {
      venueId: id,
      kind,
      body: text,
      authorEmail: email || "unknown",
      eventDate: body.eventDate ? new Date(body.eventDate) : null,
      refId: body.refId || null,
    },
  });
  return Response.json(created, { status: 201 });
}
