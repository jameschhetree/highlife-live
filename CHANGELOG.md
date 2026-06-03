# Changelog — HighLife Live

Living log of every shipped change on `main` (demo) and `prod` (live at
highlifelive.com). Both Jeremy ([jeremy]) and Murd ([murd]) write into this
file so context never gets lost between sessions.

**Convention:** newest at top. Group by date. One line per commit, prefixed
with the SHA, the author tag, and a single sentence of plain English. Add
a `→ prod` marker when a commit is promoted to production. If a commit is
known broken or reverted later, note it inline.

---

## 2026-06-03

- `78631b3` [jeremy] **Phase 3.8 commit 4/7**: agent visibility pass — filterArtistsForEmail double-filter bug fixed; 5 tabs (bookings/campaigns/pipeline/epks/research) staged for agents via new AgentStagedNotice component.
- `53dfb00` [jeremy] **Phase 3.8 commit 3/7**: Dashboard live counts (Artists/Venues/Inquiries/Events) + DEMO badges on the rest + empty-state messages on Drafts/Pipeline/Activity. Reports gets DemoAnalyticsBanner.
- `681c8ba` [jeremy] **Phase 3.8 commit 2/7**: footer/audition mailto → display-only, seed events removed (DB-only), event cards staged ticket popup wired.
- `5ffd487` [jeremy] **Phase 3.8 commit 1/7**: shared scaffolding — StagedActionModal, DemoAnalyticsBadge/Banner, LegacyChip.
- `b0b23f9` [jeremy] **Phase 3.7 fix**: useDB() hardcoded to true. Kills the localStorage split-brain where admin pages wrote local-only while public /roster read DB.
- `32d5139` [jeremy] **Phase 3.7 fix**: /api/artists now includes 'Testing' status (the default for new artist creates). Fixes the 'created an artist but it's not on roster' bug.
- `5ce054d` [jeremy] **Phase 3.7 — admin artists → public roster**: new /api/artists endpoint; /roster, /artists/[slug], /, /book all wired to live DB instead of empty hardcoded array.
- `c832246` [jeremy] **Phase 3.7 — agent@ login removed**: only jaco + liam hardcoded. Async DB-backed agent identity via new server-only admin-permissions-server.ts. 6+ API routes updated.
- `cb558e7` [jeremy] **Phase 3.7 cleanup**: removed all fake artist data — DB (already 0), hardcoded src/lib/data.ts array, localStorage auto-seed. Stripped delete-demo-data + re-seed buttons + modal from /admin/settings.
- `aa12768` [jeremy] **Phase 3.7 B-assignments-ux**: assignments page rebuilt — all auditions listed, click status pill opens roster-style agent picker popup with thematic-gradient outline for current agent, Unassign action.
- `5792dd5` [jeremy] **Phase 3.7 C**: auditions in agent main nav, agent-scoped views (assigned only), owner-only delete.
- `b00f875` [jeremy] **Phase 3.7 B-archive**: audition Archive status (replaces Lost), delete-cascades-to-assignments, hide-by-default toggle.
- `a1bfdcf` [jeremy] **Phase 3.7 B-classifications**: dropdown adds Theatre Act (Musical) + Theatre Act (Non Musical), removes Sound Engineer, reordered.
- `caddca3` [jeremy] **Phase 3.7 D + flash-fix**: venue list agent restrictions (no CSV/cron/edit/delete, contacts in row replaced w/ city+state), 100ms render-gate pattern applied to /admin/venues/[id] + /admin/venues to kill the 'caught a glimpse' contact flash.
- `b27ee47` [jeremy] **Phase 3.7 A**: venue login requests delete button + archive hide/show toggle.
- `b5260b8` [jeremy] **Phase 3.7 pre / delete-demo-data certified + seed-demo-data endpoint**: full seed→delete cycle e2e tested. Re-seed button now hits DB, not just localStorage.
- `194e217` [jeremy] **Phase 3.7 pre / agent artist access**: 'My Artists' label for agents, owner-side Artists drawer in /admin/agent-logins to edit assignments. New /api/admin/agent-logins/[id]/artists endpoint (GET + PUT).
- `5fede4b` [jeremy] **Phase 3.7 pre / delete-demo-data fix**: skip Venue + Contact per Dok directive 'venue data is not demo data.' UI surfaces 'will preserve' list before delete.

## 2026-06-02

