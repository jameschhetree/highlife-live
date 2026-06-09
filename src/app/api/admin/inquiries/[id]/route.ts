// Admin-scoped inquiry detail + status mutation.
// GET → full inquiry hydrated with venueLoginLabel + notes (admin sees everything).
// PATCH → status, adminNotes, bookingOffer (owner-admin can edit anything; agents
//         can only edit status to Reviewed/Replied for their assigned artists).
//         Editable fields are explicit per Dok's Phase 3.6 spec.

import { prisma } from "@/lib/db";
import {
  getAdminEmailFromRequest,
  isOwnerAdminEmail,
} from "@/lib/admin-permissions";
import { isAgentLoginEmail } from "@/lib/admin-permissions-server";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

const ADMIN_EDITABLE_FIELDS = new Set([
  "status",
  "workingSubstatus",
  "adminNotes",
  "bookingOffer",
  "venueName",
  "venueAddress",
  "contactName",
  "contactEmail",
  "contactPhone",
  "eventDescription",
  "messageToAgent",
  "eventDate",
  "artistSlug",
  "artistName",
]);

// 2026-06-05 lock update: agents may edit status, workingSubstatus, adminNotes, AND
// eventDate (per brief Scope 4: "Add ability to edit event date"). Money/artist
// identity stays owner-only.
const AGENT_EDITABLE_FIELDS = new Set(["status", "workingSubstatus", "adminNotes", "eventDate"]);
const OWNER_ONLY_FIELDS = new Set(["artistSlug", "artistName", "bookingOffer"]);

async function loadInquiryForCaller(id: string, callerEmail: string) {
  if (!prisma) return null;
  const inq = await prisma.inquiry.findUnique({
    where: { id },
    include: {
      notes: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!inq) return null;
  // Agent scope check: must be assigned to this artistName.
  // (Owner-admins bypass.)
  if (!isOwnerAdminEmail(callerEmail)) {
    const agent = await prisma.agentLogin.findFirst({
      where: { email: callerEmail, isActive: true },
      include: { artistAssignments: true },
    });
    if (!agent || agent.artistAssignments.length === 0) return null;
    const artistIds = agent.artistAssignments.map((a) => a.artistId);
    const myArtists = await prisma.artist.findMany({
      where: { id: { in: artistIds } },
      select: { name: true },
    });
    const myNames = new Set(myArtists.map((a) => a.name));
    if (!myNames.has(inq.artistName)) return null;
  }
  return inq;
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  if (!prisma) return Response.json({ error: "DB not connected" }, { status: 503 });
  const email = getAdminEmailFromRequest(request);
  const isOwner = isOwnerAdminEmail(email);
  if (!isOwner && !(await isAgentLoginEmail(email))) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await context.params;
  const inq = await loadInquiryForCaller(id, email);
  if (!inq) return Response.json({ error: "Not found" }, { status: 404 });

  // Hydrate venueLoginLabel
  let venueLoginLabel: string | null = null;
  if (inq.venueLoginId) {
    const v = await prisma.venueLogin.findUnique({
      where: { id: inq.venueLoginId },
      select: { organizationName: true, email: true },
    });
    venueLoginLabel = v?.organizationName || v?.email || null;
  }

  // 2026-06-05 money-visibility lock: bookingOffer now visible to scoped agents too.
  return Response.json({ ...inq, venueLoginLabel });
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  if (!prisma) return Response.json({ error: "DB not connected" }, { status: 503 });
  const email = getAdminEmailFromRequest(request);
  const isOwner = isOwnerAdminEmail(email);
  if (!isOwner && !(await isAgentLoginEmail(email))) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await context.params;
  const inq = await loadInquiryForCaller(id, email);
  if (!inq) return Response.json({ error: "Not found" }, { status: 404 });

  const allowedFields = isOwner ? ADMIN_EDITABLE_FIELDS : AGENT_EDITABLE_FIELDS;
  const body = (await request.json()) as Record<string, unknown>;
  const patch: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(body)) {
    if (!allowedFields.has(k)) continue;
    if (!isOwner && OWNER_ONLY_FIELDS.has(k)) continue;
    patch[k] = v;
  }
  if (Object.keys(patch).length === 0) {
    return Response.json({ error: "No editable fields in payload" }, { status: 400 });
  }

  const updated = await prisma.inquiry.update({ where: { id }, data: patch });
  return Response.json(updated);
}
