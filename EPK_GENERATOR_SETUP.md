# HighLife EPK Work-Order Setup

The website gathers an owner-only brief, asks one to three follow-up questions,
uses GPT-5.5 to turn the answers and selected photos into a design prompt, and
emails that prompt with signed private-media links. The website does not
generate or commit EPK page code.

The visible restricted Codex EPK Workspace creates the artist package. A
coordinator reviews and integrates that package into `main`; a separately
approved merge to `prod` publishes it to `highlifelive.com`.

## Access

Existing database-backed HighLife admin and owner accounts are the only
accounts that receive the signed EPK owner cookie. Agents do not receive it.

Jaco does not need to create a GitHub personal access token or a Vercel API
token for this workflow. Codex can use the repository's existing Git access.
Jaco only needs to grant Liam appropriate access to the `highlife-live` Vercel
project if Liam will manage the variables below himself.

## Required Server Configuration

Never expose these values through `NEXT_PUBLIC_*`.

- `ADMIN_SESSION_SECRET`
  - At least 32 cryptographically random bytes.
  - Required to sign the HTTP-only owner session and CSRF token.
  - Configure anywhere the admin EPK page must operate.
- `OPENAI_API_KEY`
  - Dedicated OpenAI project key for GPT-5.5 Responses API calls.
  - The API receives text plus at most three low-detail photos.
  - Video, audio, and PDF bytes are never sent to OpenAI.
- `EPK_BLOB_READ_WRITE_TOKEN`
  - Existing private `highlife-epk-quarantine` Blob store token.
- Existing Zoho SMTP configuration:
  - `ZOHO_SMTP_HOST`
  - `ZOHO_SMTP_PORT`
  - `ZOHO_SMTP_SECURE`
  - `ZOHO_SMTP_USER`
  - `ZOHO_SMTP_PASS`
  - `admin@highlifelive.com` must be authorized as the exact From address.

- `EPK_ASSET_LINK_SECRET`
  - Independent 32-byte secret for seven-day asset links.
  - Falls back to `ADMIN_SESSION_SECRET` when omitted.

The public `BLOB_READ_WRITE_TOKEN` is not used during intake. Public media
promotion remains an explicit shipping action after the generated package and
files have been reviewed.

## Workflow

1. An owner submits an eligible `Active` or `Priority` artist, direction, links,
   and media.
2. Uploads remain in the private EPK quarantine store.
3. The owner answers one to three structured questions.
4. GPT-5.5 inspects text and up to three photos at low detail, then emits
   `EPK_BUILD_REQUEST_V1`.
5. The app emails the prompt and seven-day signed download links from
   `admin@highlifelive.com` to `epk@highlifelive.com`. There are no attachments.
6. Liam pastes the prompt into the restricted EPK Workspace and downloads only
   the media needed for that job.
7. Codex outputs one package under `src/generated/epks/<artist-slug>/` plus a
   registry snippet.
8. The coordinator validates, integrates, builds, and pushes to `main`.
9. Production remains untouched until Liam explicitly approves the `prod`
   merge.

Git commits are the EPK version and rollback history. There is no application
EPK-version table, GitHub dispatch token, callback secret, Vercel API token, or
app-side generation worker.

## Verification

```bash
npm run epk:validate
npx eslint src/lib/epk src/app/api/admin/epks src/app/admin/epks
npm run build
```

Generated packages are validated locally with `npm run epk:validate` before
they are committed. No repository Actions workflow or workflow-scoped personal
access token is required.