- `4a81b6e` [jeremy] **Phase 3.6 e2e**: scripts/e2e-3.6.mjs — 15-step chain (request → venue → artist → roster → inquiry → seen → notes → finalize → event → /events public). All pass. Mobile-verified on 390px viewport.
- `8109767` [jeremy] **Phase 3.6 Workflow B UI**: /portal/inquiries/[id] (venue-editable) + /admin/inquiries/[id] (admin meta + notes thread + Finalize as Event). Closes the inquiry → event chain end-to-end.
- `a80c6bb` [jeremy] **Phase 3.6 Workflow B API tier**: InquiryNote schema + venue/admin inquiry detail + notes + finalize-as-event endpoints. UI tier next.
- `ef71191` [jeremy] **Phase 3.6 Workflow C**: venue contact security + request/grant flow. /api/venue-access (agent self-service), /api/admin/agent-logins/[id]/venue-access (admin), contact-info block on venue detail gated for non-owners, 'Venue Access' button per agent row opens approve/deny/grant drawer.
- `dae3308` [jeremy] **Phase 3.6 Workflow A**: venue request → autofill master venue list. Per-row 'add to venue list' button + checkbox in Create Login modal. Backed by new POST /add-to-venues endpoint.
- `1b7afdd` [jeremy] **Phase 3.6 delete-demo-data**: button wired to real DB. Owner-admin guarded, audit-logged, preview counts live. Real partner data untouched.
- `8d2a400` [jeremy] **Phase 3.6 schema**: VenueContactAccessRequest + VenueContactGrant tables added. Pushed to shared Neon. Both queryable. Workflow C foundation laid.
- `337a100` [jeremy] **mascot retired** per Dok. Deleted NowBookingMascot.tsx + all mascot/box CSS, reverted hero pill to a plain Link. See MASCOT-RIP.md for the full journey + lessons.
- `937e33b` [jeremy] mascot tuning round 4: 1.33× faster lap (31.2 → 23.5s), 2× stronger speed scaling AGAIN (multipliers maxed at 5.4×, so cursor-on-top makes a ~4.4s lap), GIVE_UP_MS proportional bump to 80s.
- `d5bc203` [jeremy] mascot tuning round 3: 4× slower lap (BASE_LOOP_SECONDS 7.8 → 31.2), 6s catch (down from 7), 2× stronger inverse-radius/speed scaling (max multiplier 2.10 → 3.20), jump-into-box simplified from 3-phase plant+squash+bezier to one clean arc — fixes the visible sideways jerk before the dive.
- `37a2318` [jeremy] favicon: replaced default Next.js favicon.ico with HighLife logo (icon.png + apple-icon.png in src/app/).
- `73a2a89` [jeremy] mascot teleport fix per Dok: closeCoupon now routes through 'returning' mode (Murd's existing lerp back to dock over 950ms) instead of snap-to-pacing; entry spawn reads the paced mic's actual rendered position (mid-bunny-hop) not the wrapper center; speed multipliers softened max 3.55× → 2.10× so the chase stays catchable when cursor is close.
- `a2f29e4` [jeremy] 404 / portal-transition fix: friendly `app/not-found.tsx`, new `PortalTransition` overlay component that fades a brief "Entering / Leaving back-end tools" warning between public site and admin portal, wired into Header's Agent Login (desktop + mobile drawer) and AdminSidebar's new "Public Site" link (desktop + mobile drawer). Replaces the 404 flash Dok was hitting between portals.
- `052e599` [jeremy] mascot tuning on top of Murd's phase 3.5 (per Dok HL Live spec): slower base loop (5.6→7.8s), 7s catch (down from 8), removed inner-ring gate, soft drain instead of hard reset, GIVE_UP_MS bumped to 36s.
- `6b3435d` [murd] phase 3.5 mascot path chase polish — tuning pass on the chase/homing math on top of Jeremy's dorito-fix.
- `ba2c323` [jeremy] mascot box: closed state is now a proper flat lid parallelogram with a wrapped ribbon, not a triangular wedge sticking up.
- `163ef3f` [murd] phase 3.5 mascot copy and desktop polish — copy edits + desktop-only display rule for the pacing mic.
- `848cb56` [jeremy] mascot: kill the `tooClose` recalc that was making the mic stutter when cursor was within 130px; roll back the touch handlers per Dok's scope note.
- `7ff0679` [jeremy] mascot: touch event support + bigger box flap angle (-32°) + raised the /book partner-login disclaimer above the form so mobile readers see it without scrolling.
- `35c7d0d` [jeremy] mascot: 'panicked animal' flee model — escape direction commits for 400-700ms before re-evaluating instead of being vector-pinned to cursor.
- `dcd0619` [jeremy] mascot polish: single 'Buy Tickets' CTA on coupon popup (copies + navigates), box moved further left, smoother flee, arc wobble on homing.
- `1d11038` [jeremy] coupon popup: reframed for tickets-not-bookings, opaque non-transparent backdrop, ticket emoji + 'See Events' CTA.
- `fe16b6b` [jeremy] mascot box: custom cardboard SVG with closing flaps + ribbon bow + 'TAP TO OPEN' hint + 110×110 click target.
- `d73216e` [jeremy] mascot: smooth flee + fix box-homing bug where useEffect re-run was resetting the arc to 0.
- `f853947` [jeremy] mascot coupon code spelling: `4jeremey` → `4jeremy`.
- `0928dd2` [jeremy] mascot coupon: swap placeholder for official code `HLLbeta1.1-4jeremy`.
- `4d893a5` [jeremy] mascot full catch sequence: chase → box homing → click box → coupon popup with no auto-close.
- `a3b3ce4` [jeremy] interactive mic mascot: click to grow wings + fly, mouse-chase mechanic with 7s catch reward.
- `d8108e1` [jeremy] mascot motion: bunny pace back-and-forth, small 6px hops, ease-in-out pause at each end.
- `8ca77f5` [jeremy] mascot rebuild (vinyl → mic + sine-wave arc) + pill becomes a Link to /book with 'Now Booking 2026 & 2027' copy + sidebar shuffle (Settings into Owner Hub) + new Events admin surface (Prisma Event model + /admin/events page + /api/admin/events + public /events DB-backed with fallback).
- `22a8316` [jeremy] hero: bouncing vinyl mascot above 'Now Booking 2026' pill (tday.com-style walker, dark-glass-adapted).
- `e0bf570` [jeremy] Owner Hub IA: nested Status / Auditions / Assignments / Venue Logins / Agent Logins as expandable sidebar group.
- `8723c07` [jeremy] Booking Offer field end-to-end (schema + form on both inquiry types + admin column + agent strip) + venue identity column on /admin/inquiries.
- `da28246` [jeremy] cleanup pass: public /book 'Address' label + agent dashboard live counts + owner hub hero status flipped.
- `eab44f2` [jeremy] /events: mobile chip overflow fix + sort-by-artist added + per-city banner-style cards with date plinth + accent stripe.
- `a00d392` [jeremy] /admin/agent-logins page (Aaliyah built the API in Phase 3 V2 but no UI to drive it).
- `367b4dc` [jeremy] partner login button: middle-ground animation (spectrum ring + body shimmer + hover glow) + DJ booth hero image swapped in.
- `735b13b` [jeremy] central email transport: Zoho SMTP via Nodemailer + Resend, routed by From-domain (highlifelive.com → Zoho, highlifedmv.com → Resend).
- `a0bb7e0` [jeremy] security: venue inquiries server-scoped via signed httpOnly cookie. Was publicly enumerable by venueLoginId query param. → prod
- `fe08f47` [jeremy] admin login: DB-backed AgentLogin fallback so agents created in /admin/agent-logins can actually sign in.
- `59caae3` [jeremy] Phase 3 V2 (Murd-coordinated build): inquiry system, agent management, 5 new Prisma tables, 3 new admin pages (inquiries / assignments / owner-special), 7 new API routes, footer overhaul, events banner cards, /book partner-login CTA. → prod
- `50d2cd3` [jeremy] admin: tighten mobile padding so tables fit on 390px viewport. → prod
- `cde4a50` [jeremy] admin: bump tight action button padding (py-1.5 → py-2) for tap targets. → prod
- `6a025c6` [jeremy] admin: mobile sidebar drawer + top hamburger bar — full parity with desktop on phone. → prod
- `b8d2d08` [jeremy] header nav restructure (Agent Login text-link + Partner Login button, Book Talent removed) + /roster + /events theme polish. → prod
- `6ec479c` [jeremy] swap logo to transparent-bg full-quality PNG (from James's Gmail send). → prod

## 2026-06-01

- `7bd7cc6` [jeremy] strip passwordHash from admin venue-logins API responses. → prod
- `51738b9` [jeremy] venue/promoter partner login request phase: PartnerLoginRequest + VenueLogin Prisma models + /admin/venue-logins page + /login expandable Request Venue Login form. → prod
- `7eea6fa` [murd] polish public nav and HighLife Live branding. → prod
- `e76a0ad` [murd] restrict admin auditions and agent roster view to owner emails. → prod
- `0fb47a6` [jeremy] add third admin login (agent@highlifedmv.com) + remove email-domain placeholder hint. → prod
- `3907f88` [jeremy] swap demo logins for real ones (jaco@, liam@) + remove test-cred hints. → prod
- `63ffe6e` [jeremy] fix wav upload rejection (broaden Vercel Blob allowedContentTypes) + seamless gliding spectrum gradient on text / buttons / scrollbar. → prod
- `2d91222` [jeremy] 3 fixes batch: wider upload mime support + /admin/auditions console + gliding spectrum gradient. → prod
- earlier same day — Phase 3 V2 venue login + agent login work, all → prod via the Release 1.0 PR (`055339c` merge into prod).

---

## Notes for future writers

- When you ship a commit, prepend a one-line entry here. Don't worry about
  beauty — a one-liner with the SHA + your tag + plain English is the bar.
- If you're catching up on commits someone else shipped while you were
  away, backfill them at the top of the current day's block.
- When a commit gets promoted to prod via a PR merge, append `→ prod` at
  the end of its line. The PR description should still be the
  authoritative "what's in this release" doc.
- Don't rewrite history. If you got something wrong, add a new entry
  under today's date noting the correction; leave the original line.
