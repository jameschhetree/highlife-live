// GET /api/admin/artists -- list all artists
// POST /api/admin/artists -- create a new artist

import { prisma } from "@/lib/db";
import { dbArtistToAdmin, adminArtistToDbInput } from "@/lib/admin-db-mappers";
import {
  canManageArtistsEmail,
  getAdminEmailFromRequest,
  isOwnerAdminEmail,
} from "@/lib/admin-permissions";
import { canAccessAdminArtistApiEmail } from "@/lib/admin-permissions-server";
import type { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!prisma) {
    return Response.json({ error: "Database not connected" }, { status: 503 });
  }
  const adminEmail = getAdminEmailFromRequest(request);
  if (!(await canAccessAdminArtistApiEmail(adminEmail))) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }
  // Agent visibility is DB-backed via AgentArtistAssignment.
  let where: Record<string, unknown> | undefined;
  if (!isOwnerAdminEmail(adminEmail)) {
    // Get assigned artist IDs from DB
    const agentLogin = await prisma.agentLogin.findFirst({
      where: { email: adminEmail, isActive: true },
      include: { artistAssignments: { select: { artistId: true } } },
    });
    const assignedIds = agentLogin?.artistAssignments.map((a) => a.artistId) ?? [];
    where = assignedIds.length > 0 ? { id: { in: assignedIds } } : { id: "__none__" };
  }

  const rows = await prisma.artist.findMany({
    where,
    orderBy: { name: "asc" },
  });
  return Response.json(rows.map(dbArtistToAdmin));
}

export async function POST(request: Request) {
  if (!prisma) {
    return Response.json({ error: "Database not connected" }, { status: 503 });
  }
  if (!canManageArtistsEmail(getAdminEmailFromRequest(request))) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = await request.json();
  const data = adminArtistToDbInput(body);

  const createData = {
    ...data,
    isDemo: false,
  } as Prisma.ArtistCreateInput;

  const created = await prisma.artist.create({
    data: createData,
  });
  return Response.json(dbArtistToAdmin(created), { status: 201 });
}
