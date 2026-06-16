import { prisma } from "@/lib/db";
import { sendEmail, SENDERS } from "@/lib/email";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

const ACCOUNT_TYPES = new Set(["Venue", "Promoter"]);
const ROLES = new Set(["Owner", "Talent Buyer", "Promoter", "Venue Manager", "Event Coordinator", "Other"]);

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

interface RequestBody {
  accountType?: string;
  organizationName?: string;
  address?: string;
  role?: string;
  contactName?: string;
  workPhone?: string;
  mobilePhone?: string;
  workEmail?: string;
  requestedLoginEmail?: string;
  howHeard?: string;
  preferredGenre?: string;
  extraNotes?: string;
}

export async function POST(request: NextRequest) {
  if (!prisma) {
    return Response.json({ error: "Database not connected" }, { status: 503 });
  }

  const body = (await request.json()) as RequestBody;

  const accountType = (body.accountType ?? "").trim();
  const organizationName = (body.organizationName ?? "").trim();
  const address = (body.address ?? "").trim();
  const role = (body.role ?? "").trim();
  const contactName = (body.contactName ?? "").trim();
  const workPhone = (body.workPhone ?? "").trim();
  const mobilePhone = (body.mobilePhone ?? "").trim();
  const workEmail = (body.workEmail ?? "").trim().toLowerCase();
  const requestedLoginEmail = (body.requestedLoginEmail ?? "").trim().toLowerCase();
  const howHeard = (body.howHeard ?? "").trim();
  const preferredGenre = (body.preferredGenre ?? "").trim();
  const extraNotes = (body.extraNotes ?? "").trim();

  // Validation
  if (!ACCOUNT_TYPES.has(accountType)) {
    return Response.json({ error: "Please select a valid account type." }, { status: 400 });
  }
  if (!organizationName) {
    return Response.json({ error: accountType === "Venue" ? "Venue name is required." : "Promotion name is required." }, { status: 400 });
  }
  if (accountType === "Venue" && !address) {
    return Response.json({ error: "Address is required for venue accounts." }, { status: 400 });
  }
  if (!ROLES.has(role)) {
    return Response.json({ error: "Please select a valid role." }, { status: 400 });
  }
  if (!contactName) {
    return Response.json({ error: "Your name is required." }, { status: 400 });
  }
  if (!workPhone && !mobilePhone) {
    return Response.json({ error: "At least one phone number is required." }, { status: 400 });
  }
  if (!workEmail || !isValidEmail(workEmail)) {
    return Response.json({ error: "A valid work email is required." }, { status: 400 });
  }
  if (!requestedLoginEmail || !isValidEmail(requestedLoginEmail)) {
    return Response.json({ error: "A valid requested login email is required." }, { status: 400 });
  }

  const created = await prisma.partnerLoginRequest.create({
    data: {
      accountType,
      organizationName,
      address,
      role,
      contactName,
      workPhone,
      mobilePhone,
      workEmail,
      requestedLoginEmail,
      howHeard,
      preferredGenre,
      extraNotes,
      status: "New",
    },
  });

  // Send confirmation email to the requester
  try {
    await sendEmail({
      from: SENDERS.agentNotification,
      to: workEmail,
      subject: "Your Partner Login Request Has Been Received",
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 24px;">
          <h2 style="font-size: 20px; font-weight: 600; margin: 0 0 16px;">Thank you, ${contactName}</h2>
          <p style="font-size: 14px; color: #444; line-height: 1.6; margin: 0 0 12px;">
            We have received your partner login request for <strong>${organizationName}</strong>.
          </p>
          <p style="font-size: 14px; color: #444; line-height: 1.6; margin: 0 0 12px;">
            Our team will review your request and follow up shortly. You will receive login credentials once your account has been approved.
          </p>
          <p style="font-size: 13px; color: #888; margin: 24px 0 0;">
            HighLife Live<br/>
            <a href="https://highlifelive.com" style="color: #e91e8c; text-decoration: none;">highlifelive.com</a>
          </p>
        </div>
      `,
    });
  } catch (emailErr) {
    console.error("[partner-request] confirmation email failed:", emailErr);
  }

  // Send admin notification email
  try {
    await sendEmail({
      from: SENDERS.agentNotification,
      to: "admin@highlifelive.com",
      subject: `New Partner Login Request: ${organizationName}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px;">
          <h2 style="font-size: 18px; font-weight: 600; margin: 0 0 16px;">New Partner Login Request</h2>
          <table style="font-size: 13px; color: #333; line-height: 1.6; border-collapse: collapse; width: 100%;">
            <tr><td style="padding: 4px 12px 4px 0; color: #888; white-space: nowrap;">Type</td><td style="padding: 4px 0;">${accountType}</td></tr>
            <tr><td style="padding: 4px 12px 4px 0; color: #888; white-space: nowrap;">Organization</td><td style="padding: 4px 0;">${organizationName}</td></tr>
            <tr><td style="padding: 4px 12px 4px 0; color: #888; white-space: nowrap;">Contact</td><td style="padding: 4px 0;">${contactName} (${role})</td></tr>
            <tr><td style="padding: 4px 12px 4px 0; color: #888; white-space: nowrap;">Work Email</td><td style="padding: 4px 0;">${workEmail}</td></tr>
            <tr><td style="padding: 4px 12px 4px 0; color: #888; white-space: nowrap;">Login Email</td><td style="padding: 4px 0;">${requestedLoginEmail}</td></tr>
            ${workPhone ? `<tr><td style="padding: 4px 12px 4px 0; color: #888; white-space: nowrap;">Work Phone</td><td style="padding: 4px 0;">${workPhone}</td></tr>` : ""}
            ${mobilePhone ? `<tr><td style="padding: 4px 12px 4px 0; color: #888; white-space: nowrap;">Mobile</td><td style="padding: 4px 0;">${mobilePhone}</td></tr>` : ""}
            ${address ? `<tr><td style="padding: 4px 12px 4px 0; color: #888; white-space: nowrap;">Address</td><td style="padding: 4px 0;">${address}</td></tr>` : ""}
            ${preferredGenre ? `<tr><td style="padding: 4px 12px 4px 0; color: #888; white-space: nowrap;">Genre</td><td style="padding: 4px 0;">${preferredGenre}</td></tr>` : ""}
            ${howHeard ? `<tr><td style="padding: 4px 12px 4px 0; color: #888; white-space: nowrap;">How Heard</td><td style="padding: 4px 0;">${howHeard}</td></tr>` : ""}
            ${extraNotes ? `<tr><td style="padding: 4px 12px 4px 0; color: #888; white-space: nowrap;">Notes</td><td style="padding: 4px 0;">${extraNotes}</td></tr>` : ""}
          </table>
          <p style="font-size: 12px; color: #aaa; margin: 20px 0 0;">
            Review at <a href="https://highlifelive.com/admin/venue-logins" style="color: #e91e8c;">Admin &rarr; Venue Logins</a>
          </p>
        </div>
      `,
    });
  } catch (emailErr) {
    console.error("[partner-request] admin notification email failed:", emailErr);
  }

  return Response.json({ id: created.id }, { status: 201 });
}
