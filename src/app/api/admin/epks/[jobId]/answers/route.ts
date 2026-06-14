import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { generateEpkDesignPrompt } from "@/lib/epk/design-prompt";
import type { EpkJobInput } from "@/lib/epk/input";
import {
  getOwnerSessionFromRequest,
  hasValidOwnerCsrf,
} from "@/lib/epk/owner-session";
import {
  createSignedAssetDownloadUrl,
  epkAssetLinkSigningConfigured,
} from "@/lib/epk/signed-asset-links";
import { writeEpkAudit } from "@/lib/epk/audit";
import {
  epkEmailConfigured,
  epkWorkOrderAddress,
  sendEpkWorkOrder,
} from "@/lib/epk/work-order-email";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

type Answer = {
  questionId: string;
  answer: string;
};

type Question = {
  id: string;
  prompt: string;
  reason: string;
};

function cleanAnswers(value: unknown): Answer[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      const record =
        item && typeof item === "object"
          ? (item as Record<string, unknown>)
          : {};
      return {
        questionId: String(record.questionId ?? "").slice(0, 120),
        answer: String(record.answer ?? "").trim().slice(0, 4000),
      };
    })
    .filter((item) => item.questionId && item.answer);
}

function cleanQuestions(value: unknown): Question[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      const record =
        item && typeof item === "object"
          ? (item as Record<string, unknown>)
          : {};
      return {
        id: String(record.id ?? "").slice(0, 120),
        prompt: String(record.prompt ?? "").trim().slice(0, 1000),
        reason: String(record.reason ?? "").trim().slice(0, 1000),
      };
    })
    .filter((item) => item.id && item.prompt);
}

function readBrief(value: Prisma.JsonValue): EpkJobInput {
  const record =
    value && typeof value === "object" && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};
  return {
    artistId: String(record.artistId ?? ""),
    genres: Array.isArray(record.genres) ? record.genres.map(String) : [],
    links: Array.isArray(record.links)
      ? (record.links as EpkJobInput["links"])
      : [],
    themeVibe: String(record.themeVibe ?? ""),
    features: Array.isArray(record.features)
      ? record.features.map(String)
      : [],
  };
}

function existingManualPrompt(value: Prisma.JsonValue): string | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const workOrder = (value as Record<string, unknown>).manualWorkOrder;
  if (!workOrder || typeof workOrder !== "object" || Array.isArray(workOrder)) {
    return null;
  }
  const prompt = (workOrder as Record<string, unknown>).prompt;
  return typeof prompt === "string" && prompt ? prompt : null;
}

