import {
  createContext,
  Dispatch,
  ReactNode,
  SetStateAction,
  useContext,
  useEffect,
  useLayoutEffect,
  useState,
} from "react";
import useLocalStorageState from "./useLocalStorageState";
import { formatOddsNumber } from "../../../Utils";

export type ThemePreference = "light" | "system" | "dark";
export type OddsFormat = "american" | "decimal" | "probability";

interface Preferences {
  themePreference: ThemePreference;
  setThemePreference: Dispatch<SetStateAction<ThemePreference>>;
  oddsFormat: OddsFormat;
  setOddsFormat: Dispatch<SetStateAction<OddsFormat>>;
}

const PreferencesContext = createContext<Preferences | null>(null);

export function displayOdds(value: number, format: OddsFormat): string {
  if (format === "american") return formatOddsNumber(value);
  const decimal = value > 0 ? 1 + value / 100 : 1 + 100 / Math.abs(value);
  return format === "decimal" ? decimal.toFixed(2) : `${(100 / decimal).toFixed(1)}%`;
}

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [themePreference, setThemePreference] = useLocalStorageState<ThemePreference>("style", "system", (value) =>
    ["light", "system", "dark"].includes(value) ? value : "system",
  );
  const [oddsFormat, setOddsFormat] = useLocalStorageState<OddsFormat>("oddsFormat", "american", (value) =>
    ["american", "decimal", "probability"].includes(value) ? value : "american",
  );
  const [systemDark, setSystemDark] = useState(() => window.matchMedia("(prefers-color-scheme: dark)").matches);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const update = () => setSystemDark(media.matches);
    media.addEventListener("change", update);
    update();
    return () => media.removeEventListener("change", update);
  }, []);

  useLayoutEffect(() => {
    const theme = themePreference === "system" ? (systemDark ? "dark" : "light") : themePreference;
    document.documentElement.dataset.theme = theme;
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute("content", theme === "dark" ? "#1d1f22" : "#ffffff");
  }, [themePreference, systemDark]);

  return (
    <PreferencesContext.Provider value={{ themePreference, setThemePreference, oddsFormat, setOddsFormat }}>
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences() {
  const context = useContext(PreferencesContext);
  if (!context) throw new Error("PreferencesProvider is missing");
  return context;
}
