import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { Check, ChevronDown, Plus, X } from "lucide-react";
import "./EditableCombobox.css";

export type ComboboxOption = {
  /** Stabiler Schlüssel (z. B. DB-ID). */
  id: string;
  /** Anzeigename. */
  label: string;
  /** Sekundärer Text rechts (z. B. zuletzt genutzt am …). */
  hint?: string;
};

export type EditableComboboxProps = {
  value: string;
  options: ComboboxOption[];
  onChange: (value: string) => void;
  /** Wird aufgerufen, wenn ein bestehender Eintrag gewählt wurde. */
  onSelectOption?: (option: ComboboxOption) => void;
  /** Wird aufgerufen, wenn der Nutzer „Neu anlegen" bestätigt. */
  onCreate?: (newValue: string) => void;
  placeholder?: string;
  /** Max. Vorschläge in der Dropdown-Liste. Default 8. */
  limit?: number;
  /** ID für aria-labelledby o. ä. */
  id?: string;
  disabled?: boolean;
  /** Tokenize und score. */
  scoreFn?: (query: string, option: ComboboxOption) => number;
};

function defaultScore(query: string, option: ComboboxOption): number {
  const q = query.trim().toLowerCase();
  if (!q) return 0.1; // zeigt alle Optionen im geöffneten Zustand
  const label = option.label.toLowerCase();
  if (label === q) return 1;
  if (label.startsWith(q)) return 0.9;
  if (label.includes(q)) return 0.7;
  const tokens = q.split(/\s+/).filter((t) => t.length >= 2);
  if (tokens.length > 0 && tokens.every((t) => label.includes(t))) return 0.5;
  return 0;
}

export function EditableCombobox({
  value,
  options,
  onChange,
  onSelectOption,
  onCreate,
  placeholder,
  limit = 8,
  id,
  disabled,
  scoreFn,
}: EditableComboboxProps) {
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const generatedId = useId();
  const listId = `${id ?? generatedId}-list`;

  const score = scoreFn ?? defaultScore;

  const suggestions = useMemo(() => {
    return options
      .map((o) => ({ opt: o, s: score(value, o) }))
      .filter((x) => x.s > 0)
      .sort((a, b) => b.s - a.s)
      .slice(0, limit)
      .map((x) => x.opt);
  }, [options, value, limit, score]);

  // Exakter Treffer?
  const exactMatch = useMemo(() => {
    const q = value.trim().toLowerCase();
    if (!q) return null;
    return options.find((o) => o.label.toLowerCase() === q) ?? null;
  }, [options, value]);

  const canCreate =
    !!onCreate && value.trim().length > 0 && !exactMatch;

  // Close on click outside
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setActiveIdx(-1);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  function handleKey(e: KeyboardEvent<HTMLInputElement>) {
    if (disabled) return;
    const maxIdx = suggestions.length + (canCreate ? 1 : 0) - 1;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActiveIdx((i) => Math.min(i + 1, maxIdx));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, -1));
    } else if (e.key === "Enter") {
      if (!open) return;
      if (activeIdx >= 0 && activeIdx < suggestions.length) {
        e.preventDefault();
        const opt = suggestions[activeIdx];
        onChange(opt.label);
        onSelectOption?.(opt);
        setOpen(false);
        setActiveIdx(-1);
      } else if (canCreate && activeIdx === suggestions.length) {
        e.preventDefault();
        onCreate!(value.trim());
        setOpen(false);
        setActiveIdx(-1);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
      setActiveIdx(-1);
    }
  }

  return (
    <div className="ecombo" ref={containerRef}>
      <div className="ecombo__input-row">
        <input
          ref={inputRef}
          id={id}
          type="text"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            if (!open) setOpen(true);
            setActiveIdx(-1);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKey}
          placeholder={placeholder}
          disabled={disabled}
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          autoComplete="off"
        />
        {value && !disabled && (
          <button
            type="button"
            className="ecombo__clear"
            onClick={() => {
              onChange("");
              inputRef.current?.focus();
            }}
            aria-label="Eingabe löschen"
            tabIndex={-1}
          >
            <X size={12} />
          </button>
        )}
        <button
          type="button"
          className="ecombo__toggle"
          onClick={() => {
            setOpen((o) => !o);
            inputRef.current?.focus();
          }}
          disabled={disabled}
          aria-label={open ? "Vorschläge schließen" : "Vorschläge öffnen"}
          tabIndex={-1}
        >
          <ChevronDown
            size={14}
            style={{
              transform: open ? "rotate(180deg)" : "none",
              transition: "transform 120ms ease",
            }}
          />
        </button>
      </div>

      {open && (suggestions.length > 0 || canCreate) && (
        <ul
          id={listId}
          className="ecombo__list"
          role="listbox"
        >
          {suggestions.map((opt, i) => (
            <li
              key={opt.id}
              role="option"
              aria-selected={i === activeIdx}
              className={`ecombo__option ${i === activeIdx ? "is-active" : ""}`}
              onMouseDown={(e) => {
                e.preventDefault();
                onChange(opt.label);
                onSelectOption?.(opt);
                setOpen(false);
                setActiveIdx(-1);
              }}
              onMouseEnter={() => setActiveIdx(i)}
            >
              <span className="ecombo__option-label">{opt.label}</span>
              {opt.hint && (
                <span className="ecombo__option-hint">{opt.hint}</span>
              )}
              {exactMatch?.id === opt.id && (
                <Check size={12} className="ecombo__check" />
              )}
            </li>
          ))}
          {canCreate && (
            <li
              role="option"
              aria-selected={activeIdx === suggestions.length}
              className={`ecombo__create ${
                activeIdx === suggestions.length ? "is-active" : ""
              }`}
              onMouseDown={(e) => {
                e.preventDefault();
                onCreate!(value.trim());
                setOpen(false);
                setActiveIdx(-1);
              }}
              onMouseEnter={() => setActiveIdx(suggestions.length)}
            >
              <Plus size={12} />
              <span>„{value.trim()}" neu anlegen</span>
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
