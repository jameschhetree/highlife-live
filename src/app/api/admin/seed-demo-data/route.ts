// POST /api/admin/seed-demo-data
// Re-seeds the database with the canonical demo artists/campaigns/opportunities/EPKs
// from admin-data.ts. Idempotent (uses upsert) — safe to re-run.
//
// Owner-admin only. Pairs with /api/admin/delete-demo-data so the whole
// delete→re-seed→delete cycle works from the Settings UI without CLI access.
//
// What this seeds: Artist, Campaign, Opportunity, EPK (the placeholder
// records that delete-demo-data is built to wipe). Does NOT touch Venue or
// Contact — those are real data per the 2026-06-03 Dok directive.

import { prisma } from "@/lib/db";
import { isOwnerAdminEmail, getAdminEmailFromRequest } from "@/lib/admin-permissions";
import {
  demoArtists,
  demoCampaigns,
  demoOpportunities,
  demoEpks,
} from "@/lib/admin-data";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  if (!prisma) return Response.json({ error: "DB not connected" }, { status: 503 });
  const adminEmail = getAdminEmailFromRequest(request);
  if (!isOwnerAdminEmail(adminEmail)) {
    return Response.json({ error: "Forbidden — owner-admin only" }, { status: 403 });
  }

  // Order matters for FK refs: artists first (campaigns reference them, etc.)
  let artistCount = 0;
  for (const a of demoArtists) {
    await prisma.artist.upsert({
      where: { id: a.id },
      update: {},
      create: {
        id: a.id,
        name: a.name,
        status: a.status,
        legalName: a.legalName,
        email: a.email,
        phone: a.phone,
        managerContact: a.managerContact,
        primaryGenre: a.primaryGenre,
        secondaryGenres: a.secondaryGenres,
        performanceType: a.performanceType,
        typicalSetLength: a.typicalSetLength,
        bookingFeeRange: a.bookingFeeRange,
        travelWillingness: a.travelWillingness,
        targetVenueTypes: a.targetVenueTypes,
        ageDemoAppeal: a.ageDemoAppeal,
        cleanExplicit: a.cleanExplicit,
        bio: a.bio,
        shortPitch: a.shortPitch,
        pressQuotes: a.pressQuotes,
        internalNotes: a.internalNotes,
        image: a.image,
        socialInstagram: a.socials?.instagram ?? "",
        socialTiktok: a.socials?.tiktok ?? "",
        socialYoutube: a.socials?.youtube ?? "",
        socialSpotify: a.socials?.spotify ?? "",
        socialAppleMusic: a.socials?.appleMusic ?? "",
        socialSoundcloud: a.socials?.soundcloud ?? "",
        socialWebsite: a.socials?.website ?? "",
        socialLinktree: a.socials?.linktree ?? "",
        isDemo: true,
      },
    });
    artistCount++;
  }

  let campaignCount = 0;
  for (const c of demoCampaigns) {
    await prisma.campaign.upsert({
      where: { id: c.id },
      update: {},
      create: {
        id: c.id,
        name: c.name,
        artistId: c.artistId,
        targetMarket: c.targetMarket,
        targetSegment: c.targetSegment,
        status: c.status,
        outreachPlatform: c.outreachPlatform,
        objective: c.objective,
        contactCount: c.contactCount,
        emailSequence: JSON.parse(JSON.stringify(c.emailSequence ?? [])),
        owner: c.owner,
        createdDate: c.createdDate,
        approvedBy: c.approvedBy ?? null,
        sentDate: c.sentDate ?? null,
        notes: c.notes,
        isDemo: true,
      },
    });
    campaignCount++;
  }

  let oppCount = 0;
  for (const o of demoOpportunities) {
    await prisma.opportunity.upsert({
      where: { id: o.id },
      update: {},
      create: {
        id: o.id,
        artistId: o.artistId,
        venueId: o.venueId,
        campaignId: o.campaignId ?? null,
        eventDate: o.eventDate ? new Date(o.eventDate) : null,
        proposedFee: o.proposedFee,
        expectedFee: o.expectedFee,
        confirmedFee: o.confirmedFee ?? null,
        status: o.status,
        probability: o.probability,
        nextTask: o.nextTask,
        owner: o.owner,
        notes: o.notes,
        isDemo: true,
      },
    });
    oppCount++;
  }

  let epkCount = 0;
  for (const e of demoEpks) {
    await prisma.ePK.upsert({
      where: { id: e.id },
      update: {},
      create: {
        id: e.id,
        artistId: e.artistId,
        status: e.status,
        publishUrl: e.publishUrl ?? null,
        isDemo: true,
      },
    });
    epkCount++;
  }

  await prisma.auditLog.create({
    data: {
      action: "seed_demo_data",
      entityType: "global",
      entityId: "demo",
      userId: adminEmail,
      details: { artists: artistCount, campaigns: campaignCount, opportunities: oppCount, epks: epkCount },
    },
  });

  return Response.json({
    ok: true,
    seeded: { artists: artistCount, campaigns: campaignCount, opportunities: oppCount, epks: epkCount },
    total: artistCount + campaignCount + oppCount + epkCount,
  });
}
