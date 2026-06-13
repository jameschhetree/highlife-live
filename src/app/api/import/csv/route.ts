import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";

const anthropic = new Anthropic();

// Simple CSV parser -- handles quoted fields and commas inside quotes
function parseCSV(text: string): Record<string, string>[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];

  function parseLine(line: string): string[] {
    const fields: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === "," && !inQuotes) {
        fields.push(current.trim());
        current = "";
      } else {
        current += ch;
      }
    }
    fields.push(current.trim());
    return fields;
  }

  const headers = parseLine(lines[0]);
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseLine(lines[i]);
    if (values.length === 0 || (values.length === 1 && !values[0])) continue;
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = values[idx] ?? "";
    });
    rows.push(row);
  }

  return rows;
}

const VENUE_SCHEMA = `{
  "name": "string (venue name)",
  "contactPerson": "string (main contact full name, or empty)",
  "contactTitle": "string (their job title, or empty)",
  "email": "string (main email)",
  "phone": "string (phone number)",
  "website": "string (website url without https://)",
  "instagram": "string (@handle)",
  "address": "string (street address)",
  "city": "string",
  "state": "string (2-letter code)",
  "region": "string (one of: Washington, DC | Baltimore, MD | Prince George's County, MD | Montgomery County, MD | Northern Virginia | Other)",
  "venueType": "string (one of: Club | Lounge | Festival | Theater | College | Restaurant/Bar | Private Event Buyer | Promoter | Cultural Center | Church/Event Hall | Other)",
  "capacity": "number (0 if unknown)",
  "typicalGenres": ["string array"],
  "bookingEmail": "string (booking-specific email, or same as email)",
  "talentBuyerEmail": "string (talent buyer email, or same as email)",
  "notes": "string (any extra info from the CSV row)"
}`;

const ARTIST_SCHEMA = `{
  "name": "string (artist/act name)",
  "legalName": "string (legal name if available, or empty)",
  "email": "string",
  "phone": "string",
  "managerContact": "string",
  "primaryGenre": "string",
  "secondaryGenres": ["string array"],
  "performanceType": "string (one of: Solo Artist | Band | DJ | Rapper | Singer | Opera Vocalist | RnB Vocalist | Dembow/Latin Club Act | Producer/DJ Hybrid | Other)",
  "typicalSetLength": "string",
  "bookingFeeRange": "string",
  "bio": "string (short bio from available data)",
  "shortPitch": "string (one-sentence pitch)",
  "notes": "string (any extra info)"
}`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { csv, type } = body as { csv: string; type: "venues" | "artists" };

    if (!csv || !type) {
      return Response.json(
        { error: "Missing csv or type field" },
        { status: 400 }
      );
    }

    const rows = parseCSV(csv);
    if (rows.length === 0) {
      return Response.json(
        { error: "No data rows found in CSV" },
        { status: 400 }
      );
    }

    // Cap at 50 rows per import to control costs
    const batch = rows.slice(0, 50);
    const schema = type === "venues" ? VENUE_SCHEMA : ARTIST_SCHEMA;

    const prompt = `You are a data normalization assistant. I have ${batch.length} rows from a CSV file that need to be normalized into a structured JSON format.

Each row from the CSV is a ${type === "venues" ? "venue/location" : "artist/performer"} record. The raw CSV columns and values may have inconsistent naming, abbreviations, missing fields, or messy formatting.

Your job: For each row, output a JSON object matching this exact schema:
${schema}

Important rules:
- If a field cannot be determined from the data, use an empty string "" or 0 for numbers or [] for arrays
- Normalize phone numbers to (xxx) xxx-xxxx format when possible
- Clean up capitalization (title case for names, etc.)
- For region, infer from city/state if possible, defaulting to "Other" if not a DMV area
- Return a JSON array of objects, one per input row
- Return ONLY the JSON array, no markdown, no explanation

Here are the CSV rows as JSON objects:
${JSON.stringify(batch, null, 2)}`;

    const msg = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 4096,
      messages: [{ role: "user", content: prompt }],
    });

    const textBlock = msg.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return Response.json(
        { error: "No text response from AI" },
        { status: 500 }
      );
    }

    // Extract JSON from response (handle potential markdown wrapping)
    let jsonStr = textBlock.text.trim();
    if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }

    const parsed = JSON.parse(jsonStr);

    // Add import metadata to each row
    const enriched = (Array.isArray(parsed) ? parsed : [parsed]).map(
      (row: Record<string, unknown>) => ({
        ...row,
        source: "CSV Import",
        sourceUrl: "",
        sourceDate: new Date().toISOString().slice(0, 10),
        contactConfidence: 3,
        reviewStatus: "Needs Review",
        tags: ["csv-import"],
        lastContacted: null,
        nextFollowUp: null,
        relationshipStatus: "Cold",
      })
    );

    return Response.json({
      parsed: enriched,
      rawRowCount: rows.length,
      processedCount: batch.length,
    });
  } catch (err) {
    console.error("CSV import error:", err);
    return Response.json(
      { error: err instanceof Error ? err.message : "Import failed" },
      { status: 500 }
    );
  }
}
