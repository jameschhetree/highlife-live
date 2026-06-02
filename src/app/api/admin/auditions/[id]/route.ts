import { prisma } from "@/lib/db";
import { canViewAuditionsEmail, getAdminEmailFromRequest } from "@/lib/admin-permissions";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ id: string }>;
}

function forbidIfNotAuditionsOwner(request: NextRequest): Response | null {
  if (canViewAuditionsEmail(getAdminEmailFromRequest(request))) return null;
  return Response.json({ error: "Forbidden" }, { status: 403 });
}

export async function GET(request: NextRequest, ctx: RouteContext) {
  if (!prisma) return Response.json({ error: "DB not connected" }, { status: 503 });
  const forbidden = forbidIfNotAuditionsOwner(request);
  if (forbidden) return forbidden;
  const { id } = await ctx.params;
  const row = await prisma.agentApplication.findUnique({ where: { id } });
  if (!row) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json(row);
}

export async function PATCH(request: NextRequest, ctx: RouteContext) {
  if (!prisma) return Response.json({ error: "DB not connected" }, { status: 503 });
  const forbidden = forbidIfNotAuditionsOwner(request);
  if (forbidden) return forbidden;
  const { id } = await ctx.params;
  const body = (await request.json()) as { status?: string; adminNotes?: string };
  const data: Record<string, unknown> = {};
  if (typeof body.status === "string") data.status = body.status;
  // adminNotes isn't a column on AgentApplication yet — skip silently if sent
  const row = await prisma.agentApplication.update({ where: { id }, data });
  return Response.json(row);
}

export async function DELETE(request: NextRequest, ctx: RouteContext) {
  if (!prisma) return Response.json({ error: "DB not connected" }, { status: 503 });
  const forbidden = forbidIfNotAuditionsOwner(request);
  if (forbidden) return forbidden;
  const { id } = await ctx.params;
  await prisma.agentApplication.delete({ where: { id } });
  return Response.json({ ok: true });
}
