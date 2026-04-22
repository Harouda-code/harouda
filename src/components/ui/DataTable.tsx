import { useMemo, useState, type ReactNode } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, Search } from "lucide-react";
import { SkeletonTable } from "./Skeleton";
import "./DataTable.css";

export type Column<T> = {
  key: string;
  header: string;
  /** Zugriff auf den Rohwert (für Sortierung und Default-Render). */
  accessor: (row: T) => string | number | null | undefined;
  /** Optionaler eigener Zell-Renderer für Formatierung / Icons. */
  render?: (row: T) => ReactNode;
  /** Ist diese Spalte sortierbar? Default: true. */
  sortable?: boolean;
  /** „num" rechtsbündig, „default" linksbündig. */
  align?: "default" | "num";
  /** Optionale Breiten-Hint in Pixeln. */
  width?: number;
};

type Props<T> = {
  columns: Column<T>[];
  data: T[];
  rowKey: (row: T) => string;
  loading?: boolean;
  /** Sucht global über alle Spalten-Accessor-Werte (case-insensitive). */
  searchable?: boolean;
  searchPlaceholder?: string;
  emptyMessage?: string;
  /** Optionaler Zeilen-Klick-Handler. Hervorhebung via CSS `tr:hover`. */
  onRowClick?: (row: T) => void;
  /** Optionale Zeilen-Klasse, z. B. für "is-editing" / "is-overdue". */
  rowClassName?: (row: T) => string | undefined;
};

type SortState = { key: string; dir: "asc" | "desc" } | null;

/**
 * Tabelle mit globaler Suche + pro-Spalte sortierbar. Bewusst schlank
 * gehalten: keine Pagination, keine Multi-Sort, keine Spalten-Reorder.
 * Für größere Datenmengen via virtualisiertem Renderer ergänzen.
 */
export function DataTable<T>({
  columns,
  data,
  rowKey,
  loading = false,
  searchable = true,
  searchPlaceholder = "Suche …",
  emptyMessage = "Keine Einträge.",
  onRowClick,
  rowClassName,
}: Props<T>) {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortState>(null);

  const filtered = useMemo(() => {
    if (!searchable || !search.trim()) return data;
    const q = search.trim().toLowerCase();
    return data.filter((row) =>
      columns.some((c) => {
        const v = c.accessor(row);
        if (v == null) return false;
        return String(v).toLowerCase().includes(q);
      })
    );
  }, [data, columns, search, searchable]);

  const sorted = useMemo(() => {
    if (!sort) return filtered;
    const col = columns.find((c) => c.key === sort.key);
    if (!col) return filtered;
    const copy = [...filtered];
    copy.sort((a, b) => {
      const av = col.accessor(a);
      const bv = col.accessor(b);
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      if (typeof av === "number" && typeof bv === "number") {
        return sort.dir === "asc" ? av - bv : bv - av;
      }
      const ac = String(av);
      const bc = String(bv);
      return sort.dir === "asc" ? ac.localeCompare(bc) : bc.localeCompare(ac);
    });
    return copy;
  }, [filtered, sort, columns]);

  function toggleSort(key: string, sortable?: boolean) {
    if (sortable === false) return;
    setSort((prev) => {
      if (!prev || prev.key !== key) return { key, dir: "asc" };
      if (prev.dir === "asc") return { key, dir: "desc" };
      return null; // dritte Stufe: keine Sortierung
    });
  }

  return (
    <div className="dt">
      {searchable && (
        <div className="dt__toolbar">
          <label className="dt__search">
            <Search size={16} />
            <input
              type="search"
              placeholder={searchPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
          <div className="dt__count">
            <strong>{sorted.length}</strong>
            {search.trim() ? (
              <>
                {" "}von {data.length}
              </>
            ) : null}
            {" Einträge"}
          </div>
        </div>
      )}

      {loading ? (
        <SkeletonTable rows={6} columns={columns.length} />
      ) : sorted.length === 0 ? (
        <p className="dt__empty">{emptyMessage}</p>
      ) : (
        <div className="dt__scroll">
          <table className="dt__table">
            <thead>
              <tr>
                {columns.map((c) => {
                  const isSorted = sort?.key === c.key;
                  return (
                    <th
                      key={c.key}
                      className={`dt__th${c.align === "num" ? " is-num" : ""}${
                        c.sortable === false ? "" : " is-sortable"
                      }`}
                      style={c.width ? { width: c.width } : undefined}
                      onClick={() => toggleSort(c.key, c.sortable)}
                    >
                      <span className="dt__th-label">{c.header}</span>
                      {c.sortable !== false && (
                        <span className="dt__sort-icon" aria-hidden="true">
                          {!isSorted ? (
                            <ArrowUpDown size={12} />
                          ) : sort?.dir === "asc" ? (
                            <ArrowUp size={12} />
                          ) : (
                            <ArrowDown size={12} />
                          )}
                        </span>
                      )}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {sorted.map((row) => {
                const rc = rowClassName?.(row);
                return (
                  <tr
                    key={rowKey(row)}
                    className={rc}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                    style={onRowClick ? { cursor: "pointer" } : undefined}
                  >
                    {columns.map((c) => (
                      <td
                        key={c.key}
                        className={c.align === "num" ? "is-num" : undefined}
                      >
                        {c.render ? c.render(row) : (c.accessor(row) ?? "—")}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
