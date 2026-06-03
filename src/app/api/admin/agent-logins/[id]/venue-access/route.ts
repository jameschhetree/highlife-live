// Admin endpoints for managing one agent's venue contact access.
// GET → { pendingRequests, grants, agent } for the AgentLogin with this id.
// POST → mutate:
//   { action: "approve", requestId }   → mark request Approved + create grant
//   { action: "deny",    requestId }   → mark request Denied
//   { action: "grant",   venueId }     → grant access without a prior request (admin-initiated)
//   { action: "revoke",  venueId }     → delete grant (and any pending request)
//   { action: "approveAll" }           → approve every pending request in one shot
// Owner-admin only (Jaco/Liam).

import { prisma } from "@/lib/db";
import { isOwnerAdminEmail, getAdminEmailFromRequest } from "@/lib/admin-permissions";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  if (!prisma) return Response.json({ error: "DB not connected" }, { status: 503 });
  if (!isOwnerAdminEmail(getAdminEmailFromRequest(request))) {
    return Response.json({ error: "Forbidden — owner-admin only" }, { status: 403 });
  }

  const { id } = await context.params;
  const agent = await prisma.agentLogin.findUnique({
    where: { id },
    select: { id: true, email: true, name: true, isActive: true },
  });
  if (!agent) return Response.json({ error: "Agent not found" }, { status: 404 });

  const [pendingRequests, grants] = await Promise.all([
    prisma.venueContactAccessRequest.findMany({
      where: { agentLoginId: id, status: "Pending" },
      orderBy: { requestedAt: "desc" },
    }),
    prisma.venueContactGrant.findMany({
      where: { agentLoginId: id },
      orderBy: { grantedAt: "desc" },
    }),
  ]);

  // Hydrate venue names/cities so UI doesn't need a second round-trip
  const venueIds = Array.from(new Set([...pendingRequests.map((r) => r.venueId), ...grants.map((g) => g.venueId)]));
  const venues = venueIds.length
    ? await prisma.venue.findMany({
        where: { id: { in: venueIds } },
        select: { id: true, name: true, city: true, state: true },
      })
    : [];
  const venueMap = new Map(venues.map((v) => [v.id, v]));

  return Response.json({
    agent,
    pendingRequests: pendingRequests.map((r) => ({
      ...r,
      venue: venueMap.get(r.venueId) ?? null,
    })),
    grants: grants.map((g) => ({
      ...g,
      venue: venueMap.get(g.venueId) ?? null,
    })),
  });
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

  const { id: agentLoginId } = await context.params;
  const body = (await request.json()) as {
    action: "approve" | "deny" | "grant" | "revoke" | "approveAll";
    requestId?: string;
    venueId?: string;
  };

  if (body.action === "approve") {
    if (!body.requestId) return Response.json({ error: "requestId required" }, { status: 400 });
    const req = await prisma.venueContactAccessRequest.update({
      where: { id: body.requestId },
      data: { status: "Approved", decidedAt: new Date(), decidedBy: adminEmail },
    });
    await prisma.venueContactGrant.upsert({
      where: { agentLoginId_venueId: { agentLoginId, venueId: req.venueId } },
      create: { agentLoginId, venueId: req.venueId, grantedBy: adminEmail },
      update: { grantedBy: adminEmail, grantedAt: new Date() },
    });
    return Response.json({ ok: true });
  }

  if (body.action === "deny") {
    if (!body.requestId) return Response.json({ error: "requestId required" }, { status: 400 });
    await prisma.venueContactAccessRequest.update({
      where: { id: body.requestId },
      data: { status: "Denied", decidedAt: new Date(), decidedBy: adminEmail },
    });
    return Response.json({ ok: true });
  }

  if (body.action === "grant") {
    if (!body.venueId) return Response.json({ error: "venueId required" }, { status: 400 });
    await prisma.venueContactGrant.upsert({
      where: { agentLoginId_venueId: { agentLoginId, venueId: body.venueId } },
      create: { agentLoginId, venueId: body.venueId, grantedBy: adminEmail },
      update: { grantedBy: adminEmail, grantedAt: new Date() },
    });
    return Response.json({ ok: true });
  }

  if (body.action === "revoke") {
    if (!body.venueId) return Response.json({ error: "venueId required" }, { status: 400 });
    await prisma.venueContactGrant.deleteMany({
      where: { agentLoginId, venueId: body.venueId },
    });
    await prisma.venueContactAccessRequest.updateMany({
      where: { agentLoginId, venueId: body.venueId, status: "Pending" },
      data: { status: "Denied", decidedAt: new Date(), decidedBy: adminEmail },
    });
    return Response.json({ ok: true });
  }

  if (body.action === "approveAll") {
    const pending = await prisma.venueContactAccessRequest.findMany({
      where: { agentLoginId, status: "Pending" },
      select: { id: true, venueId: true },
    });
    for (const r of pending) {
      await prisma.venueContactAccessRequest.update({
        where: { id: r.id },
        data: { status: "Approved", decidedAt: new Date(), decidedBy: adminEmail },
      });
      await prisma.venueContactGrant.upsert({
        where: { agentLoginId_venueId: { agentLoginId, venueId: r.venueId } },
        create: { agentLoginId, venueId: r.venueId, grantedBy: adminEmail },
        update: { grantedBy: adminEmail, grantedAt: new Date() },
      });
    }
    return Response.json({ ok: true, approved: pending.length });
  }

  return Response.json({ error: "Unknown action" }, { status: 400 });
}
