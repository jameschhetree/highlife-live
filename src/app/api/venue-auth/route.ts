import { prisma } from "@/lib/db";
import { verifyPassword } from "@/lib/password";
import { setVenueSessionCookie, clearVenueSessionCookie } from "@/lib/venue-session";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  if (!prisma) {
    return Response.json({ error: "Database not connected" }, { status: 503 });
  }

  const body = (await request.json()) as { email?: string; password?: string };
  const email = (body.email ?? "").trim().toLowerCase();
  const password = body.password ?? "";

  if (!email || !password) {
    return Response.json({ ok: false, error: "Missing credentials" }, { status: 400 });
  }

  const venueLogin = await prisma.venueLogin.findUnique({ where: { email } });
  if (!venueLogin || !venueLogin.isActive) {
    return Response.json({ ok: false, error: "Invalid credentials" }, { status: 401 });
  }

  const valid = await verifyPassword(password, venueLogin.passwordHash);
  if (!valid) {
    return Response.json({ ok: false, error: "Invalid credentials" }, { status: 401 });
  }

  // Set httpOnly signed session cookie so subsequent requests are venue-scoped server-side
  await setVenueSessionCookie(venueLogin.id);

  return Response.json({
    ok: true,
    id: venueLogin.id,
    email: venueLogin.email,
    displayName: venueLogin.displayName,
    organizationName: venueLogin.organizationName ?? "",
    accountType: venueLogin.accountType,
  });
}

export async function DELETE() {
  await clearVenueSessionCookie();
  return Response.json({ ok: true });
}
