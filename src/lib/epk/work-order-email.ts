import "server-only";

import { SENDERS, sendEmail } from "@/lib/email";

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
  prompt: string;
  assets: WorkOrderAsset[];
}): Promise<string> {
  const address = epkWorkOrderAddress();
  const assetLines = input.assets.map(
    (asset) =>
      `- [${asset.kind}] Save as current/input/assets/${asset.workspaceFilename}\n  Original: ${asset.filename}\n  ${asset.downloadUrl}`,
  );
  const text = [
    `EPK generation requested for ${input.artistName}`,
    `Job: ${input.jobId}`,
    "",
    "Download every supporting file and place it under current/input/assets. The download already uses the exact workspace filename required by the prompt.",
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
        <p>Download every supporting file and place it under <code>current/input/assets</code>. Each download already uses the exact workspace filename required by the prompt.</p>
        <h2 style="font-size:18px;margin-top:28px">Signed private media links</h2>
        <p style="color:#52525b">These links expire after seven days. Do not forward this email.</p>
        ${assetHtml}
        <h2 style="font-size:18px;margin-top:28px">Codex prompt</h2>
        <pre style="white-space:pre-wrap;word-break:break-word;background:#0a0a0a;color:#f4f4f5;padding:20px;border-radius:12px;font-size:12px;line-height:1.55">${escapeHtml(input.prompt)}</pre>
      </div>
    `,
  });
}
