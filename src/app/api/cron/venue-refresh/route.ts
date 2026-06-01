import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

/**
 * Daily venue master-list refresh.
 *
 * Pattern modeled after the HighLife podcast prospecting cron
 * (/Users/james/.claude/scripts/highlife-prospect-drop.sh):
 *   1. Pull existing venues for dedupe context.
 *   2. Ask Claude Haiku to generate N fresh DMV candidates we don't already have.
 *   3. Live-check each website via HEAD to drop dead URLs.
 *   4. Return the verified survivors as JSON.
 *   5. (Future) Insert into Postgres with review_status="needs_review".
 *
 * James plugs in Bandsintown / Songkick / Pollstar API keys later — they become
 * additional source adapters in the same pipeline (one fetch() each, merge into
 * candidates pool, dedupe, verify, persist).
 *
 * Scheduled via vercel.json crons at 07:00 UTC daily.
 */

const CURATED_SEED = [
  { name: "Echostage", city: "Washington, DC", state: "DC", region: "Washington, DC", venueType: "Club", capacity: 3000, website: "https://echostage.com" },
  { name: "9:30 Club", city: "Washington, DC", state: "DC", region: "Washington, DC", venueType: "Theater", capacity: 1200, website: "https://930.com" },
  { name: "The Anthem", city: "Washington, DC", state: "DC", region: "Washington, DC", venueType: "Theater", capacity: 6000, website: "https://theanthemdc.com" },
  { name: "Black Cat", city: "Washington, DC", state: "DC", region: "Washington, DC", venueType: "Club", capacity: 700, website: "https://blackcatdc.com" },
  { name: "Howard Theatre", city: "Washington, DC", state: "DC", region: "Washington, DC", venueType: "Theater", capacity: 1200, website: "https://thehowardtheatre.com" },
  { name: "Songbyrd Music House", city: "Washington, DC", state: "DC", region: "Washington, DC", venueType: "Club", capacity: 200, website: "https://songbyrddc.com" },
  { name: "Atlas Brew Works", city: "Washington, DC", state: "DC", region: "Washington, DC", venueType: "Restaurant/Bar", capacity: 300, website: "https://atlasbrewworks.com" },
  { name: "Rams Head Live", city: "Baltimore", state: "MD", region: "Baltimore, MD", venueType: "Theater", capacity: 1500, website: "https://ramsheadlive.com" },
  { name: "The 8x10", city: "Baltimore", state: "MD", region: "Baltimore, MD", venueType: "Club", capacity: 280, website: "https://the8x10.com" },
  { name: "Soundstage", city: "Baltimore", state: "MD", region: "Baltimore, MD", venueType: "Club", capacity: 600, website: "https://baltimoresoundstage.com" },
  { name: "MGM National Harbor Theater", city: "Oxon Hill", state: "MD", region: "Prince George's County, MD", venueType: "Theater", capacity: 3000, website: "https://mgmnationalharbor.com" },
  { name: "The Fillmore Silver Spring", city: "Silver Spring", state: "MD", region: "Montgomery County, MD", venueType: "Theater", capacity: 2000, website: "https://fillmoresilverspring.com" },
  { name: "Strathmore Music Center", city: "North Bethesda", state: "MD", region: "Montgomery County, MD", venueType: "Cultural Center", capacity: 1976, website: "https://strathmore.org" },
  { name: "Capital One Hall", city: "Tysons", state: "VA", region: "Northern Virginia", venueType: "Theater", capacity: 1600, website: "https://capitalonehall.com" },
  { name: "The State Theatre", city: "Falls Church", state: "VA", region: "Northern Virginia", venueType: "Theater", capacity: 850, website: "https://thestatetheatre.com" },
  { name: "Jammin Java", city: "Vienna", state: "VA", region: "Northern Virginia", venueType: "Club", capacity: 250, website: "https://jamminjava.com" },
  { name: "Pearl Street Warehouse", city: "Washington, DC", state: "DC", region: "Washington, DC", venueType: "Club", capacity: 250, website: "https://pearlstreetwarehouse.com" },
  { name: "Union Stage", city: "Washington, DC", state: "DC", region: "Washington, DC", venueType: "Club", capacity: 450, website: "https://unionstage.com" },
  { name: "Wolf Trap Filene Center", city: "Vienna", state: "VA", region: "Northern Virginia", venueType: "Theater", capacity: 7000, website: "https://wolftrap.org" },
];

interface VenueCandidate {
  name: string;
  city: string;
  state: string;
  region: string;
  venueType: string;
  capacity: number;
  website: string;
}

