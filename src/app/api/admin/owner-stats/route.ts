// GET /api/admin/owner-stats -- aggregated stats for owner-special dashboard

import { prisma } from "@/lib/db";
import { getAdminEmailFromRequest, isOwnerAdminEmail } from "@/lib/admin-permissions";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!prisma) return Response.json({ error: "DB not connected" }, { status: 503 });
  if (!isOwnerAdminEmail(getAdminEmailFromRequest(request))) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const [
    inquiryCount,
    newInquiryCount,
    partnerRequestCount,
    newPartnerRequestCount,
    venueLoginCount,
    agentLoginCount,
    auditionCount,
    newAuditionCount,
    subscriberCount,
    assignmentCount,
    artistCount,
  ] = await Promise.all([
    prisma.inquiry.count(),
    prisma.inquiry.count({ where: { status: "New" } }),
    prisma.partnerLoginRequest.count(),
    prisma.partnerLoginRequest.count({ where: { status: "New" } }),
    prisma.venueLogin.count({ where: { isActive: true } }),
    prisma.agentLogin.count({ where: { isActive: true } }),
    prisma.agentApplication.count(),
    prisma.agentApplication.count({ where: { status: "New" } }),
    prisma.emailSubscriber.count(),
    prisma.auditionAssignment.count(),
    prisma.artist.count(),
  ]);

  return Response.json({
    inquiries: { total: inquiryCount, new: newInquiryCount },
    partnerRequests: { total: partnerRequestCount, new: newPartnerRequestCount },
    venueLogins: venueLoginCount,
    agentLogins: agentLoginCount,
    auditions: { total: auditionCount, new: newAuditionCount },
    subscribers: subscriberCount,
    assignments: assignmentCount,
    artists: artistCount,
  });
}
