/**
 * StepErlaeuterungen (Sprint 17.5 / Schritt 6).
 *
 * Wizard-Step zwischen "Bausteine" und "Review". Der Erlaeuterungs-
 * bericht ist freiwillig (§ 264 Abs. 2 Satz 2 HGB). Ein einziger
 * TipTap-Editor (free-form) + 4 Click-to-Insert-Phrasen-Chips.
 */
import { useMemo, useState } from "react";
import { toast } from "sonner";
import type { JSONContent } from "@tiptap/react";
import { TipTapEditor } from "../../components/jahresabschluss/TipTapEditor";
import { ERLAEUTERUNGS_PHRASEN } from "../../domain/jahresabschluss/erlaeuterungsPhrasen";
import {
  markStepCompleted,
  updateStep,
} from "../../domain/jahresabschluss/wizardStore";
import type { StepProps } from "./stepTypes";
import type { WizardErlaeuterungenData } from "../../domain/jahresabschluss/WizardTypes";

function emptyDoc(): JSONContent {
  return { type: "doc", content: [] };
}

function appendPhraseToDoc(
  current: JSONContent | null,
  text: string
): JSONContent {
  const base = current ?? emptyDoc();
  const content = Array.isArray(base.content) ? [...base.content] : [];
  content.push({
    type: "paragraph",
    content: [{ type: "text", text }],
  });
  return { type: "doc", content };
}

function countWords(doc: JSONContent | null): number {
  if (!doc || !doc.content) return 0;
  let c = 0;
  const walk = (n: JSONContent): void => {
    if (typeof n.text === "string") {
      const words = n.text.trim().split(/\s+/).filter((w) => w.length > 0);
      c += words.length;
    }
    if (Array.isArray(n.content)) n.content.forEach(walk);
  };
  walk(doc);
  return c;
}

export function StepErlaeuterungen({
  state,
  mandantId,
  jahr,
  onAdvance,
}: StepProps) {
  const existing = state.data.erlaeuterungen;
  const [aktiv, setAktiv] = useState<boolean>(existing?.aktiv ?? false);
  const [doc, setDoc] = useState<JSONContent | null>(
    existing?.text ?? null
  );

  const wordCount = useMemo(() => countWords(doc), [doc]);

  function persist(data: WizardErlaeuterungenData): void {
    updateStep(mandantId, jahr, {
      data: { erlaeuterungen: data },
    });
  }

  function handleAktivToggle(next: boolean): void {
    setAktiv(next);
    persist({ aktiv: next, text: next ? doc : null });
  }

  function handleDocChange(next: JSONContent): void {
    setDoc(next);
    persist({ aktiv, text: next });
  }

  function handleInsertPhrase(text: string): void {
    const next = appendPhraseToDoc(doc, text);
    setDoc(next);
    persist({ aktiv, text: next });
  }

  function handleSaveAndAdvance(): void {
    persist({ aktiv, text: aktiv ? doc : null });
    markStepCompleted(mandantId, jahr, "erlaeuterungen");
    toast.success("Erläuterungen gespeichert.");
    onAdvance("review");
  }

  return (
    <section data-testid="step-erlaeuterungen">
      <h2>Schritt 5 — Erläuterungsbericht</h2>

      <aside
        role="note"
        style={{
          background: "var(--info-bg, #eef4fb)",
          border: "1px solid var(--info, #4c7caf)",
          padding: 10,
          borderRadius: 6,
          marginBottom: 12,
          fontSize: "0.85rem",
        }}
      >
        <strong>Freiwillig:</strong> Erläuterungen sind freiwillig
        (§ 264 Abs. 2 Satz 2 HGB). Dieser Bericht ergänzt den gesetzlichen
        Anhang und gibt dem Mandanten zusätzliche Einsicht in die
        Vermögens- und Ertragslage.
      </aside>

      <label
        style={{ display: "block", marginBottom: 10 }}
        data-testid="erlaeuterungen-aktiv-label"
      >
        <input
          type="checkbox"
          checked={aktiv}
          onChange={(e) => handleAktivToggle(e.target.checked)}
          data-testid="erlaeuterungen-aktiv-toggle"
        />{" "}
        Erläuterungsbericht aktivieren
      </label>

      {aktiv && (
        <>
          <div
            style={{
              marginBottom: 8,
              display: "flex",
              gap: 6,
              flexWrap: "wrap",
            }}
            data-testid="erlaeuterungen-phrases"
          >
            {ERLAEUTERUNGS_PHRASEN.map((p) => (
              <button
                key={p.id}
                type="button"
                className="btn btn-outline"
                onClick={() => handleInsertPhrase(p.text)}
                data-testid={`phrase-btn-${p.id}`}
                title={p.text}
                style={{ fontSize: "0.82rem" }}
              >
                + {p.label}
              </button>
            ))}
          </div>

          <TipTapEditor
            content={doc}
            onChange={handleDocChange}
            placeholder="Freitext-Erläuterungen zum Jahresabschluss eingeben…"
          />

          <div
            style={{
              marginTop: 4,
              textAlign: "right",
              fontSize: "0.8rem",
              color: "var(--muted)",
            }}
            data-testid="erlaeuterungen-wordcount"
          >
            {wordCount} Wörter
          </div>
        </>
      )}

      <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
        <button
          type="button"
          className="btn btn-primary"
          onClick={handleSaveAndAdvance}
          data-testid="btn-erlaeuterungen-advance"
        >
          Speichern + Weiter →
        </button>
      </div>
    </section>
  );
}
