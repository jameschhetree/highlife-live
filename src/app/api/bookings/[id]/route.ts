// GET /api/bookings/[id] -- get single booking
// PATCH /api/bookings/[id] -- update status + adminNotes
// DELETE /api/bookings/[id] -- owner-only, requires password + name confirmation

import { prisma } from "@/lib/db";
import { getAdminEmailFromRequest } from "@/lib/admin-permissions";
import { isOwnerEmail } from "@/lib/admin-permissions-server";
import { verifyPassword } from "@/lib/password";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!prisma) {
    return Response.json({ error: "Database not connected" }, { status: 503 });
  }
  const { id } = await params;
  const row = await prisma.booking.findUnique({ where: { id } });
  if (!row) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }
  return Response.json(row);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!prisma) {
    return Response.json({ error: "Database not connected" }, { status: 503 });
  }
  const { id } = await params;
  const body = await request.json();

  const allowed = ["status", "adminNotes"];
  const data: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) data[key] = body[key];
  }

  if (Object.keys(data).length === 0) {
    return Response.json({ error: "No valid fields to update" }, { status: 400 });
  }

  const updated = await prisma.booking.update({
    where: { id },
    data,
  });

  return Response.json(updated);
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!prisma) {
    return Response.json({ error: "Database not connected" }, { status: 503 });
  }

  const email = getAdminEmailFromRequest(request);
  if (!(await isOwnerEmail(email))) {
    return Response.json({ error: "Owner access required" }, { status: 403 });
  }

  const { id } = await params;

  let body: { password?: string; confirmName?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Request body required" }, { status: 400 });
  }

  const { password, confirmName } = body;
  if (!password || !confirmName) {
    return Response.json({ error: "Password and confirmation name are required" }, { status: 400 });
  }

  // Verify password against the owner's AgentLogin record
  const agent = await prisma.agentLogin.findUnique({ where: { email } });
  if (!agent) {
    return Response.json({ error: "Account not found" }, { status: 403 });
  }
  const passwordValid = await verifyPassword(password, agent.passwordHash);
  if (!passwordValid) {
    return Response.json({ error: "Incorrect password" }, { status: 403 });
  }

  // Load booking and verify name confirmation
  const booking = await prisma.booking.findUnique({ where: { id } });
  if (!booking) {
    return Response.json({ error: "Booking not found" }, { status: 404 });
  }

  const expectedNames = [
    booking.eventTitle,
    `${booking.artistName} at ${booking.venueName}`,
  ].filter(Boolean);

  const nameMatches = expectedNames.some(
    (name) => name!.toLowerCase() === confirmName.trim().toLowerCase(),
  );
  if (!nameMatches) {
    return Response.json({ error: "Booking name does not match" }, { status: 400 });
  }

  await prisma.booking.delete({ where: { id } });
  return Response.json({ ok: true });
}
