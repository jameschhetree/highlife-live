// POST /api/admin/delete-demo-data
// Hard-deletes all isDemo=true rows across the 6 seed models.
// Owner-admin (Jaco / Liam) only — gated server-side via x-admin-email header.
// Real partner data (Inquiry, Event, Booking, AgentApplication, etc.) is NEVER touched.

import { prisma } from "@/lib/db";
import { isOwnerAdminEmail, getAdminEmailFromRequest } from "@/lib/admin-permissions";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

// GET → preview counts (what WOULD be deleted)
export async function GET(request: NextRequest) {
  if (!prisma) return Response.json({ error: "DB not connected" }, { status: 503 });
  if (!isOwnerAdminEmail(getAdminEmailFromRequest(request))) {
    return Response.json({ error: "Forbidden — owner-admin only" }, { status: 403 });
  }

  const [artists, venues, contacts, campaigns, opportunities, epks] = await Promise.all([
    prisma.artist.count({ where: { isDemo: true } }),
    prisma.venue.count({ where: { isDemo: true } }),
    prisma.contact.count({ where: { isDemo: true } }),
    prisma.campaign.count({ where: { isDemo: true } }),
    prisma.opportunity.count({ where: { isDemo: true } }),
    prisma.ePK.count({ where: { isDemo: true } }),
  ]);

  return Response.json({
    counts: { artists, venues, contacts, campaigns, opportunities, epks },
    total: artists + venues + contacts + campaigns + opportunities + epks,
  });
}

// POST → actually delete
export async function POST(request: NextRequest) {
  if (!prisma) return Response.json({ error: "DB not connected" }, { status: 503 });
  const adminEmail = getAdminEmailFromRequest(request);
  if (!isOwnerAdminEmail(adminEmail)) {
    return Response.json({ error: "Forbidden — owner-admin only" }, { status: 403 });
  }

  // Order matters: delete dependent rows first to avoid FK cascade surprises.
  // Opportunities → reference Artist + Venue + Campaign
  // EPK → references Artist
  // Campaign → references Artist
  // Contact → CampaignContact join via cascade
  // Artist → cascade-deletes ArtistSocialStat
  // Venue → standalone
  const opportunities = await prisma.opportunity.deleteMany({ where: { isDemo: true } });
  const epks = await prisma.ePK.deleteMany({ where: { isDemo: true } });
  const campaigns = await prisma.campaign.deleteMany({ where: { isDemo: true } });
  const contacts = await prisma.contact.deleteMany({ where: { isDemo: true } });
  const artists = await prisma.artist.deleteMany({ where: { isDemo: true } });
  const venues = await prisma.venue.deleteMany({ where: { isDemo: true } });

  const audit = await prisma.auditLog.create({
    data: {
      action: "delete_demo_data",
      entityType: "global",
      entityId: "demo",
      userId: adminEmail,
      details: {
        artists: artists.count,
        venues: venues.count,
        contacts: contacts.count,
        campaigns: campaigns.count,
        opportunities: opportunities.count,
        epks: epks.count,
      },
    },
  });

  return Response.json({
    ok: true,
    deleted: {
      artists: artists.count,
      venues: venues.count,
      contacts: contacts.count,
      campaigns: campaigns.count,
      opportunities: opportunities.count,
      epks: epks.count,
    },
    total: artists.count + venues.count + contacts.count + campaigns.count + opportunities.count + epks.count,
    auditLogId: audit.id,
  });
}
