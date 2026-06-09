// Count test/QA records across every table that can hold demo-or-QA garbage.
// Pattern: name/title/email/etc. contains "test" (case-insensitive) OR starts with
// "MURD-QA". Does NOT include isDemo=true seed records — those serve the demo flow.

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const p = new PrismaClient({ adapter });

const TEST = "test";
const QA = "MURD-QA";

async function previewEvents() {
  return p.event.findMany({
    where: {
      OR: [
        { title: { contains: TEST, mode: "insensitive" } },
        { title: { startsWith: QA } },
        { venue: { contains: TEST, mode: "insensitive" } },
        { venue: { startsWith: QA } },
      ],
    },
    select: { id: true, title: true, venue: true, date: true, published: true },
  });
}

async function previewBookings() {
  return p.booking.findMany({
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
    select: { id: true, artistName: true, venueName: true, eventTitle: true, source: true },
  });
}

async function previewInquiries() {
  return p.inquiry.findMany({
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
    select: { id: true, inquiryNumber: true, artistName: true, venueName: true, status: true },
  });
}

async function previewArtists() {
  return p.artist.findMany({
    where: {
      isDemo: false,
      OR: [
        { name: { contains: TEST, mode: "insensitive" } },
        { name: { startsWith: QA } },
      ],
    },
    select: { id: true, name: true, status: true, isDemo: true },
  });
}

async function previewVenues() {
  return p.venue.findMany({
    where: {
      isDemo: false,
      OR: [
        { name: { contains: TEST, mode: "insensitive" } },
        { name: { startsWith: QA } },
      ],
    },
    select: { id: true, name: true, city: true, isDemo: true },
  });
}

async function previewVenueLogins() {
  return p.venueLogin.findMany({
    where: {
      OR: [
        { email: { contains: TEST, mode: "insensitive" } },
        { displayName: { contains: TEST, mode: "insensitive" } },
        { displayName: { startsWith: QA } },
        { organizationName: { contains: TEST, mode: "insensitive" } },
        { organizationName: { startsWith: QA } },
      ],
    },
    select: { id: true, email: true, displayName: true, organizationName: true },
  });
}

async function previewAgentLogins() {
  return p.agentLogin.findMany({
    where: {
      OR: [
        { email: { contains: TEST, mode: "insensitive" } },
        { name: { contains: TEST, mode: "insensitive" } },
        { name: { startsWith: QA } },
      ],
    },
    select: { id: true, email: true, name: true },
  });
}

async function previewAuditions() {
  return p.agentApplication.findMany({
    where: {
      OR: [
        { actStageName: { contains: TEST, mode: "insensitive" } },
        { actStageName: { startsWith: QA } },
        { fullName: { contains: TEST, mode: "insensitive" } },
        { fullName: { startsWith: QA } },
        { email: { contains: TEST, mode: "insensitive" } },
      ],
    },
    select: { id: true, actStageName: true, fullName: true, email: true, status: true },
  });
}

async function previewPartnerRequests() {
  return p.partnerLoginRequest.findMany({
    where: {
      OR: [
        { organizationName: { contains: TEST, mode: "insensitive" } },
        { organizationName: { startsWith: QA } },
        { contactName: { contains: TEST, mode: "insensitive" } },
        { workEmail: { contains: TEST, mode: "insensitive" } },
      ],
    },
    select: { id: true, organizationName: true, contactName: true, workEmail: true, status: true },
  });
}

const [events, bookings, inquiries, artists, venues, venueLogins, agentLogins, auditions, partnerRequests] =
  await Promise.all([
    previewEvents(),
    previewBookings(),
    previewInquiries(),
    previewArtists(),
    previewVenues(),
    previewVenueLogins(),
    previewAgentLogins(),
    previewAuditions(),
    previewPartnerRequests(),
  ]);

console.log(JSON.stringify({
  summary: {
    events: events.length,
    bookings: bookings.length,
    inquiries: inquiries.length,
    artists: artists.length,
    venues: venues.length,
    venueLogins: venueLogins.length,
    agentLogins: agentLogins.length,
    auditions: auditions.length,
    partnerRequests: partnerRequests.length,
  },
  samples: {
    events: events.slice(0, 5),
    bookings: bookings.slice(0, 5),
    inquiries: inquiries.slice(0, 5),
    artists: artists.slice(0, 5),
    venues: venues.slice(0, 5),
    venueLogins: venueLogins.slice(0, 5),
    agentLogins: agentLogins.slice(0, 5),
    auditions: auditions.slice(0, 5),
    partnerRequests: partnerRequests.slice(0, 5),
  },
}, null, 2));

await p.$disconnect();
