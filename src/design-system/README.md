# harouda-app — Design-System

Dieses Dokument beschreibt die Design-Tokens, Primitive und React-Komponenten,
die in der App verfügbar sind. Alle Tokens leben als CSS-Variablen in
`src/index.css`. Neue Seiten sollten ausschließlich über diese Tokens
gestalten — keine Hex-Werte direkt in Page-CSS.

---

## Farbpalette

### Primär & Sekundär

| Token | Hex | Verwendung |
|-------|-----|------------|
| `--navy`     | `#1e3a8a` | Primär. Headings, aktive Nav, gefüllte Buttons (`btn-navy`). |
| `--navy-700` | `#1e40af` | Hover/Focus-States auf Navy. |
| `--navy-600` | `#2544a1` | Muted-Navy-Flächen. |
| `--navy-900` | `#172554` | Tiefste Navy-Abschattung, Text auf Gold-Knöpfen. |
| `--gold`     | `#f59e0b` | Sekundär. Akzentfarbe, `btn-primary`. |
| `--gold-600` | `#d97706` | Gold-Hover. |
| `--gold-700` | `#b45309` | Links, ausgewählter Textzustand. |
| `--gold-200` | `#fcd34d` | Badge-Hintergründe, Text auf Navy-Flächen. |
| `--gold-100` | `#fef3c7` | Sanfter Hintergrund für Hinweise. |

### Neutrale Graustufen (Tailwind slate)

| Token | Hex | Verwendung |
|-------|-----|------------|
| `--bg`            | `#f8fafc` | App-Hintergrund (slate-50). |
| `--surface`       | `#ffffff` | Karten-Oberflächen. |
| `--surface-muted` | `#f1f5f9` | Subtile Zweit-Flächen (slate-100). |
| `--ivory-200`     | `#e2e8f0` | Feine Rahmen / `--border` (slate-200). |
| `--border-strong` | `#cbd5e1` | Betonte Rahmen (slate-300). |
| `--muted`         | `#64748b` | Sekundärtext (slate-500). |
| `--ink-soft`      | `#334155` | Primärtext soft (slate-700). |
| `--ink`           | `#1e293b` | Primärtext (slate-800). |

### Statusfarben

| Token | Hex | Verwendung |
|-------|-----|------------|
| `--success` | `#059669` | Grün — erfolgreiche Aktionen, positive KPIs. |
| `--warning` | `#d97706` | Amber — Warnhinweise, überfällig-Buckets. |
| `--danger`  | `#dc2626` | Rot — Fehler, destructive Actions, `btn-danger`. |
| `--info`    | `#2563eb` | Blau — neutrale Infos, „Hinweis"-Banner. |

---

## Typografie

- **Überschriften**: `Playfair Display`, `font-weight: 600` (h1: 700).
  Hierarchie bereits in `index.css` gesetzt — nicht je Seite überschreiben.
- **Body / UI**: `Inter Tight`, `16px/1.55`.
- **Monospace** (`--font-mono`): Zahlen, Beleg-Nr., IBAN.
- **Tabular Nums**: Währungen/Beträge mit `font-variant-numeric: tabular-nums`
  (Utility-Klasse `.mono`).

Deutsche Besonderheiten:

- Zahlen mit `Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" })`.
- Datumsformat `toLocaleDateString("de-DE")` → `18.04.2026`.
- Text respektiert die üblichen Umlaute und das ß; die UI hat keine harten
  Längengrenzen, die lange deutsche Komposita abschneiden würden.

---

## Radii & Shadows

| Token | Wert |
|-------|------|
| `--radius-sm` | `6px` |
| `--radius`    | `10px` |
| `--radius-lg` | `16px` |
| `--radius-xl` | `24px` |
| `--shadow-sm` | zarter Umriss |
| `--shadow`    | Karten-Schatten |
| `--shadow-lg` | Modal-/Overlay-Schatten |
| `--shadow-gold` | Für primäre Buttons (Gold-Akzent). |

---

## Motion

- `--duration`: `220ms`
- `--ease`: `cubic-bezier(0.4, 0, 0.2, 1)`
- `prefers-reduced-motion` wird im Skeleton-Component respektiert.

---

## CSS-Primitive (bereits in `index.css`)