export async function POST(
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
      assets: { orderBy: { createdAt: "asc" } },
      epk: {
        include: {
          artist: {
            select: {
              id: true,
              name: true,
              primaryGenre: true,
              secondaryGenres: true,
              performanceType: true,
              bio: true,
              shortPitch: true,
              pressQuotes: true,
              image: true,
            },
          },
        },
      },
    },
  });
  if (!job) {
    return Response.json({ error: "EPK job not found." }, { status: 404 });
  }
  if (job.status === "GenerationRequested") {
    return Response.json({
      job,
      designPrompt: existingManualPrompt(job.input),
      emailedTo: epkWorkOrderAddress(),
      status: "GenerationRequested",
    });
  }
  if (!["AwaitingAnswers", "PromptReady"].includes(job.status)) {
    return Response.json(
      { error: `Job cannot request generation while ${job.status}.` },
      { status: 409 },
    );
  }

  const body = (await request.json().catch(() => null)) as {
    answers?: unknown;
  } | null;
  const submittedAnswers = cleanAnswers(body?.answers);
  const storedAnswers = cleanAnswers(job.answers);
  const answers =
    submittedAnswers.length > 0 ? submittedAnswers : storedAnswers;
  const questions = cleanQuestions(job.questions);

  if (
    answers.length === 0 ||
    questions.some(
      (question) =>
        !answers.some((answer) => answer.questionId === question.id),
    )
  ) {
    return Response.json(
      { error: "Answer every follow-up question before generation." },
      { status: 400 },
    );
  }

  const missingConfiguration = [
    ...(process.env.OPENAI_API_KEY ? [] : ["OPENAI_API_KEY"]),
    ...(process.env.EPK_BLOB_READ_WRITE_TOKEN
      ? []
      : ["EPK_BLOB_READ_WRITE_TOKEN"]),
    ...(epkAssetLinkSigningConfigured()
      ? []
      : ["EPK_ASSET_LINK_SECRET or ADMIN_SESSION_SECRET"]),
    ...(epkEmailConfigured() ? [] : ["ZOHO_SMTP_HOST/USER/PASS"]),
  ];
  if (missingConfiguration.length > 0) {
    return Response.json(
      {
        error: `Waiting for: ${missingConfiguration.join(", ")}`,
        blockedBy: missingConfiguration,
      },
      { status: 503 },
    );
  }

  let prompt = existingManualPrompt(job.input);
  let reviewedImageAssetIds: string[] = [];
  let designInputTokens = 0;
  let designOutputTokens = 0;
  let designCostMicros = 0;

  if (!prompt) {
    const followups = questions.map((question) => ({
      questionId: question.id,
      question: question.prompt,
      reason: question.reason,
      answer:
        answers.find((answer) => answer.questionId === question.id)?.answer ??
        "",
    }));
    const design = await generateEpkDesignPrompt({
      jobId: job.id,
      artist: job.epk.artist,
      brief: readBrief(job.input),
      followups,
      assets: job.assets,
    });
    prompt = design.prompt;
    reviewedImageAssetIds = design.reviewedImageAssetIds;
    designInputTokens = design.inputTokens;
    designOutputTokens = design.outputTokens;
    designCostMicros = design.estimatedCostMicros;

    const inputRecord =
      job.input && typeof job.input === "object" && !Array.isArray(job.input)
        ? (job.input as Record<string, unknown>)
        : {};
    await prisma.ePKGenerationJob.update({
      where: { id: job.id },
      data: {
        answers: answers as unknown as Prisma.InputJsonValue,
        status: "PromptReady",
        input: {
          ...inputRecord,
          manualWorkOrder: {
            protocol: "EPK_BUILD_REQUEST_V1",
            prompt,
            generatedAt: new Date().toISOString(),
            reviewedImageAssetIds,
          },
        } as Prisma.InputJsonValue,
        inputTokens: { increment: designInputTokens },
        outputTokens: { increment: designOutputTokens },
        estimatedCostMicros: { increment: designCostMicros },
        failureCode: null,
        failureMessage: null,
      },
    });
  }

  if (!prompt) {
    return Response.json(
      { error: "The EPK design prompt could not be created." },
      { status: 500 },
    );
  }

  const baseUrl = new URL(request.url).origin;
  const emailAssets = job.assets
    .filter((asset) => asset.scanStatus !== "Rejected")
    .map((asset) => ({
      id: asset.id,
      kind: asset.kind,
      filename: asset.filename,
      downloadUrl: createSignedAssetDownloadUrl({
        baseUrl,
        jobId: job.id,
        assetId: asset.id,
      }),
    }));

  let emailRunId: string;
  try {
    emailRunId = await sendEpkWorkOrder({
      jobId: job.id,
      artistName: job.epk.artist.name,
      prompt,
      assets: emailAssets,
    });
  } catch (error) {
    await prisma.ePKGenerationJob.update({
      where: { id: job.id },
      data: {
        status: "PromptReady",
        failureCode: "WORK_ORDER_EMAIL_FAILED",
        failureMessage:
          error instanceof Error
            ? error.message.slice(0, 1000)
            : "EPK work-order email failed.",
      },
    });
    return Response.json(
      {
        error:
          "The design prompt was saved, but the EPK work-order email could not be sent. Retry to reuse the saved prompt.",
      },
      { status: 502 },
    );
  }

  const updated = await prisma.ePKGenerationJob.update({
    where: { id: job.id },
    data: {
      answers: answers as unknown as Prisma.InputJsonValue,
      status: "GenerationRequested",
      externalRunId: emailRunId,
      failureCode: null,
      failureMessage:
        "Work order emailed. Waiting for the manual Codex EPK Workspace build.",
    },
    include: { assets: true },
  });

  await writeEpkAudit({
    action: "request_manual_generation",
    entityType: "epk_generation_job",
    entityId: job.id,
    userEmail: session.email,
    details: {
      answerCount: answers.length,
      assetCount: job.assets.length,
      reviewedImageCount: reviewedImageAssetIds.length,
      designInputTokens,
      designOutputTokens,
      workOrderEmail: epkWorkOrderAddress(),
    },
  });

  return Response.json({
    job: updated,
    designPrompt: prompt,
    emailedTo: epkWorkOrderAddress(),
    status: "GenerationRequested",
  });
}
