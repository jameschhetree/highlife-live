// Agent-facing endpoints for venue contact access.
// GET → returns the agent's granted + pending venueIds (so UI can gate the contacts block).
// POST → agent requests access for a specific venueId.
//
// Authn: x-admin-email header → must resolve to an active AgentLogin row.
// Owner-admins (Jaco/Liam) get all venues "granted" implicitly — they bypass this system.

import { prisma } from "@/lib/db";
import { getAdminEmailFromRequest, isOwnerAdminEmail } from "@/lib/admin-permissions";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

async function resolveAgentLoginId(email: string): Promise<string | null> {
  if (!prisma) return null;
  const row = await prisma.agentLogin.findUnique({
    where: { email: email.toLowerCase() },
    select: { id: true, isActive: true },
  });
  if (!row || !row.isActive) return null;
  return row.id;
}

export async function GET(request: NextRequest) {
  if (!prisma) return Response.json({ error: "DB not connected" }, { status: 503 });
  const email = getAdminEmailFromRequest(request);
  if (!email) return Response.json({ error: "Unauthorized" }, { status: 401 });

  if (isOwnerAdminEmail(email)) {
    return Response.json({ ownerAdmin: true, grantedVenueIds: [], pendingVenueIds: [] });
  }

  const agentLoginId = await resolveAgentLoginId(email);
  if (!agentLoginId) return Response.json({ error: "Agent not found" }, { status: 403 });

  const [grants, pending] = await Promise.all([
    prisma.venueContactGrant.findMany({
      where: { agentLoginId },
      select: { venueId: true },
    }),
    prisma.venueContactAccessRequest.findMany({
      where: { agentLoginId, status: "Pending" },
      select: { venueId: true },
    }),
  ]);

  return Response.json({
    ownerAdmin: false,
    grantedVenueIds: grants.map((g) => g.venueId),
    pendingVenueIds: pending.map((p) => p.venueId),
  });
}

export async function POST(request: NextRequest) {
  if (!prisma) return Response.json({ error: "DB not connected" }, { status: 503 });
  const email = getAdminEmailFromRequest(request);
  if (!email) return Response.json({ error: "Unauthorized" }, { status: 401 });

  if (isOwnerAdminEmail(email)) {
    return Response.json({ error: "Owner admins already have access" }, { status: 400 });
  }

  const agentLoginId = await resolveAgentLoginId(email);
  if (!agentLoginId) return Response.json({ error: "Agent not found" }, { status: 403 });

  const body = (await request.json()) as { venueId?: string; reason?: string };
  if (!body.venueId) return Response.json({ error: "venueId is required" }, { status: 400 });

  // Already granted? short-circuit
  const existingGrant = await prisma.venueContactGrant.findFirst({
    where: { agentLoginId, venueId: body.venueId },
    select: { id: true },
  });
  if (existingGrant) {
    return Response.json({ ok: true, status: "Already granted", id: existingGrant.id });
  }

  // Pending request already? short-circuit
  const existing = await prisma.venueContactAccessRequest.findFirst({
    where: { agentLoginId, venueId: body.venueId, status: "Pending" },
    select: { id: true },
  });
  if (existing) {
    return Response.json({ ok: true, status: "Already pending", id: existing.id });
  }

  const created = await prisma.venueContactAccessRequest.create({
    data: {
      agentLoginId,
      venueId: body.venueId,
      status: "Pending",
      reason: body.reason ?? "",
    },
    select: { id: true },
  });
  return Response.json({ ok: true, status: "Pending", id: created.id });
}
