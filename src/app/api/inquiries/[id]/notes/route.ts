// Venue-partner notes endpoint.
// GET → list venue + admin notes on the inquiry (internal admin notes filtered).
// POST → venue adds a new note. Authored as authorType="venue", authorEmail from session venue login.

import { prisma } from "@/lib/db";
import { getVenueSessionId } from "@/lib/venue-session";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

async function loadOwnedInquiry(id: string) {
  if (!prisma) return null;
  const sessionVenueId = await getVenueSessionId();
  if (!sessionVenueId) return null;
  const inq = await prisma.inquiry.findUnique({ where: { id } });
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

  const notes = await prisma.inquiryNote.findMany({
    where: { inquiryId: id, authorType: { in: ["venue", "admin"] } },
    orderBy: { createdAt: "asc" },
  });
  return Response.json(notes);
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  if (!prisma) return Response.json({ error: "DB not connected" }, { status: 503 });
  const { id } = await context.params;
  const inq = await loadOwnedInquiry(id);
  if (!inq) return Response.json({ error: "Not found" }, { status: 404 });

  const sessionVenueId = await getVenueSessionId();
  if (!sessionVenueId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json()) as { body?: string };
  const text = (body.body ?? "").trim();
  if (!text) return Response.json({ error: "body required" }, { status: 400 });

  const venueLogin = await prisma.venueLogin.findUnique({
    where: { id: sessionVenueId },
    select: { email: true, displayName: true },
  });

  const note = await prisma.inquiryNote.create({
    data: {
      inquiryId: id,
      authorType: "venue",
      authorEmail: venueLogin?.email ?? "",
      authorName: venueLogin?.displayName ?? "Venue Partner",
      body: text,
    },
  });
  return Response.json(note, { status: 201 });
}
