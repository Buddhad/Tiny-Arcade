// Theme + sound settings provider.
// Hydrates from local storage on mount; exposes setters that persist.

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

import { feedback } from "../utils/feedback";
import { storage } from "../utils/storage";
import {
  buildTheme,
  PALETTES,
  THEME_ORDER,
  type Theme,
  type ThemeId,
} from "../utils/themes";

type Ctx = {
  theme: Theme;
  themeId: ThemeId;
  setThemeId: (id: ThemeId) => void;
  cycleTheme: () => void;
  soundEnabled: boolean;
  setSoundEnabled: (v: boolean) => void;
  ready: boolean;
};

const THEME_KEY = "tinyarcade.theme";
const SOUND_KEY = "tinyarcade.sound";

const ThemeCtx = createContext<Ctx | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeId, setThemeIdState] = useState<ThemeId>("light");
  const [soundEnabled, setSoundEnabledState] = useState<boolean>(true);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      const storedTheme = await storage.getItem<string>(THEME_KEY, "light");
      const storedSound = await storage.getItem<boolean>(SOUND_KEY, true);
      const themeKey =
        storedTheme && storedTheme in PALETTES ? (storedTheme as ThemeId) : "light";
      setThemeIdState(themeKey);
      const sound = storedSound ?? true;
      setSoundEnabledState(sound);
      feedback.setSoundEnabled(sound);
      setReady(true);
    })();
  }, []);

  const setThemeId = useCallback((id: ThemeId) => {
    setThemeIdState(id);
    storage.setItem<string>(THEME_KEY, id);
  }, []);

  const cycleTheme = useCallback(() => {
    setThemeIdState((current) => {
      const idx = THEME_ORDER.indexOf(current);
      const next = THEME_ORDER[(idx + 1) % THEME_ORDER.length];
      storage.setItem<string>(THEME_KEY, next);
      return next;
    });
  }, []);

  const setSoundEnabled = useCallback((v: boolean) => {
    setSoundEnabledState(v);
    feedback.setSoundEnabled(v);
    storage.setItem<boolean>(SOUND_KEY, v);
  }, []);

  const theme = useMemo(() => buildTheme(themeId), [themeId]);

  const value = useMemo<Ctx>(
    () => ({ theme, themeId, setThemeId, cycleTheme, soundEnabled, setSoundEnabled, ready }),
    [theme, themeId, setThemeId, cycleTheme, soundEnabled, setSoundEnabled, ready],
  );

  return <ThemeCtx.Provider value={value}>{children}</ThemeCtx.Provider>;
}

export function useTheme(): Ctx {
  const ctx = useContext(ThemeCtx);
  if (!ctx) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return ctx;
}
