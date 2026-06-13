import crypto from "node:crypto";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/db";

const MAX_FILE_COUNT = 3;
const MAX_FILE_SIZE_BYTES = 300 * 1024 * 1024;
const EMAIL_WINDOW_MS = 30 * 60 * 1000;
const EMAIL_WINDOW_LIMIT = 3;
const IP_WINDOW_MS = 10 * 60 * 1000;
const IP_WINDOW_LIMIT = 8;

const CLASSIFICATIONS = new Set([
  "DJ",
  "Vocalist",
  "Vocalist/Rapper",
  "Vocalist/Singer",
  "Instrumental Musician",
  "Classical Musician",
  "Band",
  "Comedian",
  "Magician",
  "Sound Engineer",
  "Skills/Circus Act",
  "Other (please specify)",
]);

type UploadedAsset = {
  url: string;
  pathname: string;
  size: number;
  contentType: string;
  filename: string;
};

type ApplicationBody = {
  classification: string;
  classificationOther?: string;
  fullName: string;
  actStageName: string;
  phone: string;
  email: string;
  actDescription?: string;
  performanceLinks?: string;
  instagram?: string;
  facebook?: string;
  uploads?: UploadedAsset[];
};

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isMediaType(contentType: string): boolean {
  return contentType.startsWith("audio/") || contentType.startsWith("video/");
}

function normalize(body: ApplicationBody) {
  return {
    classification: String(body.classification || "").trim(),
    classificationOther: String(body.classificationOther || "").trim(),
    fullName: String(body.fullName || "").trim(),
    actStageName: String(body.actStageName || "").trim(),
    phone: String(body.phone || "").trim(),
    email: String(body.email || "").trim().toLowerCase(),
    actDescription: String(body.actDescription || "").trim(),
    performanceLinks: String(body.performanceLinks || "").trim(),
    instagram: String(body.instagram || "").trim(),
    facebook: String(body.facebook || "").trim(),
    uploads: Array.isArray(body.uploads) ? body.uploads : [],
  };
}

function validate(normalized: ReturnType<typeof normalize>): string | null {
  if (!CLASSIFICATIONS.has(normalized.classification)) {
    return "Please choose a valid classification.";
  }
  if (
    normalized.classification === "Other (please specify)" &&
    !normalized.classificationOther
  ) {
    return "Please specify your classification.";
  }
  if (!normalized.fullName) return "Full name is required.";
  if (!normalized.actStageName) return "Act/stage name is required.";
  if (!normalized.phone) return "Phone is required.";
  if (!normalized.email || !isValidEmail(normalized.email)) return "Enter a valid email.";

  const hasSocialOrLinks =
    normalized.performanceLinks !== "" ||
    normalized.instagram !== "" ||
    normalized.facebook !== "";

  if (!hasSocialOrLinks && normalized.uploads.length === 0) {
    return "Provide at least one social/performance link or at least one upload.";
  }

  if (normalized.uploads.length > MAX_FILE_COUNT) {
    return `Maximum ${MAX_FILE_COUNT} uploads allowed.`;
  }

  for (const upload of normalized.uploads) {
    if (!upload.url || !upload.pathname || !upload.filename) {
      return "Uploaded file metadata is incomplete.";
    }
    if (!upload.contentType || !isMediaType(upload.contentType)) {
      return "Only audio/video uploads are allowed.";
    }
    if (!Number.isFinite(upload.size) || upload.size <= 0) {
      return "Uploaded file size is invalid.";
    }
    if (upload.size > MAX_FILE_SIZE_BYTES) {
      return "Each upload must be 300MB or smaller.";
    }
  }

  return null;
}

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  return "";
}

function hashIp(ip: string): string {
  if (!ip) return "";
  return crypto.createHash("sha256").update(ip).digest("hex");
}

