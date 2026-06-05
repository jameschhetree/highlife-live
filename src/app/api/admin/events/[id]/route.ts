// PATCH  /api/admin/events/:id  -- owner full update; agent forbidden (no publish/hide).
// DELETE /api/admin/events/:id  -- owner-only delete

import { prisma } from "@/lib/db";
import {
  getAdminEmailFromRequest,
  isOwnerAdminEmail,
} from "@/lib/admin-permissions";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

interface Ctx {
  params: Promise<{ id: string }>;
}

function forbid(request: NextRequest): Response | null {
  if (isOwnerAdminEmail(getAdminEmailFromRequest(request))) return null;
  return Response.json({ error: "Forbidden" }, { status: 403 });
}

export async function PATCH(request: NextRequest, ctx: Ctx) {
  if (!prisma) return Response.json({ error: "DB not connected" }, { status: 503 });
  const blocked = forbid(request);
  if (blocked) return blocked;
  const { id } = await ctx.params;
  const body = await request.json();
  const data: Record<string, unknown> = {};
  if (typeof body.title === "string") data.title = body.title.trim();
  if (typeof body.date === "string") data.date = body.date.trim();
  if (typeof body.startAt === "string") data.startAt = new Date(body.startAt);
  if (typeof body.city === "string") data.city = body.city.trim();
  if (typeof body.venue === "string") data.venue = body.venue.trim();

  // featured artists — both legacy + new fields
  let recomputeLegacy = false;
  if (Array.isArray(body.featuredArtistIds)) {
    data.featuredArtistIds = (body.featuredArtistIds as unknown[]).filter(
      (s): s is string => typeof s === "string",
    );
    recomputeLegacy = true;
  }
  if (Array.isArray(body.externalArtists)) {
    data.externalArtists = (body.externalArtists as unknown[]).filter(
      (s): s is string => typeof s === "string",
    );
    recomputeLegacy = true;
  }
  if (Array.isArray(body.featuredArtists) && !recomputeLegacy) {
    // honor direct legacy edit only if neither new field was passed
    data.featuredArtists = (body.featuredArtists as unknown[]).filter(
      (s): s is string => typeof s === "string",
    );
  }

  if (["Available", "Limited", "Sold Out"].includes(body.ticketStatus)) {
    data.ticketStatus = body.ticketStatus;
  }
  if (typeof body.ticketUrl === "string") data.ticketUrl = body.ticketUrl.trim() || null;
  if (typeof body.isPast === "boolean") data.isPast = body.isPast;
  if (typeof body.published === "boolean") data.published = body.published;
  if (typeof body.description === "string") data.description = body.description.trim() || null;
  if (typeof body.showDescription === "boolean") data.showDescription = body.showDescription;
  if (typeof body.address === "string") data.address = body.address.trim() || null;
  if (typeof body.showAddress === "boolean") data.showAddress = body.showAddress;
  if (typeof body.customBannerEnabled === "boolean") data.customBannerEnabled = body.customBannerEnabled;
  if (typeof body.bannerUrl === "string") data.bannerUrl = body.bannerUrl.trim() || null;

  // Recompute legacy featuredArtists mirror when DB-linked + external fields change
  if (recomputeLegacy) {
    const ids = (data.featuredArtistIds as string[]) ?? [];
    const externals = (data.externalArtists as string[]) ?? [];
    let names: string[] = [];
    if (ids.length > 0) {
      const artists = await prisma.artist.findMany({
        where: { id: { in: ids } },
        select: { name: true },
      });
      names = artists.map((a) => a.name);
    }
    data.featuredArtists = [...names, ...externals];
  }

  const row = await prisma.event.update({ where: { id }, data });
  return Response.json(row);
}

export async function DELETE(request: NextRequest, ctx: Ctx) {
  if (!prisma) return Response.json({ error: "DB not connected" }, { status: 503 });
  const blocked = forbid(request);
  if (blocked) return blocked;
  const { id } = await ctx.params;
  await prisma.event.delete({ where: { id } });
  return Response.json({ ok: true });
}
