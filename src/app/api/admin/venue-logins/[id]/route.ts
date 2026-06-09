import { prisma } from "@/lib/db";
import { canManageVenueLoginsEmail, getAdminEmailFromRequest } from "@/lib/admin-permissions";
import { hashPassword } from "@/lib/password";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ id: string }>;
}

function forbidIfNotOwner(request: NextRequest): Response | null {
  if (canManageVenueLoginsEmail(getAdminEmailFromRequest(request))) return null;
  return Response.json({ error: "Forbidden" }, { status: 403 });
}

export async function GET(request: NextRequest, ctx: RouteContext) {
  if (!prisma) return Response.json({ error: "DB not connected" }, { status: 503 });
  const forbidden = forbidIfNotOwner(request);
  if (forbidden) return forbidden;
  const { id } = await ctx.params;
  const row = await prisma.venueLogin.findUnique({ where: { id } });
  if (!row) return Response.json({ error: "Not found" }, { status: 404 });
  const { passwordHash: _ph, ...safe } = row;
  return Response.json(safe);
}

export async function PATCH(request: NextRequest, ctx: RouteContext) {
  if (!prisma) return Response.json({ error: "DB not connected" }, { status: 503 });
  const forbidden = forbidIfNotOwner(request);
  if (forbidden) return forbidden;
  const { id } = await ctx.params;
  const body = (await request.json()) as {
    displayName?: string;
    organizationName?: string;
    accountType?: string;
    isActive?: boolean;
    password?: string;
    email?: string;
  };

  const data: Record<string, unknown> = {};
  if (typeof body.displayName === "string") data.displayName = body.displayName.trim();
  if (typeof body.organizationName === "string") data.organizationName = body.organizationName.trim();
  if (typeof body.accountType === "string") data.accountType = body.accountType.trim();
  if (typeof body.isActive === "boolean") data.isActive = body.isActive;
  if (typeof body.email === "string") data.email = body.email.trim().toLowerCase();
  if (typeof body.password === "string" && body.password.trim()) {
    data.passwordHash = await hashPassword(body.password.trim());
  }

  const row = await prisma.venueLogin.update({ where: { id }, data });
  const { passwordHash: _ph2, ...safe2 } = row;
  return Response.json(safe2);
}

export async function DELETE(request: NextRequest, ctx: RouteContext) {
  if (!prisma) return Response.json({ error: "DB not connected" }, { status: 503 });
  const forbidden = forbidIfNotOwner(request);
  if (forbidden) return forbidden;
  const { id } = await ctx.params;
  // Phase 3.9 Scope 9 — if this VenueLogin was created from a PartnerLoginRequest,
  // re-open that request as "New" so it doesn't silently vanish from the queue.
  const existing = await prisma.venueLogin.findUnique({
    where: { id },
    select: { sourceRequestId: true },
  });
  await prisma.venueLogin.delete({ where: { id } });
  if (existing?.sourceRequestId) {
    await prisma.partnerLoginRequest
      .update({ where: { id: existing.sourceRequestId }, data: { status: "New" } })
      .catch(() => {
        /* request may not exist anymore */
      });
  }
  return Response.json({ ok: true });
}
