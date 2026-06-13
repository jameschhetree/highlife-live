// PATCH /api/admin/artists/[id]/links/[linkId] -- update a link
// DELETE /api/admin/artists/[id]/links/[linkId] -- delete a link

import { prisma } from "@/lib/db";
import {
  canManageArtistsEmail,
  getAdminEmailFromRequest,
} from "@/lib/admin-permissions";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; linkId: string }> }
) {
  if (!prisma) {
    return Response.json({ error: "Database not connected" }, { status: 503 });
  }
  if (!canManageArtistsEmail(getAdminEmailFromRequest(request))) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }
  const { linkId } = await params;
  const body = await request.json();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: Record<string, any> = {};
  if (body.title !== undefined) data.title = body.title;
  if (body.url !== undefined) data.url = body.url;

  const updated = await prisma.artistLink.update({
    where: { id: linkId },
    data,
  });
  return Response.json(updated);
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; linkId: string }> }
) {
  if (!prisma) {
    return Response.json({ error: "Database not connected" }, { status: 503 });
  }
  if (!canManageArtistsEmail(getAdminEmailFromRequest(request))) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }
  const { linkId } = await params;
  await prisma.artistLink.delete({ where: { id: linkId } });
  return Response.json({ ok: true });
}