| Klasse | Zweck |
|--------|-------|
| `.btn` + `.btn-primary` | Gefüllter Gold-Knopf (Haupt-CTAs). |
| `.btn-navy`             | Sekundärer Call-to-Action in Navy. |
| `.btn-outline`          | Neutraler Knopf mit Rahmen. |
| `.btn-ghost`            | Unauffälliger Text-Knopf. |
| `.btn-danger`           | Für destructive Aktionen (rot). |
| `.btn-sm` / `.btn-lg`   | Größenmodifikatoren. |
| `.btn-block`            | Volle Container-Breite. |
| `.card`                 | Standard-Oberflächenkarte. |
| `.form-grid`            | Responsives 2-Spalten-Formular-Grid. |
| `.form-field`           | Label + Input-Paar. |
| `.form-field--wide`     | Feld spannt die volle Grid-Breite. |
| `.container`            | Max-Breite 1200 px zentriert. |
| `.mono`                 | Monospace mit Tabular Nums. |
| `.is-num`               | Rechtsbündig + tabular nums. |

---

## React-Komponenten (`src/components/ui/`)

### `<Button>`

Typisierter Wrapper um die `.btn`-Klassen. Gleiche CSS, aber mit Prop-Typ-
Sicherheit und eingebautem Loading-Spinner.

```tsx
import { Button } from "@/components/ui/Button";
import { Plus } from "lucide-react";

<Button variant="primary" leadingIcon={<Plus size={16} />} loading={busy}>
  Neue Buchung
</Button>
```

Varianten: `primary | navy | outline | ghost | danger`.
Größen: `sm | md | lg`.

Hinweis: Bestehende `<button className="btn btn-primary">` bleiben gültig —
die React-Komponente ist optional.

### `<Modal>`

Dialog mit Backdrop, Titel, Beschreibung, Body und optionalem Footer.
Schließt per Esc-Taste oder Backdrop-Klick.

```tsx
<Modal
  open={open}
  title="Buchung löschen?"
  description="Diese Aktion kann nicht rückgängig gemacht werden."
  onClose={() => setOpen(false)}
  size="sm"
  footer={
    <>
      <Button variant="ghost" onClick={() => setOpen(false)}>Abbrechen</Button>
      <Button variant="danger" onClick={confirm}>Löschen</Button>
    </>
  }
>
  <p>Beleg {beleg} wird entfernt.</p>
</Modal>
```

### `<DataTable>`

Schlanke Tabelle mit globaler Suche und Pro-Spalten-Sort (3-Stufen:
asc → desc → off). Keine Pagination und keine Multi-Sort — für
größere Datenmengen ist eine virtualisierte Variante nachzurüsten.

```tsx
const columns: Column<JournalEntry>[] = [
  { key: "datum", header: "Datum", accessor: (e) => e.datum },
  { key: "beleg", header: "Beleg-Nr.", accessor: (e) => e.beleg_nr },
  {
    key: "betrag",
    header: "Betrag",
    accessor: (e) => e.betrag,
    render: (e) => euro.format(e.betrag),
    align: "num",
  },
];

<DataTable
  columns={columns}
  data={entries}
  rowKey={(e) => e.id}
  searchPlaceholder="Suche nach Beleg, Beschreibung …"
  emptyMessage="Keine Buchungen."
/>
```

### `<Skeleton>` / `<SkeletonText>` / `<SkeletonTable>`

Pulsierende Platzhalter beim Laden. Mit `prefers-reduced-motion` schaltet
die Animation sich automatisch ab.

```tsx
{loading ? <SkeletonTable rows={8} columns={6} /> : <DataTable … />}
```

---

## Toasts

`sonner`-Integration steht bereits in `main.tsx`. Aufruf über `toast.success`,
`toast.error`, `toast.info`, `toast.warning`. Dauer in ms via `{ duration: 6000 }`.

---

## Migrationspfad für Bestands-Seiten

Bestehende Pages haben jeweils eine eigene CSS-Datei. Sie nutzen bereits die
Design-Tokens (CSS-Variablen) — der Token-Swap auf `#1e3a8a` / `#f59e0b` /
slate wirkt daher überall automatisch.

Für neue Seiten empfohlen:
1. Keine neuen Hex-Werte in Page-CSS; nur Tokens referenzieren.
2. Für Tabellen `<DataTable>` statt eigener `<table>`.
3. Für Dialoge `<Modal>` statt ad-hoc Backdrop-Divs.
4. Für Loading-States `<SkeletonTable>` / `<Skeleton>` statt Spinner-only.
5. Für Buttons mit Loading-Spinner die `<Button loading>`-Prop verwenden.
