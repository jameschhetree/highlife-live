// /api/admin/bookings/[id]/materials — URL-paste material refs per booking.
// Owner: any booking. Agent: only on bookings they own or whose artist is assigned.
// GET: list; POST: add { kind, url, filename?, note? }; DELETE: remove ?materialId=

import { prisma } from "@/lib/db";
import {
  getAdminEmailFromRequest,
  isOwnerAdminEmail,
} from "@/lib/admin-permissions";
import { isAgentLoginEmail } from "@/lib/admin-permissions-server";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

const KINDS = new Set(["banner", "flier", "video", "contract", "other"]);

async function authorizeBooking(id: string, email: string) {
  if (!prisma) return null;
  const b = await prisma.booking.findUnique({
    where: { id },
    select: { id: true, artistId: true, agentLoginId: true },
  });
  if (!b) return null;
  if (isOwnerAdminEmail(email)) return b;
  const agent = await prisma.agentLogin.findFirst({
    where: { email, isActive: true },
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
  if (!isOwnerAdminEmail(email) && !(await isAgentLoginEmail(email))) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await context.params;
  const ok = await authorizeBooking(id, email);
  if (!ok) return Response.json({ error: "Not found" }, { status: 404 });
  const materials = await prisma.bookingMaterial.findMany({
    where: { bookingId: id },
    orderBy: { createdAt: "asc" },
  });
  return Response.json(materials);
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  if (!prisma) return Response.json({ error: "DB not connected" }, { status: 503 });
  const email = getAdminEmailFromRequest(request);
  if (!isOwnerAdminEmail(email) && !(await isAgentLoginEmail(email))) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await context.params;
  const ok = await authorizeBooking(id, email);
  if (!ok) return Response.json({ error: "Not found" }, { status: 404 });

  const body = (await request.json()) as {
    kind?: string;
    url?: string;
    filename?: string;
    note?: string;
  };

  const kind = String(body.kind || "other").trim().toLowerCase();
  const url = String(body.url || "").trim();
  if (!KINDS.has(kind)) {
    return Response.json({ error: "Invalid kind" }, { status: 400 });
  }
  if (!url || !/^https?:\/\//i.test(url)) {
    return Response.json({ error: "URL must start with http(s)://" }, { status: 400 });
  }
  const created = await prisma.bookingMaterial.create({
    data: {
      bookingId: id,
      kind,
      url,
      filename: (body.filename ?? "").toString().trim(),
      note: (body.note ?? "").toString().trim(),
    },
  });
  return Response.json(created, { status: 201 });
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  if (!prisma) return Response.json({ error: "DB not connected" }, { status: 503 });
  const email = getAdminEmailFromRequest(request);
  if (!isOwnerAdminEmail(email) && !(await isAgentLoginEmail(email))) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await context.params;
  const ok = await authorizeBooking(id, email);
  if (!ok) return Response.json({ error: "Not found" }, { status: 404 });

  const materialId = request.nextUrl.searchParams.get("materialId");
  if (!materialId) {
    return Response.json({ error: "materialId required" }, { status: 400 });
  }
  await prisma.bookingMaterial.deleteMany({
    where: { id: materialId, bookingId: id },
  });
  return Response.json({ ok: true });
}
