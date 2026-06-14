// HighLife Live -- Database Seed Script
// Imports demo data from admin-data.ts and upserts into Postgres via Prisma.
// Run: npm run seed

import dotenv from "dotenv";
import path from "path";

// Load .env.local (Next.js convention)
dotenv.config({ path: path.resolve(__dirname, "../.env.local") });
// Fallback to .env
dotenv.config({ path: path.resolve(__dirname, "../.env") });
import crypto from "node:crypto";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import {
  demoArtists,
  demoVenues,
  demoCampaigns,
  demoOpportunities,
  demoEpks,
  demoResearchQueue,
} from "../src/lib/admin-data";

// Inline scrypt hash matching src/lib/password.ts
async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = await new Promise<Buffer>((resolve, reject) => {
    crypto.scrypt(password, salt, 64, { N: 16384, r: 8, p: 1 }, (err, derivedKey) => {
      if (err) reject(err);
      else resolve(derivedKey);
    });
  });
  return `${salt}:${hash.toString("hex")}`;
}

const url = process.env.DATABASE_URL || process.env.PRISMA_DATABASE_URL || process.env.POSTGRES_URL;
if (!url) {
  console.error("No DATABASE_URL or PRISMA_DATABASE_URL set in .env.local");
  process.exit(1);
}
const adapter = new PrismaPg({ connectionString: url });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding HighLife Live database...\n");

  // ── Artists ─────────────────────────────────────────────
  console.log(`Seeding ${demoArtists.length} artists...`);
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
        isDemo: true,
        // Flatten socials
        socialInstagram: a.socials.instagram ?? "",
        socialTiktok: a.socials.tiktok ?? "",
        socialYoutube: a.socials.youtube ?? "",
        socialSpotify: a.socials.spotify ?? "",
        socialAppleMusic: a.socials.appleMusic ?? "",
        socialSoundcloud: a.socials.soundcloud ?? "",
        socialWebsite: a.socials.website ?? "",
        socialLinktree: a.socials.linktree ?? "",
      },
    });
  }
  console.log("  Artists seeded.");

  // ── Venues ──────────────────────────────────────────────
  console.log(`Seeding ${demoVenues.length} venues...`);
  for (const v of demoVenues) {
    await prisma.venue.upsert({
      where: { id: v.id },
      update: {},
      create: {
        id: v.id,
        name: v.name,
        contactPerson: v.contactPerson,
        contactTitle: v.contactTitle,
        email: v.email,
        phone: v.phone,
        website: v.website,
        instagram: v.instagram,
        address: v.address,
        city: v.city,
        state: v.state,
        region: v.region,
        venueType: v.venueType,
        capacity: v.capacity,
        typicalGenres: v.typicalGenres,
        bookingEmail: v.bookingEmail,
        talentBuyerEmail: v.talentBuyerEmail,
        source: v.source,
        sourceUrl: v.sourceUrl,
        sourceDate: v.sourceDate,
        contactConfidence: v.contactConfidence,
        reviewStatus: v.reviewStatus,
        tags: v.tags,
        lastContacted: v.lastContacted ? new Date(v.lastContacted) : null,
        nextFollowUp: v.nextFollowUp ? new Date(v.nextFollowUp) : null,
        relationshipStatus: v.relationshipStatus,
        isDemo: true,
      },
    });
  }
  console.log("  Venues seeded.");

  // ── Campaigns ───────────────────────────────────────────
  console.log(`Seeding ${demoCampaigns.length} campaigns...`);
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
        emailSequence: JSON.parse(JSON.stringify(c.emailSequence)),
        owner: c.owner,
        createdDate: c.createdDate,
        approvedBy: c.approvedBy,
        sentDate: c.sentDate,
        notes: c.notes,
        isDemo: true,
      },
    });
  }
  console.log("  Campaigns seeded.");

  // ── Opportunities ───────────────────────────────────────
  console.log(`Seeding ${demoOpportunities.length} opportunities...`);
  for (const o of demoOpportunities) {
    await prisma.opportunity.upsert({
      where: { id: o.id },
      update: {},
      create: {
        id: o.id,
        artistId: o.artistId,
        venueId: o.venueId,
        campaignId: o.campaignId,
        eventDate: o.eventDate ? new Date(o.eventDate) : null,
        proposedFee: o.proposedFee,
        expectedFee: o.expectedFee,
        confirmedFee: o.confirmedFee,
        status: o.status,
        probability: o.probability,
        nextTask: o.nextTask,
        owner: o.owner,
        notes: o.notes,
        isDemo: true,
      },
    });
  }
  console.log("  Opportunities seeded.");

  // ── EPKs ────────────────────────────────────────────────
  console.log(`Seeding ${demoEpks.length} EPKs...`);
  for (const e of demoEpks) {
    await prisma.ePK.upsert({
      where: { id: e.id },
      update: {},
      create: {
        id: e.id,
        artistId: e.artistId,
        status: e.status,
        publishUrl: e.publishUrl,
        isDemo: true,
      },
    });
  }
  console.log("  EPKs seeded.");

  // ── Research Queue (Contact model) ──────────────────────
  console.log(`Seeding ${demoResearchQueue.length} research contacts...`);
  for (const r of demoResearchQueue) {
    await prisma.contact.upsert({
      where: { id: r.id },
      update: {},
      create: {
        id: r.id,
        name: r.name,
        email: r.email,
        organization: r.organization,
        role: r.role,
        sourceUrl: r.sourceUrl,
        sourceDate: r.sourceDate,
        region: r.region,
        venueType: r.venueType,
        action: r.action,
        notes: r.notes,
        isDemo: true,
      },
    });
  }
  console.log("  Research contacts seeded.");

  // ── Venue Logins (test account) ─────────────────────────
  console.log("Seeding test venue login...");
  const testPasswordHash = await hashPassword("testingVenues3307");
  await prisma.venueLogin.upsert({
    where: { email: "testvenue3307@gmail.com" },
    update: {},
    create: {
      email: "testvenue3307@gmail.com",
      passwordHash: testPasswordHash,
      displayName: "Venue Partner",
      organizationName: "Test Venue",
      accountType: "Venue",
      isActive: true,
    },
  });
  console.log("  Test venue login seeded.");

  console.log("\nSeed complete.");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error("Seed failed:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
