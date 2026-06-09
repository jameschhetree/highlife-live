import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const p = new PrismaClient({ adapter });

const counts = {
  eventCardRequest: await p.eventCardRequest.count(),
  bookingMaterial: await p.bookingMaterial.count(),
  venueTimelineEvent: await p.venueTimelineEvent.count(),
  partnerInquiryHidden: await p.partnerInquiryHidden.count(),
};

const sample = {
  booking: await p.booking.findFirst({
    select: {
      id: true,
      eventTitle: true,
      eventId: true,
      inquiryId: true,
      artistId: true,
      venueId: true,
      agentLoginId: true,
      ticketsSold: true,
      eventDescriptionPublic: true,
    },
  }),
  inquiry: await p.inquiry.findFirst({ select: { id: true, workingSubstatus: true } }),
  venue: await p.venue.findFirst({ select: { id: true, zipCode: true } }),
  agentApp: await p.agentApplication.findFirst({ select: { id: true, actDescription: true } }),
  venueLogin: await p.venueLogin.findFirst({ select: { id: true, venueId: true } }),
  event: await p.event.findFirst({
    select: {
      id: true,
      description: true,
      showDescription: true,
      customBannerEnabled: true,
      featuredArtistIds: true,
      externalArtists: true,
    },
  }),
};

console.log(JSON.stringify({ counts, sample }, null, 2));
await p.$disconnect();
