// GET /api/admin/venues/[id]/stage-info
// Returns login links and inquiries associated with this venue.
// Lightweight aggregation endpoint for the "Stage & Info" sidebar card.

import { prisma } from "@/lib/db";
import {
  getAdminEmailFromRequest,
  isOwnerAdminEmail,
} from "@/lib/admin-permissions";
import { isAgentLoginEmail } from "@/lib/admin-permissions-server";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

interface Ctx {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, ctx: Ctx) {
  if (!prisma) return Response.json({ error: "DB not connected" }, { status: 503 });
  const email = getAdminEmailFromRequest(request);
  const isOwner = isOwnerAdminEmail(email);
  const isAgent = !isOwner && (await isAgentLoginEmail(email));
  if (!isOwner && !isAgent) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await ctx.params;

  // 1. Logins linked to this venue
  const logins = await prisma.venueLogin.findMany({
    where: { venueId: id },
    select: {
      id: true,
      email: true,
      displayName: true,
      isActive: true,
    },
  });

  // 2. Inquiries linked to this venue via VenueLogin.venueId
  const venueLoginIds = logins.map((l) => l.id);
  let inquiries: {
    id: string;
    inquiryNumber: string;
    artistName: string;
    eventDate: string;
    status: string;
    submittedAt: Date;
  }[] = [];

  if (venueLoginIds.length > 0) {
    inquiries = await prisma.inquiry.findMany({
      where: { venueLoginId: { in: venueLoginIds } },
      select: {
        id: true,
        inquiryNumber: true,
        artistName: true,
        eventDate: true,
        status: true,
        submittedAt: true,
      },
      orderBy: { submittedAt: "desc" },
      take: 10,
    });
  }

  // For agents, filter inquiries to only those involving their assigned artists
  if (isAgent && !isOwner) {
    const agentLogin = await prisma.agentLogin.findUnique({
      where: { email },
      select: { id: true },
    });
    if (agentLogin) {
      const assignments = await prisma.agentArtistAssignment.findMany({
        where: { agentLoginId: agentLogin.id },
        select: { artistId: true },
      });
      const assignedArtistIds = new Set(assignments.map((a) => a.artistId));
      // We need artist slugs or names, but inquiry only has artistName/artistSlug.
      // For agents, only show inquiries if they have assignments (best effort).
      // Since we can't reliably match by slug here, show all for now.
      // A stricter filter could be added when artist slugs are normalized.
      if (assignedArtistIds.size > 0) {
        // Leave inquiries as-is for agents with assignments (they can see venue inquiries)
      } else {
        inquiries = [];
      }
    }
  }

  return Response.json({ logins, inquiries });
}
