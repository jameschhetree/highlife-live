import { prisma } from "@/lib/db";
import { canManageVenueLoginsEmail, getAdminEmailFromRequest } from "@/lib/admin-permissions";
import { hashPassword } from "@/lib/password";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!prisma) return Response.json({ error: "DB not connected" }, { status: 503 });
  if (!canManageVenueLoginsEmail(getAdminEmailFromRequest(request))) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const rows = await prisma.venueLogin.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      displayName: true,
      organizationName: true,
      accountType: true,
      isActive: true,
      sourceRequestId: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  return Response.json(rows);
}

export async function POST(request: NextRequest) {
  if (!prisma) return Response.json({ error: "DB not connected" }, { status: 503 });
  if (!canManageVenueLoginsEmail(getAdminEmailFromRequest(request))) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await request.json()) as {
    email?: string;
    password?: string;
    displayName?: string;
    organizationName?: string;
    accountType?: string;
    sourceRequestId?: string;
  };

  const email = (body.email ?? "").trim().toLowerCase();
  const password = (body.password ?? "").trim();
  const displayName = (body.displayName ?? "").trim();
  const organizationName = (body.organizationName ?? "").trim();
  const accountType = (body.accountType ?? "Venue").trim();

  if (!email || !password || !displayName) {
    return Response.json({ error: "Email, password, and display name are required." }, { status: 400 });
  }

  const existing = await prisma.venueLogin.findUnique({ where: { email } });
  if (existing) {
    return Response.json({ error: "A venue login with this email already exists." }, { status: 409 });
  }

  const passwordHash = await hashPassword(password);

  const created = await prisma.venueLogin.create({
    data: {
      email,
      passwordHash,
      displayName,
      organizationName,
      accountType,
      isActive: true,
      sourceRequestId: body.sourceRequestId || null,
    },
  });

  // If created from a request, mark it as Converted
  if (body.sourceRequestId) {
    await prisma.partnerLoginRequest.update({
      where: { id: body.sourceRequestId },
      data: { status: "Converted" },
    }).catch(() => {/* request may not exist, that's ok */});
  }

  const { passwordHash: _ph, ...safe } = created;
  return Response.json(safe, { status: 201 });
}
