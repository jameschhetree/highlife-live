"use client";

import { useState, useEffect, useCallback, useSyncExternalStore } from "react";
import {
  listArtists,
  listVenues,
  listCampaigns,
  listOpportunities,
  listEpks,
  listResearch,
  listArtistsDB,
  listVenuesDB,
  listCampaignsDB,
  listOpportunitiesDB,
  listResearchDB,
  useDB,
  subscribe,
} from "@/lib/admin-store";
import type {
  AdminArtist,
  AdminVenue,
  AdminCampaign,
  AdminOpportunity,
  AdminEpk,
  ResearchContact,
} from "@/lib/admin-data";

// A version counter that increments on every store mutation.
// useSyncExternalStore uses this to know when to re-render.
let version = 0;
let listeners: Set<() => void> = new Set();

function notify() {
  version++;
  listeners.forEach((l) => l());
}

function subscribeToStore(onStoreChange: () => void): () => void {
  listeners.add(onStoreChange);

  // Also subscribe to the localStorage custom event from admin-store
  const unsub = subscribe(() => {
    notify();
  });

  return () => {
    listeners.delete(onStoreChange);
    unsub();
  };
}

function getVersion() {
  return version;
}

// Trigger a re-render from outside the hook (e.g., after a mutation call)
export function triggerStoreUpdate() {
  notify();
}

// ── DB-backed hooks (fetch from API, re-fetch on triggerStoreUpdate) ──

function useDBList<T>(fetcher: () => Promise<T[]>): T[] {
  const [data, setData] = useState<T[]>([]);
  const v = useSyncExternalStore(subscribeToStore, getVersion, () => 0);

  useEffect(() => {
    let cancelled = false;
    fetcher()
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch((err) => {
        console.error("DB fetch failed, data may be stale:", err);
      });
    return () => {
      cancelled = true;
    };
  }, [v]);

  return data;
}

// ── localStorage-backed hooks (original pattern) ────────────

function useLocalList<T>(reader: () => T[]): T[] {
  const [data, setData] = useState<T[]>([]);
  const v = useSyncExternalStore(subscribeToStore, getVersion, () => 0);

  useEffect(() => {
    setData(reader());
  }, [v]);

  return data;
}

// ── Exported hooks (auto-switch based on USE_DB flag) ───────

export function useArtists(): AdminArtist[] {
  const db = useDB();
  const dbData = useDBList<AdminArtist>(listArtistsDB);
  const localData = useLocalList<AdminArtist>(listArtists);
  return db ? dbData : localData;
}

export function useVenues(): AdminVenue[] {
  const db = useDB();
  const dbData = useDBList<AdminVenue>(listVenuesDB);
  const localData = useLocalList<AdminVenue>(listVenues);
  return db ? dbData : localData;
}

export function useCampaigns(): AdminCampaign[] {
  const db = useDB();
  const dbData = useDBList<AdminCampaign>(listCampaignsDB);
  const localData = useLocalList<AdminCampaign>(listCampaigns);
  return db ? dbData : localData;
}

export function useOpportunities(): AdminOpportunity[] {
  const db = useDB();
  const dbData = useDBList<AdminOpportunity>(listOpportunitiesDB);
  const localData = useLocalList<AdminOpportunity>(listOpportunities);
  return db ? dbData : localData;
}

export function useEpks(): AdminEpk[] {
  // EPKs stay on localStorage for now (no dedicated API route yet)
  const [data, setData] = useState<AdminEpk[]>([]);
  const v = useSyncExternalStore(subscribeToStore, getVersion, () => 0);

  useEffect(() => {
    setData(listEpks());
  }, [v]);

  return data;
}

export function useResearchQueue(): ResearchContact[] {
  const db = useDB();
  const dbData = useDBList<ResearchContact>(listResearchDB);
  const localData = useLocalList<ResearchContact>(listResearch);
  return db ? dbData : localData;
}
