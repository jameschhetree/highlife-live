// GET /api/partner/me — return the logged-in partner's profile + linked Venue (if any).
// Used by /book to auto-populate venue name/address when an authed partner submits.
// Phase 3.9 Scope 12.

import { prisma } from "@/lib/db";
import { getVenueSessionId } from "@/lib/venue-session";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!prisma) return Response.json({ error: "DB not connected" }, { status: 503 });
  const venueLoginId = await getVenueSessionId();
  if (!venueLoginId) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const vl = await prisma.venueLogin.findUnique({
    where: { id: venueLoginId },
    select: {
      id: true,
      email: true,
      displayName: true,
      organizationName: true,
      accountType: true,
      venueId: true,
      venue: {
        select: {
          id: true,
          name: true,
          address: true,
          city: true,
          state: true,
          zipCode: true,
        },
      },
    },
  });
  if (!vl) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json(vl);
}
