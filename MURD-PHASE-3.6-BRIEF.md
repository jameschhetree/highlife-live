# Murd — Phase 3.6 Briefing

**From:** Jeremy
**Date:** 2026-06-02
**Status of mascot work:** Killed by Dok ~23:00. Component deleted, CSS stripped, post-mortem at `MASCOT-RIP.md`. Pill on homepage is now a plain Link to /book.

## What Dok asked for

Two business workflows fully databased + linked between partner portal and admin portal, plus a venue-contact security model and a working delete-demo-data button. Full spec at `PHASE-3.6-PLAN.md` in repo root.

**Read that file before touching any code.**

**Acceptance criteria (Dok's literal trigger list):** venue requests login → admin adds → artist requests audition → admin adds (artist on roster w/ pic+box) → venue logs into partner portal → venue submits inquiry → admin marks seen → partner portal updates to seen → venue adds note → admin sees note → admin finalizes as event → appears in /admin/events → appears on public /events. If any link breaks, 3.6 isn't done.

**Out of scope (Dok explicit):** Phase 3.7 work. Phase 4.0 polish. Design changes of any kind.

## What I've already done

- Plan doc shipped (`5aae752`): `PHASE-3.6-PLAN.md`
- Six tasks in the task tracker covering schema → delete-demo → Workflow A → Workflow C → Workflow B → mobile/e2e.

## What I'm about to start

Step 1: Prisma schema migration adding `VenueContactAccessRequest` + `VenueContactGrant` + super-admin role flag. Single migration. Demo + prod share a Neon instance so I'll flag before running the migration against the shared DB.

## How we split

I'll work through the task list in order on `main`. If you come online and want to grab a piece, **pick something not currently marked in-progress in the task tracker** and tag your commits `[murd]`. The dangerous overlap zone is the schema — if either of us touches `prisma/schema.prisma` while the other is mid-migration, we'll clash. Coordination rule: **don't touch the schema unless the task tracker says you're the one on it.**

For non-schema work (UI / API routes / page builds) — go for it, just commit per piece (not one mega-commit), drop a CHANGELOG entry, and avoid touching files I have in flight (check `git log --oneline -5` before starting).

## Coordination protocol

1. Read `PHASE-3.6-PLAN.md` start to finish.
2. Read this briefing.
3. Check current task tracker before starting anything.
4. Commit with `[murd]` prefix.
5. Each commit → CHANGELOG entry with your SHA.
6. If you hit a conflict, **don't force-push, don't reset.** `git pull --rebase origin main`, resolve, push. We escaped one merge race already on the mascot work — let's not stress-test the resolver.

## What NOT to do

- Don't push to `prod` branch. Dok said demo only (with the exception of any DB migration that has to run on the shared Neon prod DB — flag before).
- Don't add design polish — Dok was explicit.
- Don't reach for Phase 3.7 or 4.0 work.
- Don't blow up the `Venue` table contacts. Dok flagged "venue data is very real right now."

Tag me on Telegram (HL Live, chat `-5007421055`) if anything is unclear or if you want to swap a piece.

— Jeremy
