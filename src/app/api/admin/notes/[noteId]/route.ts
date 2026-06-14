// Individual note operations (entity-agnostic).
// PATCH  -> update note body (admin + agent can edit)
// DELETE -> delete a note (admin + agent can delete)

import { prisma } from "@/lib/db";
import {
  getAdminEmailFromRequest,
  isOwnerAdminEmail,
} from "@/lib/admin-permissions";
import { isAgentLoginEmail } from "@/lib/admin-permissions-server";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ noteId: string }> }
) {
  if (!prisma) return Response.json({ error: "DB not connected" }, { status: 503 });
  const email = getAdminEmailFromRequest(request);
  if (!isOwnerAdminEmail(email) && !(await isAgentLoginEmail(email))) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }
  const { noteId } = await context.params;
  const body = (await request.json()) as { body?: string };
  const text = (body.body ?? "").trim();
  if (!text) return Response.json({ error: "body required" }, { status: 400 });

  try {
    const note = await prisma.note.update({
      where: { id: noteId },
      data: { body: text },
    });
    return Response.json(note);
  } catch {
    return Response.json({ error: "Note not found" }, { status: 404 });
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ noteId: string }> }
) {
  if (!prisma) return Response.json({ error: "DB not connected" }, { status: 503 });
  const email = getAdminEmailFromRequest(request);
  if (!isOwnerAdminEmail(email) && !(await isAgentLoginEmail(email))) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }
  const { noteId } = await context.params;

  try {
    await prisma.note.delete({ where: { id: noteId } });
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "Note not found" }, { status: 404 });
  }
}