async function fetchExistingVenueNames(): Promise<string[]> {
  // Try to pull from /api/admin/venues. If DB isn't up yet, fall back to empty.
  try {
    const base = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "";
    const res = await fetch(`${base}/api/admin/venues`, {
      cache: "no-store",
      headers: { "x-cron": "venue-refresh" },
    });
    if (!res.ok) return [];
    const data = (await res.json()) as Array<{ name?: string }>;
    return data.map((v) => v.name ?? "").filter(Boolean);
  } catch {
    return [];
  }
}

async function generateCandidatesViaClaude(existingNames: string[]): Promise<VenueCandidate[]> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return CURATED_SEED;
  }

  const client = new Anthropic({ apiKey });
  const excludeList = existingNames.length > 0
    ? `\n\nWe already track these — DO NOT include them:\n${existingNames.slice(0, 100).join(", ")}`
    : "";

  const prompt = `You are a DMV (DC / Maryland / Virginia) live music venue researcher for HighLife Records, a booking agency. Generate 15 candidate venues in the DMV that book live music, club nights, comedy, or cultural performances. Mix venue types: clubs (200–800 cap), theaters (500–3000 cap), restaurants/bars with stage programming, college venues, and cultural centers.

Return STRICT JSON only — no markdown, no commentary. Schema:
{
  "venues": [
    {
      "name": "Venue Name",
      "city": "City",
      "state": "DC" | "MD" | "VA",
      "region": "Washington, DC" | "Baltimore, MD" | "Prince George's County, MD" | "Montgomery County, MD" | "Northern Virginia",
      "venueType": "Club" | "Theater" | "Lounge" | "Restaurant/Bar" | "Festival" | "Cultural Center" | "College" | "Church/Event Hall" | "Promoter" | "Private Event Buyer" | "Other",
      "capacity": 250,
      "website": "https://example.com"
    }
  ]
}

Only include real venues — no invented places. If you are unsure of a venue's website, omit the entry rather than guessing.${excludeList}`;

  try {
    const msg = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 2000,
      messages: [{ role: "user", content: prompt }],
    });
    const text = msg.content
      .filter((c): c is Anthropic.TextBlock => c.type === "text")
      .map((c) => c.text)
      .join("");

    // Extract first {...} JSON object
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return CURATED_SEED;
    const parsed = JSON.parse(match[0]) as { venues?: VenueCandidate[] };
    if (!parsed.venues || !Array.isArray(parsed.venues)) return CURATED_SEED;
    return parsed.venues;
  } catch {
    return CURATED_SEED;
  }
}

async function verifyWebsite(url: string): Promise<boolean> {
  if (!url || !url.startsWith("http")) return false;
  try {
    const ctrl = new AbortController();
    const timeoutId = setTimeout(() => ctrl.abort(), 4000);
    const res = await fetch(url, {
      method: "HEAD",
      redirect: "follow",
      signal: ctrl.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; HighLifeVenueRefresh/1.0; +https://highlife-live.vercel.app)",
      },
    });
    clearTimeout(timeoutId);
    return res.status < 400;
  } catch {
    return false;
  }
}

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request) {
  const url = new URL(request.url);
  const isCron =
    request.headers.get("user-agent")?.includes("vercel-cron") ||
    url.searchParams.get("cron") === "1";

  const existing = await fetchExistingVenueNames();
  const existingKeys = new Set(existing.map((n) => n.toLowerCase()));

  const candidates = await generateCandidatesViaClaude(existing);
  const fresh = candidates.filter((c) => c.name && !existingKeys.has(c.name.toLowerCase()));

  // HEAD-check each candidate's website in parallel; drop dead ones
  const verifications = await Promise.all(
    fresh.map(async (v) => ({ venue: v, alive: await verifyWebsite(v.website) }))
  );
  const verified = verifications.filter((r) => r.alive).map((r) => r.venue);
  const droppedDead = verifications.filter((r) => !r.alive).map((r) => r.venue.name);

  return NextResponse.json({
    source: "claude-haiku-dmv-research+head-verify",
    refreshedAt: new Date().toISOString(),
    triggeredBy: isCron ? "vercel-cron" : "manual",
    existingCount: existing.length,
    candidatesGenerated: candidates.length,
    dedupedCount: fresh.length,
    verifiedCount: verified.length,
    droppedDeadUrls: droppedDead,
    venues: verified.map((v) => ({
      ...v,
      source: "Public Research",
      sourceUrl: v.website,
      sourceDate: new Date().toISOString().slice(0, 10),
      reviewStatus: "Needs Review" as const,
    })),
    note: "Claude-generated DMV venue candidates, deduped against current master list, HEAD-verified for live websites. Plug in Bandsintown / Songkick / Pollstar source adapters here later — same pipeline.",
  });
}
