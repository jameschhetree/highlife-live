import "server-only";

import { SENDERS, sendEmail } from "@/lib/email";
import { buildEpkWorkspaceHandoff } from "@/lib/epk/workspace-handoff";

type WorkOrderAsset = {
  id: string;
  kind: string;
  filename: string;
  workspaceFilename: string;
  downloadUrl: string;
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function epkWorkOrderAddress(): string {
  return "epk@highlifelive.com";
}

export function epkEmailConfigured(): boolean {
  return Boolean(
    process.env.ZOHO_SMTP_USER &&
      process.env.ZOHO_SMTP_PASS &&
      process.env.ZOHO_SMTP_HOST,
  );
}

export async function sendEpkWorkOrder(input: {
  jobId: string;
  artistName: string;
  artistSlug: string;
  prompt: string;
  assets: WorkOrderAsset[];
}): Promise<string> {
  const address = epkWorkOrderAddress();
  const handoff = buildEpkWorkspaceHandoff(input);
  const assetLines = input.assets.map(
    (asset) =>
      `- [${asset.kind}] Save as artists/${handoff.artistSlug}/input/assets/${asset.workspaceFilename}\n  Original: ${asset.filename}\n  ${asset.downloadUrl}`,
  );
  const text = [
    `EPK generation requested for ${input.artistName}`,
    `Job: ${input.jobId}`,
    "",
    `Artist task: ${handoff.threadName}`,
    `Save the downloaded request as: ${handoff.requestRelativePath}`,
    `Save every supporting file under: artists/${handoff.artistSlug}/input/assets`,
    `Durable approved media lives under: artists/${handoff.artistSlug}/media`,
    `Generated output belongs under: artists/${handoff.artistSlug}/output`,
    "Each download already uses the exact workspace filename required by the request.",
    "",
    "SIGNED PRIVATE MEDIA LINKS (expire after seven days)",
    assetLines.length > 0 ? assetLines.join("\n") : "No media uploaded.",
    "",
    "CODEX PROMPT",
    input.prompt,
  ].join("\n");
  const assetHtml =
    input.assets.length > 0
      ? `<ul>${input.assets
          .map(
            (asset) =>
              `<li><strong>${escapeHtml(asset.kind)}</strong>: <a href="${escapeHtml(asset.downloadUrl)}">${escapeHtml(asset.workspaceFilename)}</a><br><small>Original: ${escapeHtml(asset.filename)}</small></li>`,
          )
          .join("")}</ul>`
      : "<p>No media uploaded.</p>";

  return sendEmail({
    from: SENDERS.epkWorkOrder,
    to: address,
    strictFrom: true,
    subject: `EPK generation requested: ${input.artistName}`,
    text,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:760px;margin:0 auto;padding:28px;color:#171717">
        <h1 style="font-size:24px;margin:0 0 8px">EPK generation requested</h1>
        <p style="margin:0 0 20px"><strong>${escapeHtml(input.artistName)}</strong><br>Job ${escapeHtml(input.jobId)}</p>
        <p>Open <strong>${escapeHtml(handoff.threadName)}</strong>.</p>
        <p>Save the request as <code>${escapeHtml(handoff.requestRelativePath)}</code>.</p>
        <p>Save every supporting file under <code>artists/${escapeHtml(handoff.artistSlug)}/input/assets</code>. Durable approved media belongs under <code>artists/${escapeHtml(handoff.artistSlug)}/media</code>, and generated output belongs under <code>artists/${escapeHtml(handoff.artistSlug)}/output</code>.</p>
        <h2 style="font-size:18px;margin-top:28px">Signed private media links</h2>
        <p style="color:#52525b">These links expire after seven days. Do not forward this email.</p>
        ${assetHtml}
        <h2 style="font-size:18px;margin-top:28px">Codex prompt</h2>
        <pre style="white-space:pre-wrap;word-break:break-word;background:#0a0a0a;color:#f4f4f5;padding:20px;border-radius:12px;font-size:12px;line-height:1.55">${escapeHtml(input.prompt)}</pre>
      </div>
    `,
  });
}
