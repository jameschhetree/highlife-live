# EPK Generator Setup

The website creates a design work order; a visible artist-specific Codex task builds the page. The application server does not generate or deploy EPK code.

## Permanent Identity

- Workspace folder: `EPK Generator Workspace/artists/<artist-slug>/`
- Visible task: `EPK | <Artist Name>`
- Active request: `artists/<artist-slug>/input/epk-build-request-<job-id>.txt`
- Downloaded assets: `artists/<artist-slug>/input/assets/`
- Durable media: `artists/<artist-slug>/media/`
- Generated package: `artists/<artist-slug>/output/`
- Completed request: `artists/<artist-slug>/archive/requests/<job-id>/`

The website completion screen and work-order email must identify the same artist slug, task name, destinations, and build command. Revisions reuse the same folder and task.

## Lifecycle

The artist task validates the request and assets, generates the package, runs QA, then executes `node scripts/finalize-epk-job.mjs --artist <artist-slug>`. The finalizer preflights every operation before moving data. Passing work archives the request, promotes supporting files into durable media, updates tracking records, and leaves input ready. Failed work keeps request and assets in place. Different-content filename collisions stop the lifecycle and are recorded as QA failures.

The success line `PASS — Ready for coordinator integration review.` is valid only after finalization. Coordinator integration to `main`/test is separate. Production requires separate explicit approval.
