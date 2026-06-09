import { prisma } from "@/lib/db";
import {
  canManageAuditionsEmail,
  getAdminEmailFromRequest,
  isOwnerAdminEmail,
} from "@/lib/admin-permissions";
import { canViewAuditionsEmail } from "@/lib/admin-permissions-server";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ id: string }>;
}

// Agents can only touch auditions assigned to them (via AuditionAssignment).
// Owners see everything. Non-existent / inactive AgentLogin emails get false.
async function isAuditionVisibleToCaller(auditionId: string, email: string): Promise<boolean> {
  if (!prisma) return false;
  if (isOwnerAdminEmail(email)) return true;
  const agentLogin = await prisma.agentLogin.findFirst({
    where: { email, isActive: true },
    include: { auditionAssignments: { select: { auditionId: true } } },
  });
  if (!agentLogin) return false;
  return agentLogin.auditionAssignments.some((a) => a.auditionId === auditionId);
}

export async function GET(request: NextRequest, ctx: RouteContext) {
  if (!prisma) return Response.json({ error: "DB not connected" }, { status: 503 });
  const email = getAdminEmailFromRequest(request);
  if (!(await canViewAuditionsEmail(email))) return Response.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await ctx.params;
  if (!(await isAuditionVisibleToCaller(id, email))) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }
  const row = await prisma.agentApplication.findUnique({ where: { id } });
  if (!row) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json(row);
}

export async function PATCH(request: NextRequest, ctx: RouteContext) {
  if (!prisma) return Response.json({ error: "DB not connected" }, { status: 503 });
  const email = getAdminEmailFromRequest(request);
  if (!(await canViewAuditionsEmail(email))) return Response.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await ctx.params;
  if (!(await isAuditionVisibleToCaller(id, email))) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }
  const body = (await request.json()) as { status?: string; adminNotes?: string };
  const data: Record<string, unknown> = {};
  // Agents may only update STATUS. Owners may set any future fields too.
  if (typeof body.status === "string") data.status = body.status;
  const row = await prisma.agentApplication.update({ where: { id }, data });
  return Response.json(row);
}

export async function DELETE(request: NextRequest, ctx: RouteContext) {
  if (!prisma) return Response.json({ error: "DB not connected" }, { status: 503 });
  const email = getAdminEmailFromRequest(request);
  const { id } = await ctx.params;

  // Phase 3.9 Scope 10 — agents may now delete auditions they are ASSIGNED to.
  // Owners may delete any audition. Cascade audition assignments either way.
  const isOwner = canManageAuditionsEmail(email);
  if (!isOwner) {
    if (!(await canViewAuditionsEmail(email))) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }
    if (!(await isAuditionVisibleToCaller(id, email))) {
      return Response.json({ error: "Cannot delete an audition not assigned to you" }, { status: 403 });
    }
  }
  const assignmentDeletes = await prisma.auditionAssignment.deleteMany({ where: { auditionId: id } });
  await prisma.agentApplication.delete({ where: { id } });
  return Response.json({ ok: true, deletedAssignments: assignmentDeletes.count });
}
