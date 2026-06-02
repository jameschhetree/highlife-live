// GET /api/admin/inquiries -- list inquiries (scoped by role)
// Owner: all inquiries
// Agent: only inquiries for assigned artists, with money fields stripped

import { prisma } from "@/lib/db";
import {
  getAdminEmailFromRequest,
  isOwnerAdminEmail,
  isAgentAdminEmail,
  stripMoneyFieldsArray,
} from "@/lib/admin-permissions";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!prisma) return Response.json({ error: "DB not connected" }, { status: 503 });

  const email = getAdminEmailFromRequest(request);
  if (!isOwnerAdminEmail(email) && !isAgentAdminEmail(email)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const source = request.nextUrl.searchParams.get("source");
  const status = request.nextUrl.searchParams.get("status");

  const where: Record<string, unknown> = {};
  if (source) where.source = source;
  if (status) where.status = status;

  if (isAgentAdminEmail(email)) {
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

  if (isAgentAdminEmail(email)) {
    return Response.json(stripMoneyFieldsArray(enriched as Record<string, unknown>[]));
  }

  return Response.json(enriched);
}
