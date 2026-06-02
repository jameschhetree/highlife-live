// POST /api/admin/agent-auth -- verify a DB-backed AgentLogin against email + password.
// Returns the session payload the client should hand to setAdminSession().

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

  const agent = await prisma.agentLogin.findUnique({ where: { email } });
  if (!agent || !agent.isActive) {
    return Response.json({ ok: false, error: "Invalid credentials." }, { status: 401 });
  }

  const ok = await verifyPassword(password, agent.passwordHash);
  if (!ok) {
    return Response.json({ ok: false, error: "Invalid credentials." }, { status: 401 });
  }

  return Response.json({
    ok: true,
    email: agent.email,
    displayName: agent.name,
    role: "agent" as const,
    agentLoginId: agent.id,
  });
}
