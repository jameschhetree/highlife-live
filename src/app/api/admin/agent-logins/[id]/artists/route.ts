// GET  /api/admin/agent-logins/[id]/artists → list this agent's current artist assignments
// PUT  /api/admin/agent-logins/[id]/artists → replace the assignment set (body: { artistIds: string[] })
//
// Owner-admin only. Idempotent: PUT computes diff vs. current and creates/deletes only what's needed.

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
    select: { id: true, name: true, email: true, isActive: true },
  });
  if (!agent) return Response.json({ error: "Agent not found" }, { status: 404 });

  const assignments = await prisma.agentArtistAssignment.findMany({
    where: { agentLoginId: id },
    orderBy: { createdAt: "asc" },
  });
  const artistIds = assignments.map((a) => a.artistId);
  const artists = artistIds.length
    ? await prisma.artist.findMany({
        where: { id: { in: artistIds } },
        select: { id: true, name: true, status: true, image: true, primaryGenre: true },
        orderBy: { name: "asc" },
      })
    : [];
  return Response.json({ agent, artists });
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  if (!prisma) return Response.json({ error: "DB not connected" }, { status: 503 });
  const adminEmail = getAdminEmailFromRequest(request);
  if (!isOwnerAdminEmail(adminEmail)) {
    return Response.json({ error: "Forbidden — owner-admin only" }, { status: 403 });
  }
  const { id: agentLoginId } = await context.params;
  const body = (await request.json()) as { artistIds?: string[] };
  if (!Array.isArray(body.artistIds)) {
    return Response.json({ error: "artistIds (array) required" }, { status: 400 });
  }
  const desired = new Set(body.artistIds);

  const current = await prisma.agentArtistAssignment.findMany({
    where: { agentLoginId },
    select: { artistId: true },
  });
  const currentSet = new Set(current.map((c) => c.artistId));

  const toAdd = Array.from(desired).filter((a) => !currentSet.has(a));
  const toRemove = Array.from(currentSet).filter((a) => !desired.has(a));

  if (toAdd.length) {
    await prisma.agentArtistAssignment.createMany({
      data: toAdd.map((artistId) => ({ agentLoginId, artistId })),
      skipDuplicates: true,
    });
  }
  if (toRemove.length) {
    await prisma.agentArtistAssignment.deleteMany({
      where: { agentLoginId, artistId: { in: toRemove } },
    });
  }

  await prisma.auditLog.create({
    data: {
      action: "update_agent_artist_assignments",
      entityType: "agent_login",
      entityId: agentLoginId,
      userId: adminEmail,
      details: { added: toAdd, removed: toRemove, finalCount: desired.size },
    },
  });

  return Response.json({ ok: true, added: toAdd.length, removed: toRemove.length });
}
