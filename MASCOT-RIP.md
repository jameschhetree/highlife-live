# Mascot Experiment — Notes for the Morgue
**Lifespan:** 2026-06-02 14:27 → 2026-06-02 ~23:00 (~8 hours, ~25 commits)
**Killed by:** Dok via HL Live, "we are killing the mouse chase idea, the popup coupon, the box, and the mascot all together"

Component file kept in-repo at `src/components/NowBookingMascot.tsx` for reference. Pill on the homepage reverted to a plain `<Link>` to /book.

## What we shipped (chronological)

1. **Vinyl walker mascot** (commit `22a8316`) — pixel-walking SVG record disc above the "Now Booking 2026" pill, tday.com-style left-right traversal with squash-and-stretch and direction flip via `scaleX(-1)`. James called it an "eyeball."
2. **Mic mascot, sine-wave arc** (`8ca77f5`) — swapped vinyl for a microphone SVG, floating in a sine-wave arc above the pill with a pendulum sway. James: "make it bounce, pause, on a horizontal line, like a bunny — not crazy bounce."
3. **Bunny pace** (`d8108e1`) — flat baseline, 6px hops every 0.65s with ease-in-out pace alternating direction. CSS-only.
4. **Click-to-fly interactive** (`a3b3ce4`) — click pacing mic → wings appear, mic detaches into a free-roam fixed-position element that flees the cursor. Mouse-chase with 7s catch timer + "you caught it" reward toast.
5. **Full catch sequence** (`4d893a5`) — chase 7s → mic homes to box (📦 emoji at first) → click box → coupon popup with `HLLbeta1.1-4jeremy` code, copy + See Events CTA.
6. **Coupon = tickets, not bookings** (`1d11038`) — opaque modal, 🎟️ icon, "use at checkout on any upcoming show" copy, CTA → /events.
7. **Custom cardboard box SVG** (`fe16b6b`) — replaced 📦 emoji with custom flap+ribbon SVG, 110×110 click target, "TAP TO OPEN" hint label.
8. **Panicked-animal flee model** (`35c7d0d`) — escape direction commits 400-700ms before re-evaluating, instead of vector-pinned to cursor.
9. **`tooClose` stutter killed** (`848cb56`) — the inner-radius recalc was flipping escape direction every frame at cursor proximity.
10. **Box geometry fix** (`ba2c323`) — Dok's "dorito on its head" — replaced flap-rotation pattern with discrete open/closed SVG renders. Closed state = flat parallelogram lid with ribbon bow.
11. **Path-based circuit (Murd `6b3435d` + `163ef3f`)** — catmull-rom interpolated 7-point closed loop, cursor-distance multiplier for lap speed, revealing/jumping/returning state machine.
12. **Tuning rounds** (`052e599`, `73a2a89`, `d5bc203`, `937e33b`) — 4 sequential calibration commits adjusting BASE_LOOP_SECONDS (5.6 → 7.8 → 31.2 → 23.5), CHASE_REQUIRED_MS (8000 → 7000 → 6000), max speed multiplier (3.55 → 2.10 → 3.20 → 5.40), drain-on-miss model.
13. **Teleport fixes** (`73a2a89`) — coupon close routes through Murd's `returning` lerp instead of snap-to-pacing; spawn position uses paced mic's actual rendered rect instead of wrapper center.

## What worked

- **Visual motion mechanics** — CSS bunny-pace + spectrum-glide on the partner-login button + scrollbar gradient: all still in production-ish shape and reusable.
- **Cardboard box SVG (closed state)** — the flat-lid parallelogram with ribbon bow looks like a proper present, decoupled from any rotation-based flap rigging.
- **Coupon popup** — opaque modal, copy-to-clipboard + Buy Tickets CTA pattern, fully on-theme.
- **PortalTransition overlay** (`a2f29e4`) — built as part of the same iteration arc but UNRELATED to the mascot mechanic; bridges admin↔public with a 750ms "Entering/Leaving back-end tools" warning. KEPT — useful regardless.
- **CHANGELOG.md** convention — born from this iteration storm. KEPT.

## What didn't work

- **Free-roam flee model** ("panicked animal") — felt either too sticky (vector-pinned) or too chaotic (random kicks every frame). Three rewrites couldn't land it. Murd's circuit-based path was a cleaner pattern but Dok still wasn't satisfied.
- **The box never appearing in Dok's session** — even after the path-chase flow was working in Playwright, Dok consistently reported "I don't see the box anywhere." Suspected real bug: the chase-to-revealing transition was not firing in his viewport / browser combination, despite Playwright showing flying-mic-position updates working. Final Playwright trace at 20s of synthesized perfect-chase: zero box appearances. Root cause was never identified before kill.
- **Catch difficulty tuning** — went through 4 rounds of "too slow / too fast / too hard / too easy" without converging. Spec was evolving each round (free-roam flee → circuit → speed-multiplier scaling → catch-radius widening). The target moved as fast as the mic.
- **Mobile** — touch handlers added once, rolled back when Dok said "no mobile updates." Mascot was desktop-only by design but never really tested on mobile so this might have been a sub-issue.
- **Cache-vs-deploy confusion** — multiple rounds where Dok said "nothing changed" because Safari was serving stale chunks. Cost ~3 rounds of round-trip before diagnosing as a local-cache issue.

## Why we killed it

Dok's literal words (HL Live, 2026-06-02 ~23:00): "we are killing the mouse chase idea, the popup coupon, the box, and the mascot all together."

Likely contributing factors:
- 25+ commits in ~8 hours with the spec evolving every iteration. No stable target.
- Time-to-value vs effort ratio kept getting worse. The mic itself was decoration; the chase + box + coupon was a mini-game; the coupon code was the actual payoff. Three layers of polish to deliver one promo code felt heavy.
- Multiple "I don't see X" reports on the live deploy that couldn't be reproduced cleanly in Playwright. Trust between sender + receiver of bug reports started eroding.

## What's left in code

- `src/components/NowBookingMascot.tsx` — entire component preserved, unused. Can be restored to home page in one line of JSX if revived. Self-contained, no external dependencies.
- `src/app/globals.css` — `.mascot-mic`, `.mascot-wing*`, `.box-flap*`, `.mascot-box-wiggle` keyframes preserved. Inert without the component, no overhead.

## Lessons for future interactive easter eggs

1. **Lock the spec before building.** This is the lesson. We changed the catch model 4 times mid-build, and the geometry of the mic + box + dock at every commit. Whoever spec'd this next time should produce a 1-page brief covering motion / catch / reward / visual / replay before any code lands.
2. **Verify the bug in the same environment the reporter is in.** Playwright Chromium ≠ Dok's Safari. We diagnosed a "no box" bug remotely as "your cache" three times before reproducing it in synthetic chase.
3. **Easter eggs are luxury. Build them last, not first.** This was a hero-card decoration with a discount-code payoff. Discount codes don't need a mini-game wrapper to be useful. If we'd shipped the coupon as a static "Now Booking 2026 & 2027 → use code HLLbeta1.1-4jeremy at checkout" pill from the start, same business value, zero rabbit-hole hours.
