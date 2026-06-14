export type EpkLink = {
  url: string;
  label: string;
};

export type EpkJobInput = {
  artistId: string;
  genres: string[];
  links: EpkLink[];
  themeVibe: string;
  features: string[];
};

function cleanText(value: unknown, maxLength: number): string {
  return String(value ?? "").trim().slice(0, maxLength);
}

function cleanList(value: unknown, maxItems: number, maxLength: number): string[] {
  const raw = Array.isArray(value)
    ? value
    : String(value ?? "").split(/\r?\n|,/);
  return raw
    .map((item) => cleanText(item, maxLength))
    .filter(Boolean)
    .slice(0, maxItems);
}

function parseLinks(value: unknown): EpkLink[] {
  const lines = Array.isArray(value)
    ? value.map(String)
    : String(value ?? "").split(/\r?\n/);
  const links: EpkLink[] = [];

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;
    const match = line.match(/^-?\s*(https?:\/\/\S+?)\s*\(([^)]+)\)\s*$/i);
    if (!match) {
      throw new Error(
        `Invalid link line: "${line.slice(0, 80)}". Use -https://link.com (What it is).`,
      );
    }
    const url = new URL(match[1]);
    if (!["http:", "https:"].includes(url.protocol)) {
      throw new Error("Artist links must use http or https.");
    }
    links.push({
      url: url.toString(),
      label: cleanText(match[2], 80),
    });
  }

  return links.slice(0, 30);
}

export function parseEpkJobInput(body: unknown): EpkJobInput {
  const source = (body && typeof body === "object" ? body : {}) as Record<
    string,
    unknown
  >;
  const artistId = cleanText(source.artistId, 100);
  const genres = cleanList(source.genres, 12, 80);
  const themeVibe = cleanText(source.themeVibe, 8000);
  const features = cleanList(source.features, 30, 240);
  const links = parseLinks(source.links);

  if (!artistId) throw new Error("Select an artist.");
  if (genres.length === 0) throw new Error("Add at least one genre or act.");
  if (themeVibe.length < 40) {
    throw new Error("Theme and vibe should be a generous description.");
  }

  return { artistId, genres, links, themeVibe, features };
}
