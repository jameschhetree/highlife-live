# Phase 3.9 → 5.0 Implementation Report

Branch: main → demo (auto-deploys per existing Vercel project rules).
Window: 2026-06-05.
Brief: Murd's "Phase 3.9 → 5.0 implementation brief from Liam, refined by Murd" (13 scopes, 15-commit plan + final report).

## Commit log

```
9ff074e  1/15  schema — additive 7 tables + 4 new (Inquiries → Bookings → Events)
affb845  2/15  public booking — Developing popup + offer/split rename (Scope 1)
7fb99e1  3/15  auditions Act Description (Scope 2)
53e703a  4/15  events public — sort, year display, details drawer (Scope 3)
d2d1d16  5/15  inquiry workflow — new statuses, Working substatus, archive, Add To Bookings (Scope 4)
8ef4a1c  6/15  bookings operational backend — list/detail/new + materials + ECR (Scope 5)
797aba5  7/15  events admin + agent visibility + ECR queue (Scope 6)
8d1858a  8/15  pipeline hidden, events promoted, demo surfaces gated (Scope 7 + Scope 13 prep)
fe75879  9/15  venues + agent auto-grant on partner inquiry (Scope 8)
c4acd2b  10/15 venue logins — auto-link to Venue, delete re-opens request (Scope 9 core)
dbf116f  11/15 auditions — new statuses, agent delete, convert → artist (Scope 10)
797b9ec  12/15 artists — Developing/Left statuses, profile photo, notes button (Scope 11)
2840ae1  13/15 partner portal — hide/unhide inquiries, auto-prefill booking from linked Venue (Scope 12)
3f56812  14/15 agent portal cleanup — reports staged for agents (Scope 13)
(this commit) 15/15  this report
```

## Schema changes summary (Commit 1 only)

All additive; zero drops, zero destructive ALTERs. Single push with `--accept-data-loss` flag (approved by Murd for the `Booking.eventId @unique` constraint on a brand-new column with all NULLs).

- **Booking**: + eventTitle, eventDescriptionPublic, finalOffer, ticketUrl, ticketsSold, inquiryId, eventId @unique, artistId, venueId, agentLoginId + materials/ecr inverses. Status column retained as DB legacy (hidden from UI + API list responses per Liam lock).
- **Event**: + description, showDescription, address, showAddress, customBannerEnabled, bannerUrl, featuredArtistIds, externalArtists. Inverse `booking Booking?` via the FK owned by Booking.eventId (one named relation, no ambiguity).
- **Inquiry**: + workingSubstatus + bookings/eventCardRequests/partnerInquiriesHidden inverses.
- **Venue**: + zipCode + bookings/venueLogins/timelineEvents inverses.
- **VenueLogin**: + venueId FK + partnerInquiriesHidden inverse.
- **AgentLogin**: + bookings + eventCardRequests inverses.
- **AgentApplication**: + actDescription.
- **Artist**: + bookings inverse.

New tables: `EventCardRequest`, `BookingMaterial`, `VenueTimelineEvent`, `PartnerInquiryHidden`.

Verification script `scripts/verify-phase39-commit1.mjs` confirms each new table is countable (all 0 rows) and each new column returns null/default cleanly on every modified model.

## Per-role summary

### Owner (jaco@highlifedmv.com, liam@highlifedmv.com)
- Inquiries: full status set (New / Reviewed / Replied / Working / Contract Sent / Booked / Archived), Working substatus chips, "Add To Bookings" on Booked, Archive toggle, editable event date, "Booking Offer/Proposed Split" surface.
- Bookings: full operational layer — eventTitle, description (public), final offer/split, ticket URL + tickets sold, materials (URL paste, per kind), Event Card Request queue.
- Events: hide past/draft toggles, ECR queue button (pending badge), full edit form including description/showDescription, address/showAddress, custom banner on/off, multi-select Featured Artists (DB) + External Acts (text). "Create Event from request" auto-prefills + flips ECR status to Created.
- Venues: Show DNC toggle, 5-way sort, zipCode replaces Region in form (Region kept in DB), new types (Amphitheater, Stadium), Recent Flop relationship status, clickable website, Notes & Timeline (URL-attached, author email-minus-domain).
- Venue Logins: Show Converted / Show Archived toggles; auto-link to Venue by org or email domain; delete re-opens linked PartnerLoginRequest as New.
- Auditions: status set updated, Convert → Artist (auto-populates name/classification/contact/links/Act Description → bio).
- Artists: Developing + Left statuses, profile photo URL, manager contact, secondary genres tag editor, Add Note button now writes timestamped internal notes.
- Owner Hub now only: Status / Assignments / Venue Logins / Agent Logins / Settings (Events promoted to top-level nav).

