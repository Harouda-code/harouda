import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

const STORAGE_KEY = "harouda:selectedYear";

function defaultYear(): number {
  return new Date().getFullYear();
}

type YearContextValue = {
  selectedYear: number;
  setSelectedYear: (y: number) => void;
  /** Range of years offered in the selector. */
  availableYears: number[];
  /** Returns true if the ISO date (YYYY-MM-DD or longer) falls in selectedYear. */
  inYear: (iso: string | null | undefined) => boolean;
  /** Jan 1 and Dec 31 ISO strings for the selected year. */
  yearStart: string;
  yearEnd: string;
};

const YearContext = createContext<YearContextValue | undefined>(undefined);

export function YearProvider({ children }: { children: ReactNode }) {
  const [selectedYear, setSelectedYearState] = useState<number>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const n = raw ? Number(raw) : NaN;
      return Number.isFinite(n) && n >= 2000 && n <= 2100 ? n : defaultYear();
    } catch {
      return defaultYear();
    }
  });

  const setSelectedYear = useCallback((y: number) => {
    setSelectedYearState(y);
    try {
      localStorage.setItem(STORAGE_KEY, String(y));
    } catch {
      /* storage full or blocked — ignore */
    }
  }, []);

  const value = useMemo<YearContextValue>(() => {
    const now = new Date().getFullYear();
    // A pragmatic range — extend to cover old archives and one future year
    // for forward planning. Adjust bounds here if needed.
    const minYear = Math.min(2020, now - 5, selectedYear);
    const maxYear = Math.max(now + 1, selectedYear);
    const availableYears: number[] = [];
    for (let y = maxYear; y >= minYear; y--) availableYears.push(y);

    const yearStart = `${selectedYear}-01-01`;
    const yearEnd = `${selectedYear}-12-31`;
    const prefix = String(selectedYear);

    return {
      selectedYear,
      setSelectedYear,
      availableYears,
      yearStart,
      yearEnd,
      inYear: (iso) => {
        if (!iso) return false;
        return iso.slice(0, 4) === prefix;
      },
    };
  }, [selectedYear, setSelectedYear]);

  return <YearContext.Provider value={value}>{children}</YearContext.Provider>;
}

export function useYear(): YearContextValue {
  const ctx = useContext(YearContext);
  if (!ctx) throw new Error("useYear must be used within YearProvider");
  return ctx;
}
