// HighLife Live -- Hybrid Admin Store (localStorage + Postgres)
// When NEXT_PUBLIC_USE_DB=true: reads via API, writes via API (fire-and-forget with re-fetch)
// When NEXT_PUBLIC_USE_DB is falsy: stays on localStorage (original behavior)

import {
  demoArtists,
  demoVenues,
  demoCampaigns,
  demoOpportunities,
  demoEpks,
  demoResearchQueue,
  type AdminArtist,
  type AdminVenue,
  type AdminCampaign,
  type AdminOpportunity,
  type AdminEpk,
  type ResearchContact,
} from "./admin-data";

// ── Feature flag ────────────────────────────────────────────
// 2026-06-03 — Was env-gated via NEXT_PUBLIC_USE_DB. The Vercel demo env wasn't
// reliably setting it, which caused admin writes to silently land in localStorage
// while reads from /roster (public, DB-backed) showed nothing. Dok hit this trying
// to add an artist: his artist appeared in /admin/artists (localStorage) but not on
// /roster (DB). Hardcoded to true so the admin always reads/writes the DB.

export function useDB(): boolean {
  return true;
}

// ── API helpers (DB mode) ───────────────────────────────────

const API = "/api/admin";
const ADMIN_KEY = "highlife_admin";

function getAdminAccessHeaders(initHeaders?: HeadersInit): Headers {
  const headers = new Headers(initHeaders);
  headers.set("Content-Type", "application/json");

  if (typeof window === "undefined") return headers;

  try {
    const raw = sessionStorage.getItem(ADMIN_KEY);
    const session = raw ? (JSON.parse(raw) as { email?: string }) : null;
    if (session?.email) headers.set("x-admin-email", session.email);
  } catch {
    // Keep the request usable if a stale demo session is malformed.
  }

  return headers;
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: getAdminAccessHeaders(init?.headers),
  });
  if (!res.ok) {
    throw new Error(`API ${init?.method ?? "GET"} ${path} failed: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

// DB-backed list functions (async)
export async function listArtistsDB(): Promise<AdminArtist[]> {
  return apiFetch<AdminArtist[]>("/artists");
}

export async function listVenuesDB(): Promise<AdminVenue[]> {
  return apiFetch<AdminVenue[]>("/venues");
}

export async function listCampaignsDB(): Promise<AdminCampaign[]> {
  return apiFetch<AdminCampaign[]>("/campaigns");
}

export async function listOpportunitiesDB(): Promise<AdminOpportunity[]> {
  return apiFetch<AdminOpportunity[]>("/opportunities");
}

export async function listEpksDB(): Promise<AdminEpk[]> {
  // EPKs don't have a dedicated list endpoint yet; reuse opportunities pattern
  // For now, EPKs are still localStorage until API is added
  return apiFetch<AdminEpk[]>("/epks").catch(() => []);
}

export async function listResearchDB(): Promise<ResearchContact[]> {
  return apiFetch<ResearchContact[]>("/research");
}

// DB-backed mutations (async, fire-and-forget from sync wrappers)
export async function createArtistDB(data: Partial<AdminArtist>): Promise<AdminArtist> {
  return apiFetch<AdminArtist>("/artists", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateArtistDB(id: string, patch: Partial<AdminArtist>): Promise<AdminArtist> {
  return apiFetch<AdminArtist>(`/artists/${id}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}

export async function deleteArtistDB(id: string): Promise<void> {
  await apiFetch(`/artists/${id}`, { method: "DELETE" });
}

export async function createVenueDB(data: Partial<AdminVenue>): Promise<AdminVenue> {
  return apiFetch<AdminVenue>("/venues", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateVenueDB(id: string, patch: Partial<AdminVenue>): Promise<AdminVenue> {
  return apiFetch<AdminVenue>(`/venues/${id}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}

export async function deleteVenueDB(id: string): Promise<void> {
  await apiFetch(`/venues/${id}`, { method: "DELETE" });
}

export async function createCampaignDB(data: Partial<AdminCampaign>): Promise<AdminCampaign> {
  return apiFetch<AdminCampaign>("/campaigns", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateCampaignDB(id: string, patch: Partial<AdminCampaign>): Promise<AdminCampaign> {
  return apiFetch<AdminCampaign>(`/campaigns/${id}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}

export async function deleteCampaignDB(id: string): Promise<void> {
  await apiFetch(`/campaigns/${id}`, { method: "DELETE" });
}

export async function createOpportunityDB(data: Partial<AdminOpportunity>): Promise<AdminOpportunity> {
  return apiFetch<AdminOpportunity>("/opportunities", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateOpportunityDB(id: string, patch: Partial<AdminOpportunity>): Promise<AdminOpportunity> {
  return apiFetch<AdminOpportunity>(`/opportunities/${id}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}

export async function deleteOpportunityDB(id: string): Promise<void> {
  await apiFetch(`/opportunities/${id}`, { method: "DELETE" });
}

export async function updateResearchContactDB(id: string, patch: Partial<ResearchContact>): Promise<ResearchContact> {
  return apiFetch<ResearchContact>(`/research/${id}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}

export async function deleteResearchContactDB(id: string): Promise<void> {
  await apiFetch(`/research/${id}`, { method: "DELETE" });
}

// ── Storage keys (localStorage fallback) ────────────────────

const KEYS = {
  artists: "hl-admin-artists",
  venues: "hl-admin-venues",
  campaigns: "hl-admin-campaigns",
  opportunities: "hl-admin-opportunities",
  epks: "hl-admin-epks",
  research: "hl-admin-research",
  initialized: "hl-admin-initialized",
} as const;

const STORE_EVENT = "highlife-admin-store";

// ── LocalStorage helpers ────────────────────────────────────

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function read<T>(key: string): T | null {
  if (!isBrowser()) return null;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function write<T>(key: string, data: T): void {
  if (!isBrowser()) return;
  localStorage.setItem(key, JSON.stringify(data));
  window.dispatchEvent(new CustomEvent(STORE_EVENT, { detail: { key } }));
}

// 2026-06-03 — Dok directive: no fake data. localStorage seed disabled entirely.
// Previously this hydrated Riko Lux / Foolery / etc. on every fresh visit.
// Now a no-op + one-shot cleanup that wipes the seeded keys if they exist
// (so users who visited before this change get a clean slate too).
function ensureSeeded(): void {
  if (!isBrowser()) return;
  if (localStorage.getItem(KEYS.initialized)) {
    Object.values(KEYS).forEach((k) => localStorage.removeItem(k));
  }
}

function generateId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

// ── Artists (localStorage) ──────────────────────────────────

export function listArtists(): AdminArtist[] {
  ensureSeeded();
  return read<AdminArtist[]>(KEYS.artists) ?? [];
}

export function getArtist(id: string): AdminArtist | undefined {
  return listArtists().find((a) => a.id === id);
}

export function createArtist(data: Omit<AdminArtist, "id" | "isDemo">): AdminArtist {
  if (useDB()) {
    createArtistDB(data as Partial<AdminArtist>).catch(console.error);
    return { ...data, id: "pending", isDemo: true } as AdminArtist;
  }
  const artists = listArtists();
  const artist: AdminArtist = { ...data, id: generateId("art"), isDemo: true } as AdminArtist;
  artists.push(artist);
  write(KEYS.artists, artists);
  return artist;
}

export function updateArtist(id: string, patch: Partial<AdminArtist>): AdminArtist | null {
  if (useDB()) {
    updateArtistDB(id, patch).catch(console.error);
    return { ...patch, id } as AdminArtist;
  }
  const artists = listArtists();
  const idx = artists.findIndex((a) => a.id === id);
  if (idx === -1) return null;
  artists[idx] = { ...artists[idx], ...patch, id };
  write(KEYS.artists, artists);
  return artists[idx];
}

export function deleteArtist(id: string): boolean {
  if (useDB()) {
    deleteArtistDB(id).catch(console.error);
    return true;
  }
  const artists = listArtists();
  const filtered = artists.filter((a) => a.id !== id);
  if (filtered.length === artists.length) return false;
  write(KEYS.artists, filtered);
  return true;
}

// ── Venues (localStorage) ──────────────────────────────────

export function listVenues(): AdminVenue[] {
  ensureSeeded();
  return read<AdminVenue[]>(KEYS.venues) ?? [];
}

export function getVenue(id: string): AdminVenue | undefined {
  return listVenues().find((v) => v.id === id);
}

export function createVenue(data: Omit<AdminVenue, "id" | "isDemo">): AdminVenue {
  if (useDB()) {
    createVenueDB(data as Partial<AdminVenue>).catch(console.error);
    return { ...data, id: "pending", isDemo: true } as AdminVenue;
  }
  const venues = listVenues();
  const venue: AdminVenue = { ...data, id: generateId("ven"), isDemo: true } as AdminVenue;
  venues.push(venue);
  write(KEYS.venues, venues);
  return venue;
}

export function updateVenue(id: string, patch: Partial<AdminVenue>): AdminVenue | null {
  if (useDB()) {
    updateVenueDB(id, patch).catch(console.error);
    return { ...patch, id } as AdminVenue;
  }
  const venues = listVenues();
  const idx = venues.findIndex((v) => v.id === id);
  if (idx === -1) return null;
  venues[idx] = { ...venues[idx], ...patch, id };
  write(KEYS.venues, venues);
  return venues[idx];
}

export function deleteVenue(id: string): boolean {
  if (useDB()) {
    deleteVenueDB(id).catch(console.error);
    return true;
  }
  const venues = listVenues();
  const filtered = venues.filter((v) => v.id !== id);
  if (filtered.length === venues.length) return false;
  write(KEYS.venues, filtered);
  return true;
}

export function addVenues(newVenues: Omit<AdminVenue, "id" | "isDemo">[]): AdminVenue[] {
  if (useDB()) {
    // In DB mode, create each venue via API
    const added: AdminVenue[] = [];
    for (const v of newVenues) {
      createVenueDB(v as Partial<AdminVenue>).catch(console.error);
      added.push({ ...v, id: "pending", isDemo: true } as AdminVenue);
    }
    return added;
  }
  const existing = listVenues();
  const added: AdminVenue[] = [];
  for (const v of newVenues) {
    const isDupe = existing.some(
      (e) =>
        e.name.toLowerCase() === v.name.toLowerCase() &&
        e.city.toLowerCase() === v.city.toLowerCase()
    );
    if (isDupe) continue;
    const venue: AdminVenue = { ...v, id: generateId("ven"), isDemo: true } as AdminVenue;
    existing.push(venue);
    added.push(venue);
  }
  write(KEYS.venues, existing);
  return added;
}

// ── Campaigns (localStorage) ───────────────────────────────

export function listCampaigns(): AdminCampaign[] {
  ensureSeeded();
  return read<AdminCampaign[]>(KEYS.campaigns) ?? [];
}

export function getCampaign(id: string): AdminCampaign | undefined {
  return listCampaigns().find((c) => c.id === id);
}

export function createCampaign(data: Omit<AdminCampaign, "id" | "isDemo">): AdminCampaign {
  if (useDB()) {
    createCampaignDB(data as Partial<AdminCampaign>).catch(console.error);
    return { ...data, id: "pending", isDemo: true } as AdminCampaign;
  }
  const campaigns = listCampaigns();
  const campaign: AdminCampaign = { ...data, id: `C-${Date.now().toString(36)}`, isDemo: true } as AdminCampaign;
  campaigns.push(campaign);
  write(KEYS.campaigns, campaigns);
  return campaign;
}

export function updateCampaign(id: string, patch: Partial<AdminCampaign>): AdminCampaign | null {
  if (useDB()) {
    updateCampaignDB(id, patch).catch(console.error);
    return { ...patch, id } as AdminCampaign;
  }
  const campaigns = listCampaigns();
  const idx = campaigns.findIndex((c) => c.id === id);
  if (idx === -1) return null;
  campaigns[idx] = { ...campaigns[idx], ...patch, id };
  write(KEYS.campaigns, campaigns);
  return campaigns[idx];
}

export function deleteCampaign(id: string): boolean {
  if (useDB()) {
    deleteCampaignDB(id).catch(console.error);
    return true;
  }
  const campaigns = listCampaigns();
  const filtered = campaigns.filter((c) => c.id !== id);
  if (filtered.length === campaigns.length) return false;
  write(KEYS.campaigns, filtered);
  return true;
}

// ── Opportunities (localStorage) ───────────────────────────

export function listOpportunities(): AdminOpportunity[] {
  ensureSeeded();
  return read<AdminOpportunity[]>(KEYS.opportunities) ?? [];
}

export function getOpportunity(id: string): AdminOpportunity | undefined {
  return listOpportunities().find((o) => o.id === id);
}

export function createOpportunity(data: Omit<AdminOpportunity, "id" | "isDemo">): AdminOpportunity {
  if (useDB()) {
    createOpportunityDB(data as Partial<AdminOpportunity>).catch(console.error);
    return { ...data, id: "pending", isDemo: true } as AdminOpportunity;
  }
  const opps = listOpportunities();
  const opp: AdminOpportunity = { ...data, id: generateId("opp"), isDemo: true } as AdminOpportunity;
  opps.push(opp);
  write(KEYS.opportunities, opps);
  return opp;
}

export function updateOpportunity(id: string, patch: Partial<AdminOpportunity>): AdminOpportunity | null {
  if (useDB()) {
    updateOpportunityDB(id, patch).catch(console.error);
    return { ...patch, id } as AdminOpportunity;
  }
  const opps = listOpportunities();
  const idx = opps.findIndex((o) => o.id === id);
  if (idx === -1) return null;
  opps[idx] = { ...opps[idx], ...patch, id };
  write(KEYS.opportunities, opps);
  return opps[idx];
}

export function deleteOpportunity(id: string): boolean {
  if (useDB()) {
    deleteOpportunityDB(id).catch(console.error);
    return true;
  }
  const opps = listOpportunities();
  const filtered = opps.filter((o) => o.id !== id);
  if (filtered.length === opps.length) return false;
  write(KEYS.opportunities, filtered);
  return true;
}

// ── EPKs (localStorage) ────────────────────────────────────

export function listEpks(): AdminEpk[] {
  ensureSeeded();
  return read<AdminEpk[]>(KEYS.epks) ?? [];
}

export function getEpk(id: string): AdminEpk | undefined {
  return listEpks().find((e) => e.id === id);
}

export function createEpk(data: Omit<AdminEpk, "id" | "isDemo">): AdminEpk {
  const epks = listEpks();
  const epk: AdminEpk = { ...data, id: generateId("epk"), isDemo: true } as AdminEpk;
  epks.push(epk);
  write(KEYS.epks, epks);
  return epk;
}

export function updateEpk(id: string, patch: Partial<AdminEpk>): AdminEpk | null {
  const epks = listEpks();
  const idx = epks.findIndex((e) => e.id === id);
  if (idx === -1) return null;
  epks[idx] = { ...epks[idx], ...patch, id };
  write(KEYS.epks, epks);
  return epks[idx];
}

export function deleteEpk(id: string): boolean {
  const epks = listEpks();
  const filtered = epks.filter((e) => e.id !== id);
  if (filtered.length === epks.length) return false;
  write(KEYS.epks, filtered);
  return true;
}

// ── Research Queue (localStorage) ──────────────────────────

export function listResearch(): ResearchContact[] {
  ensureSeeded();
  return read<ResearchContact[]>(KEYS.research) ?? [];
}

export function getResearchContact(id: string): ResearchContact | undefined {
  return listResearch().find((r) => r.id === id);
}

export function createResearchContact(data: Omit<ResearchContact, "id" | "isDemo">): ResearchContact {
  const contacts = listResearch();
  const contact: ResearchContact = { ...data, id: generateId("rq"), isDemo: true } as ResearchContact;
  contacts.push(contact);
  write(KEYS.research, contacts);
  return contact;
}

export function updateResearchContact(id: string, patch: Partial<ResearchContact>): ResearchContact | null {
  if (useDB()) {
    updateResearchContactDB(id, patch).catch(console.error);
    return { ...patch, id } as ResearchContact;
  }
  const contacts = listResearch();
  const idx = contacts.findIndex((r) => r.id === id);
  if (idx === -1) return null;
  contacts[idx] = { ...contacts[idx], ...patch, id };
  write(KEYS.research, contacts);
  return contacts[idx];
}

export function deleteResearchContact(id: string): boolean {
  if (useDB()) {
    deleteResearchContactDB(id).catch(console.error);
    return true;
  }
  const contacts = listResearch();
  const filtered = contacts.filter((r) => r.id !== id);
  if (filtered.length === contacts.length) return false;
  write(KEYS.research, filtered);
  return true;
}

// ── Global operations ───────────────────────────────────────

export function clearAllData(): void {
  if (!isBrowser()) return;
  Object.values(KEYS).forEach((k) => localStorage.removeItem(k));
  window.dispatchEvent(new CustomEvent(STORE_EVENT, { detail: { key: "all" } }));
}

export function resetDemoData(): void {
  clearAllData();
  ensureSeeded();
}

// ── Subscribe helper ────────────────────────────────────────

export function subscribe(callback: () => void): () => void {
  if (!isBrowser()) return () => {};
  const handler = () => callback();
  window.addEventListener(STORE_EVENT, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(STORE_EVENT, handler);
    window.removeEventListener("storage", handler);
  };
}
