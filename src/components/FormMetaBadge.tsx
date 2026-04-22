import { BadgeInfo } from "lucide-react";
import { getFormMeta, type FormId } from "../data/formMeta";
import { STEUERPARAMETER_VERSION } from "../data/steuerParameter";
import "./FormMetaBadge.css";

const STATUS_LABEL: Record<"vorlaeufig" | "bestaetigt" | "final", string> = {
  vorlaeufig: "vorläufig",
  bestaetigt: "intern bestätigt",
  final: "final",
};

/**
 * Zeigt Herkunft, Versionierung und Haftungsausschluss eines Formulars an.
 * MUSS auf jeder Formular-Seite gerendert werden, damit Nutzer:innen sehen,
 * dass die App **keine zertifizierte Abgabeform** ist.
 */
export default function FormMetaBadge({ formId }: { formId: FormId }) {
  const m = getFormMeta(formId);
  return (
    <aside className="formmeta no-print" aria-label="Formular-Metadaten">
      <div className="formmeta__icon">
        <BadgeInfo size={16} />
      </div>
      <div className="formmeta__body">
        <div className="formmeta__line">
          <strong>{m.title}</strong>
          <span className="formmeta__chip">
            Version {m.version}
          </span>
          <span className={`formmeta__chip formmeta__chip--${m.reviewStatus}`}>
            {STATUS_LABEL[m.reviewStatus]}
          </span>
          <span className="formmeta__chip">
            VZ {m.veranlagungsjahr}
          </span>
          <span className="formmeta__chip">
            Parameter {STEUERPARAMETER_VERSION}
          </span>
          <span className="formmeta__chip formmeta__chip--muted">
            geprüft {new Date(m.lastReviewed).toLocaleDateString("de-DE")}
          </span>
        </div>

        <p className="formmeta__disclaimer">{m.disclaimer}</p>

        <p className="formmeta__sources">
          <span>Offizielle Primärquellen:</span>
          {m.sources.map((s, i) => (
            <span key={s.url}>
              {i > 0 && " · "}
              <a href={s.url} target="_blank" rel="noreferrer noopener">
                {s.label}
              </a>
            </span>
          ))}
        </p>
      </div>
    </aside>
  );
}
