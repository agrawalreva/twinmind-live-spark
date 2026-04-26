import { createContext, useContext, useMemo, useState } from "react";
import {
  DEFAULT_SETTINGS,
  SETTINGS_STORAGE_KEY,
  type Settings,
} from "@/lib/settings";

type SettingsContextValue = {
  settings: Settings;
  setSettings: (next: Settings) => void;
  restoreDefaults: () => void;
};

const SettingsContext = createContext<SettingsContextValue | undefined>(undefined);

function loadInitialSettings(): Settings {
  if (typeof window === "undefined") {
    return DEFAULT_SETTINGS;
  }
  const raw = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
  if (!raw) {
    return DEFAULT_SETTINGS;
  }
  try {
    const parsed = JSON.parse(raw) as Partial<Settings>;
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettingsState] = useState<Settings>(loadInitialSettings);

  const setSettings = (next: Settings) => {
    setSettingsState(next);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(next));
    }
  };

  const restoreDefaults = () => setSettings(DEFAULT_SETTINGS);

  const value = useMemo(
    () => ({
      settings,
      setSettings,
      restoreDefaults,
    }),
    [settings],
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettings must be used within SettingsProvider");
  }
  return context;
}
