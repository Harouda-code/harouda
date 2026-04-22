import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Calendar, Check, CheckCircle2, Clock } from "lucide-react";
import {
  DEFAULT_DEADLINE_OPTIONS,
  generateDeadlines,
  loadDoneIds,
  setDone,
  type Deadline,
  type DeadlineOptions,
} from "../data/deadlines";
import "./DeadlinesPage.css";

const OPT_KEY = "harouda:deadlines-options";

function loadOpts(): DeadlineOptions {
  try {
    const raw = localStorage.getItem(OPT_KEY);
    return raw
      ? { ...DEFAULT_DEADLINE_OPTIONS, ...(JSON.parse(raw) as DeadlineOptions) }
      : DEFAULT_DEADLINE_OPTIONS;
  } catch {
    return DEFAULT_DEADLINE_OPTIONS;
  }
}

function daysUntil(date: Date): number {
  const ms = date.getTime() - Date.now();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

function statusFor(
  d: Deadline,
  done: boolean
): { label: string; klasse: string } {
  if (done) return { label: "erledigt", klasse: "is-done" };
  const n = daysUntil(d.faellig);
  if (n < 0) return { label: "überfällig", klasse: "is-overdue" };
  if (n <= 7) return { label: `in ${n} T.`, klasse: "is-red" };
  if (n <= 30) return { label: `in ${n} T.`, klasse: "is-amber" };
  return { label: `in ${n} T.`, klasse: "is-ok" };
}

export default function DeadlinesPage() {
  const [opts, setOpts] = useState<DeadlineOptions>(loadOpts);
  const [doneIds, setDoneIds] = useState<Set<string>>(loadDoneIds);
  const [horizonDays, setHorizonDays] = useState(180);

  useEffect(() => {
    localStorage.setItem(OPT_KEY, JSON.stringify(opts));
  }, [opts]);

  const deadlines = useMemo(() => {
    const now = new Date();
    const from = new Date(now);
    from.setDate(now.getDate() - 30); // auch kürzlich überfällige anzeigen
    const to = new Date(now);
    to.setDate(now.getDate() + horizonDays);
    return generateDeadlines(from, to, opts);
  }, [opts, horizonDays]);

  function toggleDone(id: string, next: boolean) {
    setDone(id, next);
    setDoneIds(loadDoneIds());
  }

  const buckets = useMemo(() => {
    const overdue: Deadline[] = [];
    const week: Deadline[] = [];
    const month: Deadline[] = [];
    const later: Deadline[] = [];
    const doneList: Deadline[] = [];
    for (const d of deadlines) {
      const isDone = doneIds.has(d.id);
      if (isDone) {
        doneList.push(d);
        continue;
      }
      const n = daysUntil(d.faellig);
      if (n < 0) overdue.push(d);
      else if (n <= 7) week.push(d);
      else if (n <= 30) month.push(d);
      else later.push(d);
    }
    return { overdue, week, month, later, doneList };
  }, [deadlines, doneIds]);

  return (
    <div className="deadlines">
      <header className="deadlines__head">
        <Link to="/einstellungen" className="report__back">
          <Calendar size={16} style={{ marginRight: 4, verticalAlign: "-2px" }} />
          Fristenkalender
        </Link>
        <h1>
          <Clock size={22} style={{ verticalAlign: "-3px", marginRight: 8 }} />
          Steuerfristen
        </h1>
        <p>
          Rein kalendarisch generiert; Wochenend-Verschiebung nach § 108 Abs. 3
          AO wird angewandt. Bewegliche Feiertage sind Bundesland-spezifisch
          und werden hier NICHT berücksichtigt — prüfen Sie kurzfristige
          Termine gegen den Fristenkalender Ihrer Finanzbehörde.
        </p>
      </header>

      <section className="card deadlines__settings">
        <h2>Einstellungen</h2>
        <div className="deadlines__opts">
          <label>
            <input
              type="checkbox"
              checked={opts.ustVaRhythmus === "monat"}
              onChange={(e) =>
                setOpts((o) => ({
                  ...o,
                  ustVaRhythmus: e.target.checked ? "monat" : "quartal",
                }))
              }
            />
            <span>UStVA monatlich (sonst quartalsweise)</span>
          </label>
          <label>
            <input
              type="checkbox"
              checked={opts.dauerfristverlaengerung}
              onChange={(e) =>
                setOpts((o) => ({
                  ...o,
                  dauerfristverlaengerung: e.target.checked,
                }))
              }
            />
            <span>Dauerfristverlängerung (+1 Monat)</span>
          </label>
          <label>
            <input
              type="checkbox"
              checked={opts.istKoerperschaft}
              onChange={(e) =>
                setOpts((o) => ({ ...o, istKoerperschaft: e.target.checked }))
              }
            />
            <span>Körperschaft (GmbH / UG / AG)</span>
          </label>
          <label>
            <input
              type="checkbox"
              checked={opts.hatGewerbe}
              onChange={(e) =>
                setOpts((o) => ({ ...o, hatGewerbe: e.target.checked }))
              }
            />
            <span>Gewerbetreibend (GewSt-Vorauszahlungen)</span>
          </label>
          <label>
            <input
              type="checkbox"
              checked={opts.hatEstVoraus}
              onChange={(e) =>
                setOpts((o) => ({ ...o, hatEstVoraus: e.target.checked }))
              }
            />
            <span>ESt-Vorauszahlungen</span>
          </label>
          <label>
            <span>Horizont (Tage)</span>
            <input
              type="number"
              min="30"
              max="730"
              step="30"
              value={horizonDays}
              onChange={(e) => setHorizonDays(Number(e.target.value))}
              style={{ width: 80, marginLeft: 8 }}
            />
          </label>
        </div>
      </section>

      <Group
        title="Überfällig"
        className="is-overdue"
        items={buckets.overdue}
        doneIds={doneIds}
        onToggle={toggleDone}
      />
      <Group
        title="Diese Woche"
        className="is-red"
        items={buckets.week}
        doneIds={doneIds}
        onToggle={toggleDone}
      />
      <Group
        title="Innerhalb 30 Tagen"
        className="is-amber"
        items={buckets.month}
        doneIds={doneIds}
        onToggle={toggleDone}
      />
      <Group
        title="Später"
        className="is-ok"
        items={buckets.later}
        doneIds={doneIds}
        onToggle={toggleDone}
      />
      <Group
        title="Erledigt"
        className="is-done"
        items={buckets.doneList}
        doneIds={doneIds}
        onToggle={toggleDone}
      />
    </div>
  );
}

function Group({
  title,
  className,
  items,
  doneIds,
  onToggle,
}: {
  title: string;
  className: string;
  items: Deadline[];
  doneIds: Set<string>;
  onToggle: (id: string, done: boolean) => void;
}) {
  if (items.length === 0) return null;
  return (
    <section className={`card deadlines__group ${className}`}>
      <header>
        <h2>{title}</h2>
        <span className="deadlines__count">{items.length}</span>
      </header>
      <ul className="deadlines__list">
        {items.map((d) => {
          const done = doneIds.has(d.id);
          const status = statusFor(d, done);
          return (
            <li
              key={d.id}
              className={`deadlines__item ${done ? "is-done" : ""}`}
            >
              <button
                type="button"
                className={`deadlines__check ${done ? "is-done" : ""}`}
                onClick={() => onToggle(d.id, !done)}
                aria-label={done ? "Als offen markieren" : "Als erledigt markieren"}
              >
                {done ? <CheckCircle2 size={18} /> : <Check size={18} />}
              </button>
              <div className="deadlines__body">
                <strong>{d.titel}</strong>
                <span className="deadlines__detail">{d.detail}</span>
              </div>
              <div className="deadlines__meta">
                <span className="mono">
                  {d.faellig.toLocaleDateString("de-DE")}
                </span>
                <span className={`deadlines__status ${status.klasse}`}>
                  {status.label}
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
