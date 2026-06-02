// PATCH  /api/admin/events/:id  -- owner-only update
// DELETE /api/admin/events/:id  -- owner-only delete

import { prisma } from "@/lib/db";
import { getAdminEmailFromRequest, isOwnerAdminEmail } from "@/lib/admin-permissions";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

interface Ctx { params: Promise<{ id: string }>; }

function forbid(request: NextRequest): Response | null {
  if (isOwnerAdminEmail(getAdminEmailFromRequest(request))) return null;
  return Response.json({ error: "Forbidden" }, { status: 403 });
}

export async function PATCH(request: NextRequest, ctx: Ctx) {
  if (!prisma) return Response.json({ error: "DB not connected" }, { status: 503 });
  const blocked = forbid(request); if (blocked) return blocked;
  const { id } = await ctx.params;
  const body = await request.json();
  const data: Record<string, unknown> = {};
  if (typeof body.title === "string") data.title = body.title.trim();
  if (typeof body.date === "string") data.date = body.date.trim();
  if (typeof body.startAt === "string") data.startAt = new Date(body.startAt);
  if (typeof body.city === "string") data.city = body.city.trim();
  if (typeof body.venue === "string") data.venue = body.venue.trim();
  if (Array.isArray(body.featuredArtists)) data.featuredArtists = body.featuredArtists.filter((s: unknown) => typeof s === "string");
  if (["Available", "Limited", "Sold Out"].includes(body.ticketStatus)) data.ticketStatus = body.ticketStatus;
  if (typeof body.ticketUrl === "string") data.ticketUrl = body.ticketUrl.trim() || null;
  if (typeof body.isPast === "boolean") data.isPast = body.isPast;
  if (typeof body.published === "boolean") data.published = body.published;
  const row = await prisma.event.update({ where: { id }, data });
  return Response.json(row);
}

export async function DELETE(request: NextRequest, ctx: Ctx) {
  if (!prisma) return Response.json({ error: "DB not connected" }, { status: 503 });
  const blocked = forbid(request); if (blocked) return blocked;
  const { id } = await ctx.params;
  await prisma.event.delete({ where: { id } });
  return Response.json({ ok: true });
}
