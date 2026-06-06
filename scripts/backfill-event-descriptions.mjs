// Backfill: for Events with a null description, copy from their source Inquiry.
// Source Inquiry resolved via Inquiry.convertedEventId = Event.id.
// Idempotent — only writes when current value is null AND the source has text.

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const p = new PrismaClient({ adapter });

const events = await p.event.findMany({
  where: { OR: [{ description: null }, { address: null }] },
  select: { id: true, description: true, address: true },
});

const inquiries = await p.inquiry.findMany({
  where: { convertedEventId: { in: events.map((e) => e.id) } },
  select: { id: true, convertedEventId: true, eventDescription: true, venueAddress: true },
});
const byEvent = new Map(inquiries.map((i) => [i.convertedEventId, i]));

let descCount = 0;
let addrCount = 0;
for (const e of events) {
  const src = byEvent.get(e.id);
  if (!src) continue;
  const data = {};
  if (!e.description && src.eventDescription?.trim()) {
    data.description = src.eventDescription;
    descCount++;
  }
  if (!e.address && src.venueAddress?.trim()) {
    data.address = src.venueAddress;
    addrCount++;
  }
  if (Object.keys(data).length > 0) {
    await p.event.update({ where: { id: e.id }, data });
  }
}

console.log(JSON.stringify({ events: events.length, descriptionsBackfilled: descCount, addressesBackfilled: addrCount }, null, 2));
await p.$disconnect();