### Agent
- New top-level Bookings + Events visibility (scoped: Bookings show only assigned-artist bookings; Events show only events where featuredArtistIds intersects assignments).
- Money fields (bookingOffer, finalOffer, proposed split) now visible on scoped inquiries + bookings (per 2026-06-05 lock update).
- Inquiry workflow: agents can mark status, set workingSubstatus, edit eventDate, archive. Owner-only fields: artist identity, opening bookingOffer.
- Bookings: agent creation requires assigned artist; can edit all booking fields; can file Event Card Requests on owned/assigned bookings.
- Auditions: can delete assigned auditions (server-enforced); can no longer hit the "Replied/Booked" old set.
- Venue contact access auto-granted when a linked partner venue submits an inquiry for an assigned artist (server-side; no UI required).
- Nav cleanup: Pipeline / Campaigns / EPKs / Research Queue / Reports / Owner Hub all hidden from sidebar + URL-staged.

### Venue Partner
- /book auto-prefills venueName + concatenated address from linked Venue (when authed + VenueLogin.venueId set). Never overwrites in-progress edits.
- Portal: Hide / Unhide inquiries per-venue (PartnerInquiryHidden; one venue cannot hide another's). "Show hidden (N)" toggle.
- Card text wraps via break-words (no overflow on long venue/event names).

### Public booker
- "Booking Offer/Proposed Split" relabeling everywhere.
- "Developing Artists →" link button under the Artist dropdown opens a popup listing all status=Developing artists (public-safe fields only: name, genre, short pitch, city/state). Selecting one routes through the standard inquiry flow.

### Ticket buyer
- /events: sort fixed (upcoming ascending, past descending); year row shown on date plinth when event year ≠ current year; "Event Details" button beside Buy Tickets opens right-side drawer with description (gated by showDescription), address (gated by showAddress), featured artists, and a duplicate ticket CTA. Sold Out events still suppress the ticket CTA; "Tickets Soon" pattern preserved.

## What is live vs staged vs deferred

### Live (on demo/main now)
All 13 scopes from the brief have shipped at least the core directives. Specifically:
- Schema (Scope 1 — Commit 1)
- Public booking form (Scope 1 — Commit 2)
- Auditions Act Description (Scope 2 — Commits 3 + 11)
- Events public page (Scope 3 — Commit 4)
- Inquiry workflow (Scope 4 — Commit 5)
- Bookings operational backend (Scope 5 — Commit 6)
- Events admin + agent visibility (Scope 6 — Commits 7 + 8)
- Venues (Scope 8 — Commit 9)
- Venue Logins linkage (Scope 9 — Commit 10, core only)
- Auditions full Scope 10 (Commit 11)
- Artists (Scope 11 — Commit 12)
- Partner portal (Scope 12 — Commit 13)
- Agent portal cleanup (Scope 13 — Commits 8 + 14)

### Staged (UI placeholder, not destructive)
- /admin/pipeline for agents → AgentStagedNotice (existing) targeting Phase 5.0 rewire onto real Inquiry/Booking workflow per L4 lock + Scope 7 directive.

### Deferred (flagged for 5.0)
- **Agent Logins venue-access browse UI** (Scope 9): "5-at-a-time scrollable list with sort by venue type / name / capacity / state" remains a 5.0 polish item. The underlying grant/revoke/approve API + the existing per-venue request flow + the new auto-grant (Commit 9) cover the operations. Adding the browse UI on top of the existing `/admin/agent-logins/[id]/venue-access` POST surface is straightforward when prioritized.
- **Pipeline rewire** (Scope 7) onto real Inquiry+Booking records. Held to 5.0 per L4 explicit lock; this pass hides Pipeline from agents and keeps owner pipeline at the existing demo state (no fake/demo money board surfaced to agents).
- **Outbound email log on Venue Timeline** (Scope 8): VenueTimelineEvent supports kind="email" but there's no current email-activity write path. Hooks for future email automation are open without locking the schema.

## Exact verification performed

- `prisma format` + `prisma validate` + `prisma generate` all clean before any DB push (Commit 1 pre-push gate).
- `prisma migrate diff` SQL preview shared with Murd; 165 lines, all ADD COLUMN / CREATE TABLE / ADD FOREIGN KEY / CREATE INDEX. Zero DROP, zero destructive ALTER.
- `prisma db push --accept-data-loss` (Murd-approved for the @unique on brand-new Booking.eventId).
- Verification queries: 4 new tables all countable (0 rows), every modified model returns rows with new columns populated to null/default.
- `npx tsc --noEmit` clean after every commit.
- All 14 build commits pushed to main; each triggered the existing demo Vercel build.

## Any Liam decisions still needed

None for 3.9 → 5.0 scope. Open questions for the next pass:
1. Pipeline 5.0 rewire — should Pipeline merge into Inquiries (one workflow board) or remain a separate workflow view that derives from Inquiry.status + Booking + EventCardRequest? My read: collapse Pipeline into a Kanban view of Inquiry.status (since Inquiry.status now carries the operational workflow). Need explicit decision before building.
2. Agent venue-access browse UI design — owner grants from a "browse 5-at-a-time" list. Need to confirm: include status/relationship filters, or just the four sort axes?
3. BookingMaterial upload UX — URL paste is shipped this pass. If James/Liam want native upload through Vercel Blob later, scope it separately (separate route + size guards).

— Jeremy
