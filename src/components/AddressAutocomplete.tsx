"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin } from "lucide-react";

interface Suggestion {
  display_name: string;
  place_id: number;
}

interface Props {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  error?: string;
}

export function AddressAutocomplete({ value, onChange, placeholder, required, error }: Props) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const lastFetchedFor = useRef<string>("");

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const handleChange = (next: string) => {
    onChange(next);
    if (timer.current) clearTimeout(timer.current);
    if (next.trim().length < 3 || next === lastFetchedFor.current) {
      setSuggestions([]);
      return;
    }
    timer.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=6&countrycodes=us&q=${encodeURIComponent(next)}`,
          { headers: { "Accept-Language": "en" } }
        );
        if (!res.ok) throw new Error("lookup failed");
        const data: Suggestion[] = await res.json();
        lastFetchedFor.current = next;
        setSuggestions(data);
        setOpen(true);
      } catch {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 380);
  };

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <MapPin
          size={15}
          strokeWidth={1.5}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          placeholder={placeholder ?? "Start typing the venue address..."}
          required={required}
          autoComplete="off"
          className={`w-full bg-black/40 border ${
            error ? "border-rose-500/60" : "border-white/10"
          } rounded-xl pl-10 pr-4 py-3 text-sm text-foreground placeholder:text-zinc-500 focus:outline-none focus:border-pink-400/60 transition-colors`}
        />
        {loading && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] tracking-[0.18em] uppercase text-zinc-500">
            Searching
          </span>
        )}
      </div>
      {open && suggestions.length > 0 && (
        <ul className="absolute z-30 left-0 right-0 mt-2 max-h-64 overflow-auto rounded-xl border border-white/10 bg-[#0d0f14]/95 backdrop-blur-xl shadow-2xl">
          {suggestions.map((s) => (
            <li key={s.place_id}>
              <button
                type="button"
                onClick={() => {
                  onChange(s.display_name);
                  setOpen(false);
                }}
                className="w-full text-left px-4 py-2.5 text-sm text-zinc-300 hover:bg-white/5 hover:text-foreground transition-colors"
              >
                {s.display_name}
              </button>
            </li>
          ))}
        </ul>
      )}
      {error && (
        <p className="mt-1.5 text-[11px] tracking-wide text-rose-400">{error}</p>
      )}
    </div>
  );
}
