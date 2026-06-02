// POST /api/inquiries -- create a new inquiry. For venue_partner submissions, the venueLoginId
//   is derived from the signed httpOnly session cookie, NEVER trusted from the client body.
// GET  /api/inquiries -- venue partner listing own inquiries. Returns 401 without a valid
//   venue session cookie. Lookup is keyed off the authenticated VenueLogin.id from the cookie.

import { prisma } from "@/lib/db";
import { getVenueSessionId } from "@/lib/venue-session";
import { sendEmail, SENDERS } from "@/lib/email";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

/** Generate a human-readable inquiry number like HL-10001 */
async function nextInquiryNumber(): Promise<string> {
  if (!prisma) return `HL-${Date.now().toString().slice(-5)}`;
  const last = await prisma.inquiry.findFirst({
    orderBy: { createdAt: "desc" },
    select: { inquiryNumber: true },
  });
  let seq = 10001;
  if (last?.inquiryNumber) {
    const num = parseInt(last.inquiryNumber.replace("HL-", ""), 10);
    if (!isNaN(num)) seq = num + 1;
  }
  return `HL-${seq}`;
}

export async function GET() {
  if (!prisma) return Response.json({ error: "DB not connected" }, { status: 503 });

  const venueLoginId = await getVenueSessionId();
  if (!venueLoginId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await prisma.inquiry.findMany({
    where: { venueLoginId },
    orderBy: { submittedAt: "desc" },
  });
  return Response.json(rows);
}

export async function POST(request: NextRequest) {
  if (!prisma) return Response.json({ error: "DB not connected" }, { status: 503 });

  const body = await request.json();

  // Basic honeypot: if a field named "website" is filled, reject silently
  if (body.website) {
    return Response.json({ id: "ok", inquiryNumber: "HL-00000" }, { status: 201 });
  }

  const required = ["artistSlug", "artistName", "venueName", "eventDate", "contactName", "contactEmail", "contactPhone"];
  for (const field of required) {
    if (!body[field] || typeof body[field] !== "string" || !body[field].trim()) {
      return Response.json({ error: `Missing required field: ${field}` }, { status: 400 });
    }
  }

  // venue_partner classification ALWAYS comes from the authenticated cookie.
  // A client claiming source=venue_partner without a valid session is downgraded to public.
  const sessionVenueId = await getVenueSessionId();
  const source = body.source === "venue_partner" && sessionVenueId ? "venue_partner" : "public";
  const inquiryNumber = await nextInquiryNumber();

  const inquiry = await prisma.inquiry.create({
    data: {
      inquiryNumber,
      source,
      venueLoginId: source === "venue_partner" ? sessionVenueId : null,
      artistSlug: body.artistSlug,
      artistName: body.artistName,
      venueName: body.venueName,
      venueAddress: body.venueAddress || "",
      eventDate: body.eventDate,
      contactName: body.contactName,
      contactEmail: body.contactEmail,
      contactPhone: body.contactPhone,
      eventDescription: body.eventDescription || "",
      messageToAgent: body.messageToAgent || "",
      bookingOffer: body.bookingOffer ? String(body.bookingOffer).slice(0, 100) : null,
      status: "New",
    },
  });

  // Send notification emails to owners
  try {
    await sendOwnerNotification(inquiry);
  } catch (err) {
    console.error("[Inquiry email] Failed:", err);
  }

  // Send confirmation email to submitter (public only)
  if (source === "public") {
    try {
      await sendConfirmationEmail(inquiry);
    } catch (err) {
      console.error("[Inquiry confirmation email] Failed:", err);
    }
  }

  return Response.json({ id: inquiry.id, inquiryNumber: inquiry.inquiryNumber }, { status: 201 });
}

async function sendOwnerNotification(inquiry: {
  id: string;
  inquiryNumber: string;
  artistName: string;
  venueName: string;
  contactName: string;
  contactEmail: string;
  source: string;
  submittedAt: Date;
}) {
  const submittedDate = new Date(inquiry.submittedAt).toLocaleString("en-US", {
    timeZone: "America/New_York",
    dateStyle: "medium",
    timeStyle: "short",
  });
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 24px; background: #0a0a0a; color: #e4e4e7;">
      <h1 style="font-size: 20px; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase; color: #fafafa; margin: 0 0 16px 0;">
        New Inquiry ${inquiry.inquiryNumber}
      </h1>
      <p style="font-size: 13px; color: #71717a; margin: 0 0 24px 0;">
        ${submittedDate} &middot; Source: ${inquiry.source}
      </p>
      <table style="width: 100%; border-collapse: collapse;">
        <tr><td style="padding: 8px 0; color: #71717a; font-size: 11px; text-transform: uppercase; width: 120px;">Artist</td><td style="padding: 8px 0; color: #fafafa; font-size: 14px;">${inquiry.artistName}</td></tr>
        <tr><td style="padding: 8px 0; color: #71717a; font-size: 11px; text-transform: uppercase;">Venue</td><td style="padding: 8px 0; color: #fafafa; font-size: 14px;">${inquiry.venueName}</td></tr>
        <tr><td style="padding: 8px 0; color: #71717a; font-size: 11px; text-transform: uppercase;">Contact</td><td style="padding: 8px 0; color: #fafafa; font-size: 14px;">${inquiry.contactName} &middot; ${inquiry.contactEmail}</td></tr>
      </table>
      <p style="margin-top: 20px; font-size: 11px; color: #52525b;">HighLife Live &middot; Inquiry Pipeline</p>
    </div>
  `;
  await sendEmail({
    from: SENDERS.ownerAlert,
    to: ["liam@highlifedmv.com", "jaco@highlifedmv.com"],
    subject: `New inquiry ${inquiry.inquiryNumber}: ${inquiry.artistName} for ${inquiry.venueName}`,
    html,
  });
}

async function sendConfirmationEmail(inquiry: {
  inquiryNumber: string;
  artistName: string;
  venueName: string;
  contactName: string;
  contactEmail: string;
}) {
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 24px; background: #0a0a0a; color: #e4e4e7;">
      <h1 style="font-size: 20px; font-weight: 700; letter-spacing: 0.05em; color: #fafafa; margin: 0 0 16px 0;">
        Inquiry Received
      </h1>
      <p style="font-size: 14px; color: #d4d4d8; margin: 0 0 8px 0;">
        Hi ${inquiry.contactName},
      </p>
      <p style="font-size: 14px; color: #d4d4d8; line-height: 1.6; margin: 0 0 20px 0;">
        We received your booking inquiry for <strong>${inquiry.artistName}</strong> at ${inquiry.venueName}. Your inquiry number is <strong>${inquiry.inquiryNumber}</strong>.
      </p>
      <p style="font-size: 14px; color: #d4d4d8; line-height: 1.6; margin: 0 0 20px 0;">
        Our team will review your request and follow up if the opportunity is a strong fit for the artist and event.
      </p>
      <p style="font-size: 11px; color: #52525b; margin-top: 28px; padding-top: 16px; border-top: 1px solid #18181b;">
        HighLife Live &middot; Booking &amp; Artist Development
      </p>
    </div>
  `;
  await sendEmail({
    from: SENDERS.publicConfirmation,
    to: inquiry.contactEmail,
    subject: `Inquiry ${inquiry.inquiryNumber} received - HighLife Live`,
    html,
  });
}
