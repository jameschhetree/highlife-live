// POST /api/admin/login -- unified admin authentication.
// Verifies credentials against the AgentLogin table (all roles: agent, admin, owner).
// Replaces the old client-side ADMIN_USERS hardcoded password check.

import { prisma } from "@/lib/db";
import { verifyPassword } from "@/lib/password";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  if (!prisma) return Response.json({ ok: false, error: "DB not connected" }, { status: 503 });

  const body = (await request.json().catch(() => ({}))) as { email?: string; password?: string };
  const email = (body.email || "").trim().toLowerCase();
  const password = body.password || "";

  if (!email || !password) {
    return Response.json({ ok: false, error: "Email and password required." }, { status: 400 });
  }

  const user = await prisma.agentLogin.findUnique({ where: { email } });
  if (!user || !user.isActive) {
    return Response.json({ ok: false, error: "Invalid credentials." }, { status: 401 });
  }

  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) {
    return Response.json({ ok: false, error: "Invalid credentials." }, { status: 401 });
  }

  // Map DB role to session role. "owner" and "admin" both get "admin" session role
  // for backward compatibility with existing permission checks.
  const sessionRole = user.role === "agent" ? "agent" : "admin";

  return Response.json({
    ok: true,
    email: user.email,
    displayName: user.name,
    role: sessionRole,
    dbRole: user.role,
    agentLoginId: user.id,
  });
}
