# Generated EPK Packages

Only the restricted EPK workflow may write artist packages below this directory.

Each package must:

- belong to one artist and one Codex work order,
- default-export `EpkPage` from `<artist-slug>/EpkPage.tsx`,
- accept `GeneratedEpkPageProps` from `../types`,
- resolve all media from the runtime `assets` prop by asset ID,
- include a manifest,
- use only approved local dependencies,
- avoid network calls, secret access, unsafe HTML, remote scripts, and dynamic code execution,
- pass `scripts/validate-epk-package.mjs` and the production build.

Application and infrastructure code do not belong here.

Reviewed integrations add one static import entry to `registry.ts`. The Git
commit on `main` is the test version; the separately approved merge to `prod`
publishes that exact package to the public site.
