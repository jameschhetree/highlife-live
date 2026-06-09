// POST /api/admin/delete-demo-data
// Hard-deletes isDemo=true rows across the seed models EXCEPT Venue and Contact.
// Owner-admin (Jaco / Liam) only — gated server-side via x-admin-email header.
//
// What this button NEVER touches (Dok's directives 2026-06-03):
//   - Venue: "venue data is not demo data, those are real venues we can contact"
//   - Contact: pending discriminator decision; real-lead data even when flagged isDemo
//   - VenueLogin / AgentLogin / PartnerLoginRequest: never touched (logins)
//   - Inquiry / Event / Booking / AgentApplication: never touched (real partner data)
//
// What this button DOES delete (placeholder seed data only):
//   - Artist (Riko Lux et al)
//   - Campaign / Opportunity / EPK (placeholder records tied to seed artists)

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

  const [artists, campaigns, opportunities, epks] = await Promise.all([
    prisma.artist.count({ where: { isDemo: true } }),
    prisma.campaign.count({ where: { isDemo: true } }),
    prisma.opportunity.count({ where: { isDemo: true } }),
    prisma.ePK.count({ where: { isDemo: true } }),
  ]);

  // Preserved counts (informational, NOT included in delete) — surfaces real-data
  // protection in the UI so admins see what's NOT going to be touched.
  const [venuesPreserved, contactsPreserved] = await Promise.all([
    prisma.venue.count(),
    prisma.contact.count(),
  ]);

  return Response.json({
    counts: { artists, campaigns, opportunities, epks },
    total: artists + campaigns + opportunities + epks,
    preserved: { venues: venuesPreserved, contacts: contactsPreserved },
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
  // Opportunities → reference Artist + Venue + Campaign (Venue is preserved, so
  // any opportunities pointing to a Venue stay too unless Artist gets deleted)
  // EPK → references Artist
  // Campaign → references Artist
  // Artist → cascade-deletes ArtistSocialStat
  //
  // Venue + Contact intentionally excluded — see header comment.
  const opportunities = await prisma.opportunity.deleteMany({ where: { isDemo: true } });
  const epks = await prisma.ePK.deleteMany({ where: { isDemo: true } });
  const campaigns = await prisma.campaign.deleteMany({ where: { isDemo: true } });
  const artists = await prisma.artist.deleteMany({ where: { isDemo: true } });

  const audit = await prisma.auditLog.create({
    data: {
      action: "delete_demo_data",
      entityType: "global",
      entityId: "demo",
      userId: adminEmail,
      details: {
        artists: artists.count,
        campaigns: campaigns.count,
        opportunities: opportunities.count,
        epks: epks.count,
        venuesPreserved: true,
        contactsPreserved: true,
      },
    },
  });

  return Response.json({
    ok: true,
    deleted: {
      artists: artists.count,
      campaigns: campaigns.count,
      opportunities: opportunities.count,
      epks: epks.count,
    },
    total: artists.count + campaigns.count + opportunities.count + epks.count,
    preserved: { venues: true, contacts: true },
    auditLogId: audit.id,
  });
}
