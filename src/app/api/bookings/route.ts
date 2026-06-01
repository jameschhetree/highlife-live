// GET /api/bookings -- list bookings, optional ?status=X and ?contactEmail=X filters
// POST /api/bookings -- create a new booking + send email notification

import { prisma } from "@/lib/db";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!prisma) {
    return Response.json({ error: "Database not connected" }, { status: 503 });
  }

  const status = request.nextUrl.searchParams.get("status");
  const contactEmail = request.nextUrl.searchParams.get("contactEmail");

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (contactEmail) where.contactEmail = contactEmail;

  const rows = await prisma.booking.findMany({
    where,
    orderBy: { submittedAt: "desc" },
  });

  return Response.json(rows);
}

export async function POST(request: NextRequest) {
  if (!prisma) {
    return Response.json({ error: "Database not connected" }, { status: 503 });
  }

  const body = await request.json();

  const required = [
    "artistSlug",
    "artistName",
    "venueName",
    "venueAddress",
    "eventDate",
    "proposedOffer",
    "contactName",
    "contactEmail",
    "contactPhone",
  ];

  for (const field of required) {
    if (!body[field] || typeof body[field] !== "string" || !body[field].trim()) {
      return Response.json(
        { error: `Missing required field: ${field}` },
        { status: 400 }
      );
    }
  }

  const booking = await prisma.booking.create({
    data: {
      artistSlug: body.artistSlug,
      artistName: body.artistName,
      venueName: body.venueName,
      venueAddress: body.venueAddress,
      eventDate: body.eventDate,
      proposedOffer: body.proposedOffer,
      contactName: body.contactName,
      contactEmail: body.contactEmail,
      contactPhone: body.contactPhone,
      eventDescription: body.eventDescription || "",
      messageToAgent: body.messageToAgent || "",
      source: body.source === "authenticated" ? "authenticated" : "public",
      status: "New",
    },
  });

  // Send email notification (non-blocking -- don't fail the POST)
  sendNotificationEmail(booking).catch((err) => {
    console.error("[Booking email] Failed to send notification:", err);
  });

  return Response.json({ id: booking.id, status: booking.status }, { status: 201 });
}

async function sendNotificationEmail(booking: {
  id: string;
  artistName: string;
  venueName: string;
  venueAddress: string;
  eventDate: string;
  proposedOffer: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  eventDescription: string;
  messageToAgent: string;
  source: string;
  submittedAt: Date;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("[Booking email] RESEND_API_KEY not set, skipping email");
    return;
  }

  const { Resend } = await import("resend");
  const resend = new Resend(apiKey);

  const adminUrl = `https://highlife-live.vercel.app/admin/bookings/${booking.id}`;
  const submittedDate = new Date(booking.submittedAt).toLocaleString("en-US", {
    timeZone: "America/New_York",
    dateStyle: "medium",
    timeStyle: "short",
  });

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 24px; background: #0a0a0a; color: #e4e4e7;">
      <div style="border-bottom: 1px solid #27272a; padding-bottom: 20px; margin-bottom: 24px;">
        <h1 style="font-size: 20px; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase; color: #fafafa; margin: 0;">
          New Booking Inquiry
        </h1>
        <p style="font-size: 13px; color: #71717a; margin: 6px 0 0 0;">
          ${submittedDate} &middot; Source: ${booking.source}
        </p>
      </div>

      <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #18181b; color: #71717a; font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; width: 140px;">Artist</td>
          <td style="padding: 10px 0; border-bottom: 1px solid #18181b; color: #fafafa; font-size: 14px;">${booking.artistName}</td>
        </tr>
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #18181b; color: #71717a; font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em;">Venue</td>
          <td style="padding: 10px 0; border-bottom: 1px solid #18181b; color: #fafafa; font-size: 14px;">${booking.venueName}</td>
        </tr>
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #18181b; color: #71717a; font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em;">Address</td>
          <td style="padding: 10px 0; border-bottom: 1px solid #18181b; color: #fafafa; font-size: 14px;">${booking.venueAddress}</td>
        </tr>
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #18181b; color: #71717a; font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em;">Event Date</td>
          <td style="padding: 10px 0; border-bottom: 1px solid #18181b; color: #fafafa; font-size: 14px;">${booking.eventDate}</td>
        </tr>
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #18181b; color: #71717a; font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em;">Proposed Offer</td>
          <td style="padding: 10px 0; border-bottom: 1px solid #18181b; color: #fafafa; font-size: 14px; font-weight: 600;">${booking.proposedOffer}</td>
        </tr>
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #18181b; color: #71717a; font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em;">Contact</td>
          <td style="padding: 10px 0; border-bottom: 1px solid #18181b; color: #fafafa; font-size: 14px;">${booking.contactName} &middot; ${booking.contactEmail} &middot; ${booking.contactPhone}</td>
        </tr>
      </table>

      ${booking.eventDescription ? `
      <div style="margin-bottom: 16px;">
        <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #71717a; margin-bottom: 6px;">Event Description</div>
        <div style="font-size: 14px; color: #d4d4d8; line-height: 1.6;">${booking.eventDescription}</div>
      </div>
      ` : ""}

      ${booking.messageToAgent ? `
      <div style="margin-bottom: 24px;">
        <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #71717a; margin-bottom: 6px;">Message to Agent</div>
        <div style="font-size: 14px; color: #d4d4d8; line-height: 1.6;">${booking.messageToAgent}</div>
      </div>
      ` : ""}

      <a href="${adminUrl}" style="display: inline-block; padding: 12px 28px; background: linear-gradient(135deg, #ec4899, #8b5cf6); color: #fff; text-decoration: none; border-radius: 9999px; font-size: 13px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase;">
        View in Admin
      </a>

      <p style="margin-top: 28px; padding-top: 20px; border-top: 1px solid #18181b; font-size: 11px; color: #52525b;">
        HighLife Live &middot; Booking Pipeline
      </p>
    </div>
  `;

  await resend.emails.send({
    from: "HighLife Live <bookings@highlifedmv.com>",
    to: ["liam@highlifedmv.com"],
    subject: `New booking inquiry: ${booking.artistName} for ${booking.venueName}`,
    html,
  });
}
