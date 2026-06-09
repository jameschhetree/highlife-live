# Phase 3.6 — Build Plan

**Source brief:** Dok via HL Live, 2026-06-02 ~23:30. Saved at `/Users/james/.claude/telegram-bot-v3/photos/-5007421055_19991_Liam-3.6-Phase-instructions.txt`.

**Goal in one sentence:** Two business workflows (venue login request → login created; booking inquiry → event) end-to-end databased, linked between partner portal + admin portal, with proper action buttons and notes. Plus venue-contact security and a working delete-demo-data button.

**Explicit out-of-scope (Dok):** Phase 3.7 / 4.0 work. Design changes.

---

## Acceptance criteria (Dok's literal trigger list)

A venue requests a login → admin adds them from admin portal.
An artist requests an audition → admin adds them (artist appears on roster page with profile pic + box).
Venue logs into partner portal.
Venue submits an inquiry via partner portal.
Admin marks inquiry seen → partner portal updates to "seen".
Venue adds a note → admin sees the note.
Admin finalizes inquiry as event → appears in Events tab (admin) → appears on Events front page (public).

If any link in that chain breaks, 3.6 is not done.

---

## What already exists (verified in repo)

| Piece | Status | Path |
|---|---|---|
| PartnerLoginRequest model | ✅ | `prisma/schema.prisma` |
| Public partner request API | ✅ | `src/app/api/partner-request/` |
| Admin venue-logins requests API | ✅ | `src/app/api/admin/venue-logins/requests/` |
| Admin venue-logins page | ✅ | `src/app/admin/venue-logins/page.tsx` |
| VenueLogin model | ✅ | `prisma/schema.prisma` |
| Venue auth API | ✅ | `src/app/api/venue-auth/` |
| Partner portal page | ✅ | `src/app/portal/page.tsx` (single file — needs expansion) |
| Inquiry model | ✅ | `prisma/schema.prisma` |
| Public inquiry API | ✅ | `src/app/api/inquiries/` |
| Admin inquiry API | ✅ | `src/app/api/admin/inquiries/` |
| Admin inquiries page | ✅ | `src/app/admin/inquiries/page.tsx` |
| Event model | ✅ | `prisma/schema.prisma` |
| Public events page | ✅ | `src/app/events/` |
| AgentLogin + AgentArtistAssignment | ✅ | `prisma/schema.prisma` |

## What's missing (the build list)

### Workflow A — Venue Login Request → Login Created
- [ ] In admin venue-logins request approval flow: detect if `organizationName` matches an existing `Venue` row. If not, prompt admin to create a new Venue with autofill from the request (org name, address, contactName, workEmail, workPhone, etc.).
- [ ] "Add to venue list" quick-action button on the request screen — single-click creates a Venue row from the request even without approving the login yet.
- [ ] Preserve the existing CRM look on the venue list — Dok called this out: "good thinking on the current venue list crm look, keep that".

### Workflow B — Booking Inquiry full lifecycle
- [ ] Partner portal — `/portal/inquiries` list of inquiries this venue has submitted (scoped by `venueLoginId`).
- [ ] Partner portal — `/portal/inquiries/[id]` detail page. Fields editable EXCEPT date, requested artist, proposed offer. (Read-only on those three.)
- [ ] Partner portal — show admin "Seen" status when admin marks it reviewed.
- [ ] Partner portal — note thread (venue can add notes, admin sees, admin can reply).
- [ ] Admin inquiries detail — quick actions: mark seen, reply, finalize → event.
- [ ] Admin → "Finalize as event" creates Event row, marks inquiry Booked, links them, shows up in /admin/events AND on the public /events page.

### Workflow C — Venue Contact Security
- [ ] Venue data editable only by James (jaco) or Liam (dok) — gate writes behind super-admin role.
- [ ] Agent view of venue data: name, type, capacity, region visible; contact name / email / phone / bookingEmail / talentBuyerEmail / instagram HIDDEN.
- [ ] On a venue page in agent view: "Request venue contacts" button.
- [ ] New model: `VenueContactAccessRequest { id, agentLoginId, venueId, status [pending/approved/denied], requestedAt, decidedAt, decidedBy }`.
- [ ] New model: `VenueContactGrant { id, agentLoginId, venueId, grantedAt, grantedBy }`.
- [ ] Admin → /admin/agent-logins — new "venue access" button per row → modal/page listing this agent's pending requests + currently granted venues; bulk approve / approve one / grant additional (search venues).

### Workflow D — Delete Demo Data button
- [ ] Settings → "Delete demo data" button. Must remove `isDemo=true` records from Artist, Venue, Contact, Campaign, Opportunity, Inquiry, Event (NEVER touch venue contact data unless flagged demo). Confirmation modal required.
- [ ] After delete, the page that called it should refresh and show 0 demo records.

### Workflow E — Mobile + scope discipline
- [ ] All new pages mobile-responsive (Tailwind sm: / md: breakpoints, tested by resizing in dev).
- [ ] Inquiry queries everywhere scope by `agentLogin → assigned artists` for agent-portal views.
- [ ] Inquiry queries scope by `venueLoginId` for partner-portal views.

---

## Build order (smallest blast radius first)

1. **Schema migrations** — add `VenueContactAccessRequest` + `VenueContactGrant` + role field on User/admin. Single migration. Verify with `npx prisma migrate dev`.
2. **Delete-demo-data button** — small, contained, immediate value. Settings page.
3. **Workflow A** — venue request → Venue autofill prompt.
4. **Workflow C** — venue contact hide + request/grant flow (depends on schema from step 1).
5. **Workflow B** — inquiry detail + notes thread + finalize-as-event (largest piece, last).
6. **Mobile pass** — touch every page added/changed, confirm sm/md responsive.
7. **End-to-end manual run** — execute Dok's literal trigger list start to finish, screenshot each step.

Each step = its own commit. Each commit gets a CHANGELOG entry.

## What this does NOT include
- New design language / colors / typography (Dok: "don't make any design changes")
- Phase 3.7 admin-feature fixes
- Phase 4.0 polish
- Touching prod — demo branch (main) only, except for any Prisma migrations that need to run against prod DB because demo + prod share the same Neon instance (will flag before doing).

## Coordination
- Working on `main` (the demo branch). Will commit per discrete piece, not one mega-commit. `do it in branches or whatever` = compatible with per-piece commits on main.
- Murd briefing at `MURD-PHASE-3.6-BRIEF.md`.
- Each commit → CHANGELOG.md entry with SHA.

## When 3.6 is done
- Dok runs the literal trigger list himself, end-to-end. If any step fails, that step is back on the build list. When all pass: phase 3.6 closed, hand off to Dok for 3.7 spec.
