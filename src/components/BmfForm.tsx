import type { ReactNode } from "react";
import "../styles/bmf-form.css";

const euro = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
});

export function BmfForm({
  title,
  subtitle,
  children,
  stamp = "NACHGEBILDETE DARSTELLUNG",
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  stamp?: string;
}) {
  return (
    <div className="bmf-form">
      {stamp && <span className="bmf-form__stamp">{stamp}</span>}
      <h2 className="bmf-form__title">{title}</h2>
      {subtitle && <p className="bmf-form__subtitle">{subtitle}</p>}
      {children}
    </div>
  );
}

export function BmfSection({
  title,
  description,
  total,
  children,
}: {
  title: string;
  description?: string;
  total?: number;
  children: ReactNode;
}) {
  return (
    <section className="bmf-form__section">
      <div className="bmf-form__section-head">
        {title}
        {total !== undefined && (
          <span className="bmf-form__section-head-total">
            {euro.format(total)}
          </span>
        )}
      </div>
      {description && (
        <div className="bmf-form__section-desc">{description}</div>
      )}
      {children}
    </section>
  );
}

/** Read-only row: renders a formatted value or a muted "—" for
 *  Kennzahlen the system doesn't currently compute. */
export function BmfRow({
  kz,
  label,
  hint,
  value,
  subtotal,
}: {
  kz: string;
  label: string;
  hint?: string;
  value?: number;
  subtotal?: boolean;
}) {
  const unsupported = value === undefined;
  const classes = [
    "bmf-form__row",
    unsupported ? "bmf-form__row--unsupported" : "",
    subtotal ? "bmf-form__row--subtotal" : "",
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <div className={classes}>
      <div
        className={`bmf-form__kz-cell${kz ? "" : " bmf-form__kz-cell--empty"}`}
      >
        {kz}
      </div>
      <div className="bmf-form__label">
        <span>
          {label}
          {unsupported && " *"}
          {hint && <span className="bmf-form__label-hint">{hint}</span>}
        </span>
      </div>
      <div className="bmf-form__amount">
        {unsupported ? "—" : euro.format(value as number)}
      </div>
    </div>
  );
}

/** Editable row: renders a numeric input in the amount cell. */
export function BmfInputRow({
  kz,
  label,
  hint,
  value,
  onChange,
  disabled,
  step = 0.01,
}: {
  kz: string;
  label: string;
  hint?: string;
  value: number;
  onChange: (v: number) => void;
  disabled?: boolean;
  step?: number;
}) {
  return (
    <div className="bmf-form__row">
      <div
        className={`bmf-form__kz-cell${kz ? "" : " bmf-form__kz-cell--empty"}`}
      >
        {kz}
      </div>
      <label className="bmf-form__label">
        <span>
          {label}
          {hint && <span className="bmf-form__label-hint">{hint}</span>}
        </span>
      </label>
      <div className="bmf-form__amount">
        <input
          type="number"
          className="bmf-form__amount-input"
          min="0"
          step={step}
          value={value === 0 ? "" : value}
          onChange={(e) => onChange(Number(e.target.value) || 0)}
          disabled={disabled}
          placeholder="0,00"
        />
      </div>
    </div>
  );
}

export function BmfResult({
  kz,
  label,
  value,
  variant = "primary",
}: {
  kz?: string;
  label: string;
  value: number;
  variant?: "primary" | "erstattung" | "gewinn" | "verlust";
}) {
  const cls =
    variant === "primary"
      ? "bmf-form__result"
      : `bmf-form__result bmf-form__result--${variant}`;
  return (
    <div className={cls}>
      <span className="bmf-form__result-kz">{kz ?? ""}</span>
      <span className="bmf-form__result-label">{label}</span>
      <span className="bmf-form__result-amount">{euro.format(value)}</span>
    </div>
  );
}

export function BmfSignatures({
  left = "Datum, Ort",
  right = "Unterschrift",
}: {
  left?: string;
  right?: string;
}) {
  return (
    <div className="bmf-form__signatures">
      <div className="bmf-form__signature">{left}</div>
      <div className="bmf-form__signature">{right}</div>
    </div>
  );
}

export function BmfFootnotes({ children }: { children: ReactNode }) {
  return <div className="bmf-form__footnotes">{children}</div>;
}
