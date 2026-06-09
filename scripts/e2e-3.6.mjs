// Phase 3.6 end-to-end trigger sequence — exercises every link in Dok's chain
// against the live database. Prints a numbered pass/fail per step.
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const p = new PrismaClient({ adapter });

const stamp = Date.now();
const TAG = `e2e-${stamp}`;

const log = (n, ok, msg) =>
  console.log(`${ok ? "✓" : "✗"} step ${n}: ${msg}`);

let venueLoginId = null;
let inquiryId = null;
let eventId = null;
let agentLoginId = null;
let artistId = null;

try {
  // 1. Venue requests a login
  const req = await p.partnerLoginRequest.create({
    data: {
      accountType: "Venue",
      organizationName: `${TAG} Test Venue`,
      address: "123 E2E St, Gaithersburg, MD 20878",
      role: "Talent Buyer",
      contactName: "E2E Buyer",
      workEmail: `buyer-${stamp}@e2e.test`,
      requestedLoginEmail: `buyer-${stamp}@e2e.test`,
      workPhone: "240-555-0000",
    },
  });
  log(1, true, `PartnerLoginRequest ${req.id} for "${req.organizationName}"`);

  // 2. Admin adds venue via Workflow A endpoint logic — replicate inline
  const venue = await p.venue.create({
    data: {
      name: req.organizationName,
      contactPerson: req.contactName,
      email: req.workEmail,
      phone: req.workPhone,
      address: req.address,
      city: "Gaithersburg",
      state: "MD",
      source: "Partner Request",
      reviewStatus: "Needs Review",
      isDemo: false,
    },
  });
  const venueLogin = await p.venueLogin.create({
    data: {
      email: req.requestedLoginEmail,
      passwordHash: "$2b$10$ZZZZZZZZZZZZZZZZZZZZZ.ZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZ",
      displayName: req.contactName,
      organizationName: req.organizationName,
      accountType: "Venue",
      sourceRequestId: req.id,
      isActive: true,
    },
  });
  venueLoginId = venueLogin.id;
  log(2, true, `Venue ${venue.id} + VenueLogin ${venueLogin.id} created from request`);

  // 3. Artist audition request + admin adds artist
  const aud = await p.agentApplication.create({
    data: {
      classification: "Artist",
      fullName: "E2E Test Artist",
      actStageName: `${TAG} Artist`,
      phone: "240-555-1111",
      email: `artist-${stamp}@e2e.test`,
      source: "external_artist_request",
    },
  });
  const artist = await p.artist.create({
    data: {
      name: `${TAG} Artist`,
      status: "Active",
      isDemo: false,
      image: "https://placehold.co/400x400/000/fff?text=E2E",
      shortPitch: "End-to-end test artist",
    },
  });
  artistId = artist.id;
  log(3, true, `Audition ${aud.id} + Artist ${artist.id} on roster`);

  // 4. Roster query — does the artist appear?
  const rosterRows = await p.artist.findMany({
    where: { status: { in: ["Active", "Priority"] }, isDemo: false },
    select: { id: true, name: true, image: true },
  });
  const onRoster = rosterRows.find((r) => r.id === artist.id);
  log(4, !!onRoster && !!onRoster.image, `Artist on roster (name="${onRoster?.name}", has image=${!!onRoster?.image})`);

  // 5. Venue submits inquiry via partner portal
  const inquiryCount = await p.inquiry.count();
  const inquiryNumber = `HL-${10000 + inquiryCount + 1}`;
  const inq = await p.inquiry.create({
    data: {
      inquiryNumber,
      source: "venue_partner",
      venueLoginId: venueLogin.id,
      artistSlug: artist.id,
      artistName: artist.name,
      venueName: venue.name,
      venueAddress: venue.address,
      eventDate: "2026-08-15",
      contactName: req.contactName,
      contactEmail: req.workEmail,
      contactPhone: req.workPhone,
      eventDescription: "Test Saturday show",
      messageToAgent: "End-to-end automated test inquiry. Please ignore.",
      status: "New",
    },
  });
  inquiryId = inq.id;
  log(5, inq.venueLoginId === venueLogin.id, `Inquiry ${inq.id} (${inq.inquiryNumber}) linked to venueLoginId`);

  // 6. Admin marks inquiry seen → Reviewed
  const reviewed = await p.inquiry.update({
    where: { id: inq.id },
    data: { status: "Reviewed" },
  });
  log(6, reviewed.status === "Reviewed", `Inquiry status now "${reviewed.status}"`);

  // 7. Partner-portal lookup uses venueLoginId
  const partnerView = await p.inquiry.findFirst({
    where: { id: inq.id, venueLoginId: venueLogin.id },
    select: { id: true, status: true },
  });
  log(7, partnerView?.status === "Reviewed", `Partner portal scoped lookup returns "${partnerView?.status}"`);

  // 8. Venue adds a note
  const venueNote = await p.inquiryNote.create({
    data: {
      inquiryId: inq.id,
      authorType: "venue",
      authorEmail: venueLogin.email,
      authorName: venueLogin.displayName,
      body: "Venue's first note via e2e test.",
    },
  });
  log(8, !!venueNote.id, `InquiryNote ${venueNote.id} from venue`);

  // 9. Admin reads notes
  const adminVisible = await p.inquiryNote.findMany({
    where: { inquiryId: inq.id },
    orderBy: { createdAt: "asc" },
  });
  log(9, adminVisible.length === 1, `Admin sees ${adminVisible.length} note(s) in thread`);

  // 10. Admin reply (admin authorType, visible to venue)
  await p.inquiryNote.create({
    data: {
      inquiryId: inq.id,
      authorType: "admin",
      authorEmail: "jaco@highlifedmv.com",
      authorName: "Jaco",
      body: "Admin reply — we have you scheduled.",
    },
  });
  const venueVisible = await p.inquiryNote.findMany({
    where: { inquiryId: inq.id, authorType: { in: ["venue", "admin"] } },
  });
  log(10, venueVisible.length === 2, `Venue can see ${venueVisible.length} non-internal note(s) on next portal load`);

  // 11. Admin finalizes inquiry as event
  const event = await p.event.create({
    data: {
      title: `${artist.name} at ${venue.name}`,
      date: inq.eventDate,
      startAt: new Date(inq.eventDate),
      city: "Gaithersburg",
      venue: venue.name,
      featuredArtists: [artist.name],
      ticketStatus: "Available",
      isPast: false,
      published: true,
    },
  });
  eventId = event.id;
  const finalized = await p.inquiry.update({
    where: { id: inq.id },
    data: { status: "Booked", convertedEventId: event.id },
  });
  log(11, finalized.status === "Booked" && finalized.convertedEventId === event.id,
      `Inquiry Booked + convertedEventId=${event.id}`);

  // 12. Event appears in admin events query
  const adminEventsList = await p.event.findMany({ orderBy: { createdAt: "desc" }, take: 5 });
  log(12, adminEventsList.some((e) => e.id === event.id), `Event ${event.id} in /admin/events list`);

  // 13. Event appears on public /events (where published=true, isPast=false)
  const publicEventsList = await p.event.findMany({
    where: { published: true, isPast: false },
    orderBy: [{ startAt: "asc" }, { date: "asc" }],
  });
  log(13, publicEventsList.some((e) => e.id === event.id),
      `Event ${event.id} visible on public /events (${publicEventsList.length} total upcoming)`);

  // 14. Workflow C: agent requests venue contact access
  const agent = await p.agentLogin.create({
    data: {
      email: `agent-${stamp}@e2e.test`,
      passwordHash: "$2b$10$ZZZZZZZZZZZZZZZZZZZZZ.ZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZ",
      name: "E2E Agent",
      isActive: true,
    },
  });
  agentLoginId = agent.id;
  const accessReq = await p.venueContactAccessRequest.create({
    data: { agentLoginId: agent.id, venueId: venue.id, status: "Pending" },
  });
  log(14, accessReq.status === "Pending", `VenueContactAccessRequest ${accessReq.id} Pending`);

  // 15. Owner-admin approves → grant created, request marked Approved
  await p.venueContactAccessRequest.update({
    where: { id: accessReq.id },
    data: { status: "Approved", decidedAt: new Date(), decidedBy: "jaco@highlifedmv.com" },
  });
  await p.venueContactGrant.create({
    data: { agentLoginId: agent.id, venueId: venue.id, grantedBy: "jaco@highlifedmv.com" },
  });
  const myGrants = await p.venueContactGrant.findMany({ where: { agentLoginId: agent.id } });
  log(15, myGrants.length === 1 && myGrants[0].venueId === venue.id,
      `Agent has ${myGrants.length} grant(s); /api/venue-access GET would return [${venue.id}]`);

} catch (e) {
  console.error("CHAIN BROKE:", e);
  process.exit(1);
} finally {
  // Cleanup
  console.log("\n--- cleanup ---");
  if (inquiryId) {
    await p.inquiryNote.deleteMany({ where: { inquiryId } });
    await p.inquiry.delete({ where: { id: inquiryId } });
  }
  if (eventId) await p.event.delete({ where: { id: eventId } });
  if (venueLoginId) await p.venueLogin.delete({ where: { id: venueLoginId } });
  if (agentLoginId) {
    await p.venueContactAccessRequest.deleteMany({ where: { agentLoginId } });
    await p.venueContactGrant.deleteMany({ where: { agentLoginId } });
    await p.agentLogin.delete({ where: { id: agentLoginId } });
  }
  await p.venue.deleteMany({ where: { name: { startsWith: TAG } } });
  await p.artist.deleteMany({ where: { name: { startsWith: TAG } } });
  await p.partnerLoginRequest.deleteMany({ where: { organizationName: { startsWith: TAG } } });
  await p.agentApplication.deleteMany({ where: { actStageName: { startsWith: TAG } } });
  console.log("cleanup done.");
  await p.$disconnect();
}
