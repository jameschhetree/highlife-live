import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import {
  EPK_ACTIVE_JOB_STATUSES,
  EPK_ELIGIBLE_ARTIST_STATUSES,
  EPK_MODEL,
  slugifyEpkValue,
} from "@/lib/epk/constants";
import { generateEpkFollowups } from "@/lib/epk/followups";
import { parseEpkJobInput } from "@/lib/epk/input";
import {
  getOwnerSessionFromRequest,
  hasValidOwnerCsrf,
  ownerAuthConfiguration,
} from "@/lib/epk/owner-session";
import {
  consumeRateLimit,
  requestClientKey,
} from "@/lib/epk/rate-limit";
import { writeEpkAudit } from "@/lib/epk/audit";
import { epkAssetLinkSigningConfigured } from "@/lib/epk/signed-asset-links";
import { epkEmailConfigured } from "@/lib/epk/work-order-email";
import { getGeneratedEpkByArtistId } from "@/generated/epks/registry";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function generatorConfiguration() {
  const checks = {
    ownerAuth: ownerAuthConfiguration().configured,
    privateBlob: Boolean(process.env.EPK_BLOB_READ_WRITE_TOKEN),
    openai: Boolean(process.env.OPENAI_API_KEY),
    assetLinks: epkAssetLinkSigningConfigured(),
    workOrderEmail: epkEmailConfigured(),
  };
  return {
    checks,
    readyForGeneration: Object.values(checks).every(Boolean),
  };
}

export async function GET(request: Request) {
  const session = getOwnerSessionFromRequest(request);
  if (!session) {
    return Response.json({ error: "Secure owner session required." }, { status: 401 });
  }
  if (!prisma) {
    return Response.json({ error: "Database not connected." }, { status: 503 });
  }

  const [artists, epks, activeJob] = await Promise.all([
    prisma.artist.findMany({
      where: {
        isDemo: false,
        status: { in: [...EPK_ELIGIBLE_ARTIST_STATUSES] },
      },
      orderBy: [{ status: "desc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        status: true,
        primaryGenre: true,
        image: true,
      },
    }),
    prisma.ePK.findMany({
      orderBy: { updatedAt: "desc" },
      include: {
        artist: {
          select: {
            id: true,
            name: true,
            status: true,
            primaryGenre: true,
            image: true,
          },
        },
        jobs: {
          orderBy: { createdAt: "desc" },
          take: 5,
          include: {
            assets: {
              orderBy: { createdAt: "asc" },
              select: {
                id: true,
                kind: true,
                filename: true,
                mimeType: true,
                sizeBytes: true,
                scanStatus: true,
                createdAt: true,
              },
            },
          },
        },
      },
    }),
    prisma.ePKGenerationJob.findFirst({
      where: { status: { in: [...EPK_ACTIVE_JOB_STATUSES] } },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        epkId: true,
        status: true,
        createdAt: true,
        createdByEmail: true,
      },
    }),
  ]);

  return Response.json({
    session: { email: session.email, displayName: session.displayName },
    csrfToken: session.csrfToken,
    artists,
    epks: epks.map((epk) => {
      const generated = getGeneratedEpkByArtistId(epk.artist.id);
      return {
        ...epk,
        generatedUrl: generated
          ? `/roster/${generated.manifest.routeSlug}`
          : null,
      };
    }),
    activeJob,
    configuration: generatorConfiguration(),
  });
}

export async function PATCH(request: Request) {
  const session = getOwnerSessionFromRequest(request);
  if (!session) {
    return Response.json({ error: "Secure owner session required." }, { status: 401 });
  }
  if (!prisma) {
    return Response.json({ error: "Database not connected." }, { status: 503 });
  }

  let body: { epkId?: string; epkPageVisible?: boolean };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { epkId, epkPageVisible } = body;
  if (!epkId || typeof epkPageVisible !== "boolean") {
    return Response.json({ error: "epkId and epkPageVisible (boolean) are required." }, { status: 400 });
  }

  const epk = await prisma.ePK.findUnique({ where: { id: epkId } });
  if (!epk) {
    return Response.json({ error: "EPK not found." }, { status: 404 });
  }

  const updated = await prisma.ePK.update({
    where: { id: epkId },
    data: { epkPageVisible },
  });

  return Response.json({ ok: true, epkPageVisible: updated.epkPageVisible });
}

