import { prisma } from "@/lib/db";
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

  return Response.json({ id: created.id }, { status: 201 });
}
