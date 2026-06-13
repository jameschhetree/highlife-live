// Admin notes endpoint for a venue.
// GET  -> list all Note records where entityType="venue" and entityId=id
// POST -> admin/agent posts a new note for this venue

import { prisma } from "@/lib/db";
import {
  getAdminEmailFromRequest,
  isOwnerAdminEmail,
} from "@/lib/admin-permissions";
import { isAgentLoginEmail } from "@/lib/admin-permissions-server";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  if (!prisma) return Response.json({ error: "DB not connected" }, { status: 503 });
  const email = getAdminEmailFromRequest(request);
  if (!isOwnerAdminEmail(email) && !(await isAgentLoginEmail(email))) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await context.params;
  const notes = await prisma.note.findMany({
    where: { entityType: "venue", entityId: id },
    orderBy: { createdAt: "desc" },
  });
  return Response.json(notes);
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  if (!prisma) return Response.json({ error: "DB not connected" }, { status: 503 });
  const email = getAdminEmailFromRequest(request);
  if (!isOwnerAdminEmail(email) && !(await isAgentLoginEmail(email))) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await context.params;
  const body = (await request.json()) as { body?: string };
  const text = (body.body ?? "").trim();
  if (!text) return Response.json({ error: "body required" }, { status: 400 });

  const authorType = isOwnerAdminEmail(email) ? "admin" : "agent";
  const note = await prisma.note.create({
    data: {
      entityType: "venue",
      entityId: id,
      authorType,
      authorEmail: email,
      authorName: email.split("@")[0] || "Admin",
      body: text,
    },
  });
  return Response.json(note, { status: 201 });
}