export async function POST(request: Request) {
  const session = getOwnerSessionFromRequest(request);
  if (!session) {
    return Response.json({ error: "Secure owner session required." }, { status: 401 });
  }
  if (!hasValidOwnerCsrf(request, session)) {
    return Response.json({ error: "Invalid CSRF token." }, { status: 403 });
  }
  if (!prisma) {
    return Response.json({ error: "Database not connected." }, { status: 503 });
  }

  const rate = consumeRateLimit(
    `epk-create:${session.email}:${requestClientKey(request)}`,
    { limit: 5, windowMs: 60 * 60 * 1000 },
  );
  if (!rate.allowed) {
    return Response.json(
      { error: "EPK submission limit reached. Try again later." },
      {
        status: 429,
        headers: { "Retry-After": String(rate.retryAfterSeconds) },
      },
    );
  }

  let input;
  try {
    input = parseEpkJobInput(await request.json());
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Invalid EPK brief." },
      { status: 400 },
    );
  }

  const recentJobs = await prisma.ePKGenerationJob.count({
    where: {
      createdByEmail: session.email,
      createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) },
    },
  });
  if (recentJobs >= 5) {
    return Response.json(
      { error: "EPK submission limit reached. Try again in an hour." },
      { status: 429, headers: { "Retry-After": "3600" } },
    );
  }

  const activeJob = await prisma.ePKGenerationJob.findFirst({
    where: { status: { in: [...EPK_ACTIVE_JOB_STATUSES] } },
    select: { id: true, status: true },
  });
  if (activeJob) {
    return Response.json(
      {
        error: "Only one EPK job can be active at a time.",
        activeJob,
      },
      { status: 409 },
    );
  }

  const artist = await prisma.artist.findFirst({
    where: {
      id: input.artistId,
      isDemo: false,
      status: { in: [...EPK_ELIGIBLE_ARTIST_STATUSES] },
    },
    select: { id: true, name: true },
  });
  if (!artist) {
    return Response.json(
      { error: "Artist is not eligible for EPK generation." },
      { status: 400 },
    );
  }

  const epk = await prisma.ePK.upsert({
    where: { artistId: artist.id },
    create: {
      artistId: artist.id,
      status: "Draft",
      isDemo: false,
      createdByEmail: session.email,
    },
    update: {
      createdByEmail: session.email,
    },
  });
  const job = await prisma.ePKGenerationJob.create({
    data: {
      epkId: epk.id,
      status: "Submitted",
      model: EPK_MODEL,
      input: input as unknown as Prisma.InputJsonValue,
      createdByEmail: session.email,
    },
  });

  const followups = await generateEpkFollowups(input);
  const updated = await prisma.ePKGenerationJob.update({
    where: { id: job.id },
    data: {
      status: "AwaitingAnswers",
      questions: followups.questions as unknown as Prisma.InputJsonValue,
      inputTokens: followups.inputTokens,
      outputTokens: followups.outputTokens,
    },
    include: { assets: true },
  });

  await writeEpkAudit({
    action: "create",
    entityType: "epk_generation_job",
    entityId: job.id,
    userEmail: session.email,
    details: {
      artistId: artist.id,
      artistName: artist.name,
      followupSource: followups.source,
      routeSlug: `${slugifyEpkValue(artist.name)}-epk`,
    },
  });

  return Response.json(
    {
      job: updated,
      artist,
      questions: followups.questions,
      configuration: generatorConfiguration(),
    },
    { status: 201 },
  );
}
