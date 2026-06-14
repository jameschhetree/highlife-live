// PATCH  /api/admin/agent-logins/:id -- update agent login (owner-only)
// DELETE /api/admin/agent-logins/:id -- delete agent login (owner-only)

import { prisma } from "@/lib/db";
import { getAdminEmailFromRequest, isOwnerAdminEmail } from "@/lib/admin-permissions";
import { hashPassword } from "@/lib/password";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

const VALID_ROLES = ["agent", "admin", "owner"] as const;

interface RouteContext {
  params: Promise<{ id: string }>;
}

function forbidIfNotOwner(request: NextRequest): Response | null {
  if (isOwnerAdminEmail(getAdminEmailFromRequest(request))) return null;
  return Response.json({ error: "Forbidden" }, { status: 403 });
}

export async function PATCH(request: NextRequest, ctx: RouteContext) {
  if (!prisma) return Response.json({ error: "DB not connected" }, { status: 503 });
  const forbidden = forbidIfNotOwner(request);
  if (forbidden) return forbidden;
  const { id } = await ctx.params;

  const existing = await prisma.agentLogin.findUnique({ where: { id } });
  if (!existing) return Response.json({ error: "Not found" }, { status: 404 });
  if (existing.role === "owner") {
    return Response.json({ error: "Owner logins cannot be modified from the UI." }, { status: 403 });
  }

  const body = (await request.json()) as {
    name?: string;
    email?: string;
    password?: string;
    isActive?: boolean;
    role?: string;
    artistIds?: string[];
  };

  const data: Record<string, unknown> = {};
  if (typeof body.name === "string") data.name = body.name.trim();
  if (typeof body.email === "string") data.email = body.email.trim().toLowerCase();
  if (typeof body.isActive === "boolean") data.isActive = body.isActive;
  if (typeof body.password === "string" && body.password.trim()) {
    data.passwordHash = await hashPassword(body.password.trim());
  }
  if (typeof body.role === "string" && (body.role === "agent" || body.role === "admin")) {
    data.role = body.role;
  }

  const row = await prisma.agentLogin.update({ where: { id }, data });

  // Update artist assignments if provided
  if (Array.isArray(body.artistIds)) {
    // Delete existing assignments
    await prisma.agentArtistAssignment.deleteMany({ where: { agentLoginId: id } });
    // Create new ones
    if (body.artistIds.length > 0) {
      await prisma.agentArtistAssignment.createMany({
        data: body.artistIds.map((artistId) => ({ agentLoginId: id, artistId })),
      });
    }
  }

  const { passwordHash: _ph, ...safe } = row;
  return Response.json(safe);
}

export async function DELETE(request: NextRequest, ctx: RouteContext) {
  if (!prisma) return Response.json({ error: "DB not connected" }, { status: 503 });
  const forbidden = forbidIfNotOwner(request);
  if (forbidden) return forbidden;
  const { id } = await ctx.params;

  const existing = await prisma.agentLogin.findUnique({ where: { id } });
  if (!existing) return Response.json({ error: "Not found" }, { status: 404 });
  if (existing.role === "owner") {
    return Response.json({ error: "Owner logins cannot be deleted from the UI." }, { status: 403 });
  }

  await prisma.agentLogin.delete({ where: { id } });
  return Response.json({ ok: true });
}
