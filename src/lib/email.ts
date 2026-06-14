// Central email sender. Routes by From-address domain:
//   highlifelive.com  → Zoho SMTP (via Nodemailer)
//   highlifedmv.com   → Resend
//   anything else     → tries Zoho first, then Resend as fallback
// Returns the sender label that succeeded, or throws if all transports fail.

import nodemailer from "nodemailer";

interface SendArgs {
  from: string;
  to: string[] | string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  strictFrom?: boolean;
}

function domainOf(address: string): string {
  // Handles both bare addresses and "Name <addr@host>" form
  const match = address.match(/<([^>]+)>/);
  const bare = match ? match[1] : address;
  return (bare.split("@")[1] || "").toLowerCase().trim();
}

let zohoTransport: nodemailer.Transporter | null = null;
function getZohoTransport(): nodemailer.Transporter | null {
  const host = process.env.ZOHO_SMTP_HOST;
  const user = process.env.ZOHO_SMTP_USER;
  const pass = process.env.ZOHO_SMTP_PASS;
  if (!host || !user || !pass) return null;
  if (zohoTransport) return zohoTransport;
  const port = Number(process.env.ZOHO_SMTP_PORT || 465);
  const secure =
    (process.env.ZOHO_SMTP_SECURE ?? (port === 465 ? "true" : "false")) ===
    "true";
  zohoTransport = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });
  return zohoTransport;
}

async function sendViaZoho(args: SendArgs): Promise<string> {
  const t = getZohoTransport();
  if (!t) throw new Error("Zoho SMTP not configured");
  const result = await t.sendMail({
    from: args.from,
    to: Array.isArray(args.to) ? args.to.join(", ") : args.to,
    subject: args.subject,
    html: args.html,
    text: args.text,
    replyTo: args.replyTo,
  });
  return `zoho:${result.messageId || "ok"}`;
}

async function sendViaResend(args: SendArgs): Promise<string> {
  const rawKey = process.env.RESEND_API_KEY;
  if (!rawKey) throw new Error("Resend not configured");
  const apiKey = rawKey.trim().replace(/^["']|["']$/g, "");
  const { Resend } = await import("resend");
  const resend = new Resend(apiKey);
  const result = await resend.emails.send({
    from: args.from,
    to: Array.isArray(args.to) ? args.to : [args.to],
    subject: args.subject,
    html: args.html,
    text: args.text,
    replyTo: args.replyTo,
  });
  if (result.error) throw new Error(result.error.message);
  return `resend:${result.data?.id || "ok"}`;
}

/**
 * Send an email through the right transport for the From address.
 * Logs which sender succeeded; throws if every attempt fails.
 */
export async function sendEmail(args: SendArgs): Promise<string> {
  const fromDomain = domainOf(args.from);

  // Primary transport by From-domain
  const primary = fromDomain === "highlifelive.com" ? "zoho" : fromDomain === "highlifedmv.com" ? "resend" : "zoho";
  const send = primary === "zoho" ? sendViaZoho : sendViaResend;
  const fallback = primary === "zoho" ? sendViaResend : sendViaZoho;

  try {
    const label = await send(args);
    console.log(`[EMAIL_SENDER_STATUS] from=${args.from} via=${label}`);
    return label;
  } catch (primaryErr) {
    console.warn(`[EMAIL_SENDER_STATUS] primary ${primary} failed for from=${args.from}:`, primaryErr);
    if (args.strictFrom) throw primaryErr;
    // Fallback. For highlifelive.com senders that need Zoho, the Resend fallback will
    // probably fail too (unverified domain), so we rewrite From to bookings@highlifedmv.com
    // as a last-resort so the message still goes out.
    try {
      const fallbackArgs = fromDomain === "highlifelive.com" && primary === "zoho"
        ? { ...args, from: "HighLife Live <bookings@highlifedmv.com>", replyTo: args.replyTo || args.from }
        : args;
      const label = await fallback(fallbackArgs);
      console.log(`[EMAIL_SENDER_STATUS] from=${fallbackArgs.from} via=${label} (FALLBACK from ${primary})`);
      return label;
    } catch (fallbackErr) {
      console.error(`[EMAIL_SENDER_STATUS] both transports failed for from=${args.from}:`, fallbackErr);
      throw fallbackErr;
    }
  }
}

/** Pre-configured From addresses, switchable in one place when business decisions change. */
export const SENDERS = {
  publicConfirmation: "HighLife Live <no-reply@highlifelive.com>",
  ownerAlert: "HighLife Live <info@highlifelive.com>",
  agentNotification: "HighLife Live <admin@highlifelive.com>",
  auditions: "HighLife Live <auditions@highlifelive.com>",
  internalBookings: "HighLife Live <bookings@highlifedmv.com>", // legacy / fallback
  epkWorkOrder: "HighLife EPK Admin <admin@highlifelive.com>",
} as const;
