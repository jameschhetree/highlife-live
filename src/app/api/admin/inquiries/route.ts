// GET /api/admin/inquiries -- list inquiries (scoped by role)
// Owner: all inquiries
// Agent: only inquiries for assigned artists (money fields allowed per 2026-06-05 lock update)

import { prisma } from "@/lib/db";
import {
  getAdminEmailFromRequest,
  isOwnerAdminEmail,
} from "@/lib/admin-permissions";
import { isAgentLoginEmail } from "@/lib/admin-permissions-server";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!prisma) return Response.json({ error: "DB not connected" }, { status: 503 });

  const email = getAdminEmailFromRequest(request);
  const isOwner = isOwnerAdminEmail(email);
  const isAgent = !isOwner && (await isAgentLoginEmail(email));
  if (!isOwner && !isAgent) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const source = request.nextUrl.searchParams.get("source");
  const status = request.nextUrl.searchParams.get("status");
  const includeArchived = request.nextUrl.searchParams.get("includeArchived") === "1";

  const where: Record<string, unknown> = {};
  if (source) where.source = source;
  if (status) {
    where.status = status;
  } else if (!includeArchived) {
    where.status = { not: "Archived" };
  }

  if (isAgent) {
    // Get assigned artist slugs for this agent
    const agentLogin = await prisma.agentLogin.findFirst({
      where: { email, isActive: true },
      include: { artistAssignments: true },
    });

    if (!agentLogin || agentLogin.artistAssignments.length === 0) {
      return Response.json([]);
    }

    // Get the artist IDs, then look up their slugs from static data
    // Since Inquiry uses artistSlug, we need to map from Artist.id -> slug
    const artistIds = agentLogin.artistAssignments.map((a) => a.artistId);
    const artists = await prisma.artist.findMany({
      where: { id: { in: artistIds } },
      select: { id: true, name: true },
    });
    const artistNames = artists.map((a) => a.name);

    where.artistName = { in: artistNames };
  }

  const rows = await prisma.inquiry.findMany({
    where,
    orderBy: { submittedAt: "desc" },
  });

  // Join venue org name onto partner-source rows so the admin table can show
  // "Acme Hall" instead of a raw cuid for the venue identity column.
  const partnerVenueIds = Array.from(new Set(rows.filter((r) => r.venueLoginId).map((r) => r.venueLoginId!)));
  let venueMap: Record<string, { organizationName: string | null; email: string }> = {};
  if (partnerVenueIds.length > 0) {
    const venues = await prisma.venueLogin.findMany({
      where: { id: { in: partnerVenueIds } },
      select: { id: true, organizationName: true, email: true },
    });
    venueMap = Object.fromEntries(venues.map((v) => [v.id, { organizationName: v.organizationName, email: v.email }]));
  }
  const enriched = rows.map((r) => ({
    ...r,
    venueLoginLabel: r.venueLoginId
      ? venueMap[r.venueLoginId]?.organizationName || venueMap[r.venueLoginId]?.email || r.venueLoginId
      : null,
  }));

  // 2026-06-05 money-visibility lock: agents may now see offer/split on inquiries
  // they're scoped to (already filtered above by artist assignments).
  return Response.json(enriched);
}
