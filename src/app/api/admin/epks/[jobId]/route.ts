import { del } from "@vercel/blob";
import { prisma } from "@/lib/db";
import {
  getOwnerSessionFromRequest,
  hasValidOwnerCsrf,
} from "@/lib/epk/owner-session";
import { writeEpkAudit } from "@/lib/epk/audit";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const CANCELLABLE_STATUSES = [
  "Submitted",
  "AwaitingAnswers",
  "PromptReady",
] as const;

export async function DELETE(
  request: Request,
  context: { params: Promise<{ jobId: string }> },
) {
  const session = getOwnerSessionFromRequest(request);
  if (!session) {
    return Response.json(
      { error: "Secure owner session required." },
      { status: 401 },
    );
  }
  if (!hasValidOwnerCsrf(request, session)) {
    return Response.json({ error: "Invalid CSRF token." }, { status: 403 });
  }
  if (!prisma) {
    return Response.json({ error: "Database not connected." }, { status: 503 });
  }

  const { jobId } = await context.params;
  const job = await prisma.ePKGenerationJob.findUnique({
    where: { id: jobId },
    include: {
      assets: { select: { blobUrl: true } },
      epk: { select: { artistId: true } },
    },
  });
  if (!job) {
    return Response.json({ error: "EPK job not found." }, { status: 404 });
  }
  if (!CANCELLABLE_STATUSES.includes(
    job.status as (typeof CANCELLABLE_STATUSES)[number],
  )) {
    return Response.json(
      { error: `Job cannot be cancelled while ${job.status}.` },
      { status: 409 },
    );
  }

  if (job.assets.length > 0) {
    const token = process.env.EPK_BLOB_READ_WRITE_TOKEN?.trim();
    if (!token) {
      return Response.json(
        { error: "Private EPK storage is not configured." },
        { status: 503 },
      );
    }
    await del(
      job.assets.map((asset) => asset.blobUrl),
      { token },
    );
  }

  await prisma.$transaction([
    prisma.ePKAsset.deleteMany({ where: { jobId } }),
    prisma.ePKGenerationJob.update({
      where: { id: jobId },
      data: {
        status: "Cancelled",
        failureCode: "OWNER_CANCELLED",
        failureMessage: "Cancelled by an authenticated owner.",
        completedAt: new Date(),
      },
    }),
  ]);

  await writeEpkAudit({
    action: "cancel",
    entityType: "epk_generation_job",
    entityId: jobId,
    userEmail: session.email,
    details: {
      artistId: job.epk.artistId,
      deletedAssetCount: job.assets.length,
    },
  });

  return Response.json({ ok: true, status: "Cancelled" });
}
