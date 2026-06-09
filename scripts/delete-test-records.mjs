// Phase 3.9 test/QA cleanup. Run AFTER scan-test-records.mjs preview.
// Deletes in FK-safe order so schema cascades + SetNulls behave cleanly.
// Excludes isDemo=true seed records (intentional demo flow data).
// Foolery + agentLogin liam2@agent.com added per Dok 2026-06-05 directive.

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const p = new PrismaClient({ adapter });

const TEST = "test";
const QA = "MURD-QA";

const result = {};

// ---- 1. Bookings (no inverse FKs depend on bookings except BookingMaterial Cascade) ----
const bookingDel = await p.booking.deleteMany({
  where: {
    OR: [
      { artistName: { contains: TEST, mode: "insensitive" } },
      { artistName: { startsWith: QA } },
      { venueName: { contains: TEST, mode: "insensitive" } },
      { venueName: { startsWith: QA } },
      { eventTitle: { contains: TEST, mode: "insensitive" } },
      { eventTitle: { startsWith: QA } },
    ],
  },
});
result.bookings = bookingDel.count;

// ---- 2. Events (Booking.eventId SetNull handles dangling refs) ----
const eventDel = await p.event.deleteMany({
  where: {
    OR: [
      { title: { contains: TEST, mode: "insensitive" } },
      { title: { startsWith: QA } },
      { venue: { contains: TEST, mode: "insensitive" } },
      { venue: { startsWith: QA } },
    ],
  },
});
result.events = eventDel.count;

// ---- 3. AuditionAssignments (no FK cascade on AgentApplication side) ----
const testAuditions = await p.agentApplication.findMany({
  where: {
    OR: [
      { actStageName: { contains: TEST, mode: "insensitive" } },
      { actStageName: { startsWith: QA } },
      { fullName: { contains: TEST, mode: "insensitive" } },
      { fullName: { startsWith: QA } },
      { email: { contains: TEST, mode: "insensitive" } },
    ],
  },
  select: { id: true },
});
const auditionIds = testAuditions.map((a) => a.id);
const assignmentDel = auditionIds.length
  ? await p.auditionAssignment.deleteMany({ where: { auditionId: { in: auditionIds } } })
  : { count: 0 };
result.auditionAssignments = assignmentDel.count;

const auditionDel = auditionIds.length
  ? await p.agentApplication.deleteMany({ where: { id: { in: auditionIds } } })
  : { count: 0 };
result.auditions = auditionDel.count;

// ---- 4. PartnerLoginRequests ----
const partnerDel = await p.partnerLoginRequest.deleteMany({
  where: {
    OR: [
      { organizationName: { contains: TEST, mode: "insensitive" } },
      { organizationName: { startsWith: QA } },
      { contactName: { contains: TEST, mode: "insensitive" } },
      { workEmail: { contains: TEST, mode: "insensitive" } },
    ],
  },
});
result.partnerRequests = partnerDel.count;

// ---- 5. VenueLogins (cascades PartnerInquiryHidden) ----
const venueLoginDel = await p.venueLogin.deleteMany({
  where: {
    OR: [
      { email: { contains: TEST, mode: "insensitive" } },
      { displayName: { contains: TEST, mode: "insensitive" } },
      { displayName: { startsWith: QA } },
      { organizationName: { contains: TEST, mode: "insensitive" } },
      { organizationName: { startsWith: QA } },
    ],
  },
});
result.venueLogins = venueLoginDel.count;

// ---- 6. AgentLogins (cascades EventCardRequest, AgentArtistAssignment, AuditionAssignment, etc) ----
// Includes liam2@agent.com per Dok directive.
const agentLoginDel = await p.agentLogin.deleteMany({
  where: {
    OR: [
      { email: { contains: TEST, mode: "insensitive" } },
      { name: { contains: TEST, mode: "insensitive" } },
      { name: { startsWith: QA } },
      { email: "liam2@agent.com" },
    ],
  },
});
result.agentLogins = agentLoginDel.count;

// ---- 7. Inquiries (cascades InquiryNote, PartnerInquiryHidden) ----
// Also kill Foolery-named test inquiries with venueName "Jeremy Test Venue" / "Jeremy Offer Test".
const inquiryDel = await p.inquiry.deleteMany({
  where: {
    OR: [
      { artistName: { contains: TEST, mode: "insensitive" } },
      { artistName: { startsWith: QA } },
      { venueName: { contains: TEST, mode: "insensitive" } },
      { venueName: { startsWith: QA } },
      { contactName: { contains: TEST, mode: "insensitive" } },
      { contactName: { startsWith: QA } },
      { inquiryNumber: { startsWith: "HL-99" } },
    ],
  },
});
result.inquiries = inquiryDel.count;

// ---- 8. Venues (cascades VenueTimelineEvent) ----
const venueDel = await p.venue.deleteMany({
  where: {
    isDemo: false,
    OR: [
      { name: { contains: TEST, mode: "insensitive" } },
      { name: { startsWith: QA } },
    ],
  },
});
result.venues = venueDel.count;

// ---- 9. Artists (cascades campaigns, opportunities, epks, socialStats; SetNull on Booking) ----
// Foolery added per Dok directive — handled as exact name match in addition to the LIKE patterns.
const artistDel = await p.artist.deleteMany({
  where: {
    isDemo: false,
    OR: [
      { name: { contains: TEST, mode: "insensitive" } },
      { name: { startsWith: QA } },
      { name: "Foolery" },
    ],
  },
});
result.artists = artistDel.count;

console.log(JSON.stringify(result, null, 2));
await p.$disconnect();
