// /api/admin/event-card-requests/[id] — owner manages a specific request.
// PATCH:  update status (Pending → Reviewed → Created → Archived).
// DELETE: owner-only delete.
// Agents may PATCH their own request to "Archived" (withdraw).

import { prisma } from "@/lib/db";
import {
  getAdminEmailFromRequest,
  isOwnerAdminEmail,
} from "@/lib/admin-permissions";
import { isAgentLoginEmail } from "@/lib/admin-permissions-server";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

const STATUSES = new Set(["Pending", "Reviewed", "Created", "Archived"]);

interface Ctx {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, ctx: Ctx) {
  if (!prisma) return Response.json({ error: "DB not connected" }, { status: 503 });
  const email = getAdminEmailFromRequest(request);
  const isOwner = isOwnerAdminEmail(email);
  const isAgent = !isOwner && (await isAgentLoginEmail(email));
  if (!isOwner && !isAgent) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await ctx.params;
  const body = (await request.json()) as { status?: string };
  if (!body.status || !STATUSES.has(body.status)) {
    return Response.json({ error: "Invalid status" }, { status: 400 });
  }

  // Agents can only archive their own
  if (!isOwner) {
    const existing = await prisma.eventCardRequest.findUnique({
      where: { id },
      include: { requestedByAgent: { select: { email: true } } },
    });
    if (!existing) return Response.json({ error: "Not found" }, { status: 404 });
    if (existing.requestedByAgent.email !== email) {
      return Response.json({ error: "Cannot modify another agent's request" }, { status: 403 });
    }
    if (body.status !== "Archived") {
      return Response.json({ error: "Agents can only archive (withdraw) their own request" }, { status: 403 });
    }
  }

  const updated = await prisma.eventCardRequest.update({
    where: { id },
    data: { status: body.status },
  });
  return Response.json(updated);
}

export async function DELETE(request: NextRequest, ctx: Ctx) {
  if (!prisma) return Response.json({ error: "DB not connected" }, { status: 503 });
  if (!isOwnerAdminEmail(getAdminEmailFromRequest(request))) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await ctx.params;
  await prisma.eventCardRequest.delete({ where: { id } });
  return Response.json({ ok: true });
}
