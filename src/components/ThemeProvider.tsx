"use client";

import { createContext, useContext, useEffect, useState } from "react";

type Theme = "dark" | "light";
type AnimationsState = "on" | "off";

interface ThemeContextValue {
  theme: Theme;
  setTheme: (t: Theme) => void;
  animationsEnabled: boolean;
  setAnimationsEnabled: (v: boolean) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "dark",
  setTheme: () => {},
  animationsEnabled: true,
  setAnimationsEnabled: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("dark");
  const [animationsEnabled, setAnimationsState] = useState<boolean>(true);

  // Read preferences from localStorage on mount (client-only)
  useEffect(() => {
    try {
      const storedTheme = localStorage.getItem("hll_theme") as Theme | null;
      const storedAnim = localStorage.getItem("hll_animations") as AnimationsState | null;

      const resolvedTheme: Theme =
        storedTheme === "light" ? "light" : "dark";
      const resolvedAnim: boolean =
        storedAnim === "off" ? false : true;

      setThemeState(resolvedTheme);
      setAnimationsState(resolvedAnim);

      // Apply to html element immediately
      document.documentElement.setAttribute("data-theme", resolvedTheme);
      if (!resolvedAnim) {
        document.documentElement.classList.add("no-animations");
      }
    } catch {
      // localStorage unavailable — stay on defaults
    }
  }, []);

  const setTheme = (t: Theme) => {
    setThemeState(t);
    try {
      localStorage.setItem("hll_theme", t);
    } catch {}
    document.documentElement.setAttribute("data-theme", t);
  };

  const setAnimationsEnabled = (v: boolean) => {
    setAnimationsState(v);
    try {
      localStorage.setItem("hll_animations", v ? "on" : "off");
    } catch {}
    if (v) {
      document.documentElement.classList.remove("no-animations");
    } else {
      document.documentElement.classList.add("no-animations");
    }
  };

  return (
    <ThemeContext.Provider
      value={{ theme, setTheme, animationsEnabled, setAnimationsEnabled }}
    >
      {children}
    </ThemeContext.Provider>
  );
}
