/**
 * Disclaimer-Banner fuer HGB-Textbausteine (Jahresabschluss-E3a).
 *
 * Rechtsflagge: User hat explizit gebeten, dass jeder Baustein mit
 * einem prominenten Hinweis auf Stand + §-Verweis + Rueckfrage-
 * Empfehlung markiert ist. Darauf baut das E3b-Final-Doc auf (Footer
 * mit Stand-Listung pro Baustein).
 */
import { Scale } from "lucide-react";

export type TextbausteinDisclaimerProps = {
  versionStand: string;
  paragraphVerweis: string;
};

export function TextbausteinDisclaimer({
  versionStand,
  paragraphVerweis,
}: TextbausteinDisclaimerProps) {
  return (
    <div
      role="note"
      data-testid="textbaustein-disclaimer"
      data-version-stand={versionStand}
      data-paragraph-verweis={paragraphVerweis}
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 8,
        padding: "8px 12px",
        marginBottom: 8,
        background: "var(--warn-bg, #fff8dc)",
        border: "1px solid var(--warn-border, #d8b35c)",
        borderLeft: "4px solid var(--warn-border, #d8b35c)",
        borderRadius: 4,
        fontSize: "0.82rem",
        color: "var(--fg, #111)",
      }}
    >
      <Scale size={16} style={{ flexShrink: 0, marginTop: 2 }} />
      <span>
        Diese Textvorlage entspricht dem Stand <strong>{versionStand}</strong>{" "}
        ({paragraphVerweis}). Rechtliche Änderungen vorbehalten. Bei
        rechtssicherer Verwendung Rücksprache mit Steuerberater/Fachanwalt
        empfohlen.
      </span>
    </div>
  );
}
