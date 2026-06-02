// GET  /api/admin/agent-logins -- list all agent logins (owner-only)
// POST /api/admin/agent-logins -- create agent login (owner-only)

import { prisma } from "@/lib/db";
import { getAdminEmailFromRequest, isOwnerAdminEmail } from "@/lib/admin-permissions";
import { hashPassword } from "@/lib/password";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!prisma) return Response.json({ error: "DB not connected" }, { status: 503 });
  if (!isOwnerAdminEmail(getAdminEmailFromRequest(request))) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const rows = await prisma.agentLogin.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      artistAssignments: true,
    },
    omit: {
      passwordHash: true,
    },
  });

  return Response.json(rows);
}

export async function POST(request: NextRequest) {
  if (!prisma) return Response.json({ error: "DB not connected" }, { status: 503 });
  if (!isOwnerAdminEmail(getAdminEmailFromRequest(request))) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await request.json()) as {
    email?: string;
    password?: string;
    name?: string;
    artistIds?: string[];
  };

  const email = (body.email ?? "").trim().toLowerCase();
  const password = (body.password ?? "").trim();
  const name = (body.name ?? "").trim();

  if (!email || !password || !name) {
    return Response.json({ error: "Email, password, and name are required." }, { status: 400 });
  }

  const existing = await prisma.agentLogin.findUnique({ where: { email } });
  if (existing) {
    return Response.json({ error: "An agent login with this email already exists." }, { status: 409 });
  }

  const passwordHash = await hashPassword(password);

  const agentLogin = await prisma.agentLogin.create({
    data: {
      email,
      passwordHash,
      name,
      isActive: true,
      artistAssignments: body.artistIds?.length
        ? {
            create: body.artistIds.map((artistId) => ({ artistId })),
          }
        : undefined,
    },
    include: { artistAssignments: true },
  });

  const { passwordHash: _ph, ...safe } = agentLogin;
  return Response.json(safe, { status: 201 });
}