async function sendConfirmationEmail(application: {
  id: string;
  email: string;
  fullName: string;
  actStageName: string;
}) {
  const rawKey = process.env.RESEND_API_KEY;
  if (!rawKey) return;
  const apiKey = rawKey.trim().replace(/^["']|["']$/g, "");
  if (!apiKey) return;

  const { Resend } = await import("resend");
  const resend = new Resend(apiKey);

  await resend.emails.send({
    from: "HighLife Live <auditions@highlifelive.com>",
    to: [application.email],
    subject: "We received your HighLife Live audition",
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;background:#0a0a0a;color:#f4f4f5;">
        <h1 style="font-size:20px;margin:0 0 12px;">Application Received</h1>
        <p style="line-height:1.6;color:#d4d4d8;">
          Hi ${application.fullName},
          <br /><br />
          Thanks for submitting your audition for <strong>${application.actStageName}</strong>.
          Our team received it successfully and will review it.
        </p>
        <p style="margin-top:18px;font-size:12px;color:#a1a1aa;">
          Reference ID: ${application.id}
        </p>
      </div>
    `,
  });
}

async function sendInternalAlert(application: {
  id: string;
  classification: string;
  classificationOther: string;
  fullName: string;
  actStageName: string;
  phone: string;
  email: string;
  performanceLinks: string;
  instagram: string;
  facebook: string;
  uploads: UploadedAsset[];
}) {
  const rawKey = process.env.RESEND_API_KEY;
  if (!rawKey) return;
  const apiKey = rawKey.trim().replace(/^["']|["']$/g, "");
  if (!apiKey) return;

  const { Resend } = await import("resend");
  const resend = new Resend(apiKey);

  const uploadList =
    application.uploads.length > 0
      ? `<ul>${application.uploads
          .map(
            (u) =>
              `<li><a href="${u.url}" style="color:#c4b5fd;">${u.filename}</a> (${(
                u.size /
                (1024 * 1024)
              ).toFixed(1)}MB, ${u.contentType})</li>`
          )
          .join("")}</ul>`
      : "<p>None</p>";

  await resend.emails.send({
    from: "HighLife Live <auditions@highlifelive.com>",
    to: ["liam@highlifedmv.com"],
    subject: `New audition: ${application.actStageName}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:680px;margin:0 auto;padding:24px;background:#0a0a0a;color:#f4f4f5;">
        <h1 style="font-size:20px;margin:0 0 12px;">New External Artist Request</h1>
        <p style="font-size:12px;color:#a1a1aa;">Reference ID: ${application.id}</p>
        <table style="width:100%;border-collapse:collapse;margin-top:14px;">
          <tr><td style="padding:8px 0;color:#a1a1aa;">Classification</td><td style="padding:8px 0;">${
            application.classification
          }${application.classificationOther ? ` (${application.classificationOther})` : ""}</td></tr>
          <tr><td style="padding:8px 0;color:#a1a1aa;">Full Name</td><td style="padding:8px 0;">${application.fullName}</td></tr>
          <tr><td style="padding:8px 0;color:#a1a1aa;">Act/Stage Name</td><td style="padding:8px 0;">${application.actStageName}</td></tr>
          <tr><td style="padding:8px 0;color:#a1a1aa;">Phone</td><td style="padding:8px 0;">${application.phone}</td></tr>
          <tr><td style="padding:8px 0;color:#a1a1aa;">Email</td><td style="padding:8px 0;">${application.email}</td></tr>
          <tr><td style="padding:8px 0;color:#a1a1aa;">Performance Links</td><td style="padding:8px 0;">${application.performanceLinks || "None"}</td></tr>
          <tr><td style="padding:8px 0;color:#a1a1aa;">Instagram</td><td style="padding:8px 0;">${application.instagram || "None"}</td></tr>
          <tr><td style="padding:8px 0;color:#a1a1aa;">Facebook</td><td style="padding:8px 0;">${application.facebook || "None"}</td></tr>
        </table>
        <h2 style="margin:20px 0 8px;font-size:14px;color:#a1a1aa;">Uploads</h2>
        ${uploadList}
      </div>
    `,
  });
}

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  if (!prisma) {
    return Response.json({ error: "Database not connected" }, { status: 503 });
  }

  const payload = (await request.json()) as ApplicationBody;
  const normalized = normalize(payload);
  const validationError = validate(normalized);
  if (validationError) {
    return Response.json({ error: validationError }, { status: 400 });
  }

  const ipHash = hashIp(getClientIp(request));
  const windowByEmail = new Date(Date.now() - EMAIL_WINDOW_MS);
  const windowByIp = new Date(Date.now() - IP_WINDOW_MS);

  const applicationClient = prisma as unknown as {
    agentApplication: {
      count: (args: Record<string, unknown>) => Promise<number>;
      create: (args: Record<string, unknown>) => Promise<{ id: string }>;
    };
  };

  const [recentByEmail, recentByIp] = await Promise.all([
    applicationClient.agentApplication.count({
      where: { email: normalized.email, submittedAt: { gte: windowByEmail } },
    }),
    ipHash
      ? applicationClient.agentApplication.count({
          where: { submitterIpHash: ipHash, submittedAt: { gte: windowByIp } },
        })
      : Promise.resolve(0),
  ]);

  if (recentByEmail >= EMAIL_WINDOW_LIMIT || recentByIp >= IP_WINDOW_LIMIT) {
    return Response.json(
      { error: "Too many submissions. Please wait and try again." },
      { status: 429 }
    );
  }

  const created = await applicationClient.agentApplication.create({
    data: {
      classification: normalized.classification,
      classificationOther: normalized.classificationOther,
      fullName: normalized.fullName,
      actStageName: normalized.actStageName,
      phone: normalized.phone,
      email: normalized.email,
      actDescription: normalized.actDescription || null,
      performanceLinks: normalized.performanceLinks,
      instagram: normalized.instagram,
      facebook: normalized.facebook,
      uploads: normalized.uploads,
      source: "external_artist_request",
      submitterIpHash: ipHash,
      userAgent: request.headers.get("user-agent") || "",
      status: "New",
    },
  });

  // Do not fail the saved submission if email delivery fails.
  try {
    await Promise.all([
      sendConfirmationEmail({
        id: created.id,
        email: normalized.email,
        fullName: normalized.fullName,
        actStageName: normalized.actStageName,
      }),
      sendInternalAlert({
        id: created.id,
        classification: normalized.classification,
        classificationOther: normalized.classificationOther,
        fullName: normalized.fullName,
        actStageName: normalized.actStageName,
        phone: normalized.phone,
        email: normalized.email,
        performanceLinks: normalized.performanceLinks,
        instagram: normalized.instagram,
        facebook: normalized.facebook,
        uploads: normalized.uploads,
      }),
    ]);
  } catch (error) {
    console.error("[FindAnAgent email] notification failure:", error);
  }

  return Response.json({ id: created.id }, { status: 201 });
}
