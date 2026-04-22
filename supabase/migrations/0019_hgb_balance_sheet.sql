-- ============================================================================
-- harouda-app · HGB § 266 Balance Sheet Schema
--
-- Ehrlicher Scope:
--   • Diese Migration ist OPTIONAL — die Bilanz-Engine läuft auch rein
--     in-memory im Browser (siehe src/domain/accounting/BalanceSheetBuilder.ts).
--   • Wenn DB-seitig kategorisiert werden soll (mehrere Mandanten, große
--     Journale, serverseitige Bilanz-API), dient dieses Schema als Grundlage.
--   • Die Closure-Table ist bei ~50 Berichtszeilen (§ 266 HGB Baum-Tiefe 4)
--     praktisch irrelevant — sie wird hier nur für größere Setups oder
--     künftige GuV-Gliederungen mit mehr Zeilen mit vorgesehen.
--
-- Rechtsgrundlage: HGB §§ 242, 266, 268 · AO § 146 · GoBD
-- ============================================================================

CREATE TABLE IF NOT EXISTS report_lines (
  id              BIGSERIAL PRIMARY KEY,
  mandant_id      UUID NOT NULL,
  reference_code  VARCHAR(50) NOT NULL,
  name_de         VARCHAR(500) NOT NULL,
  short_label     VARCHAR(100),
  balance_type    VARCHAR(10) NOT NULL CHECK (balance_type IN ('AKTIVA','PASSIVA')),
  normal_side     VARCHAR(10) NOT NULL CHECK (normal_side IN ('SOLL','HABEN')),
  sort_order      INTEGER NOT NULL,
  hgb_paragraph   VARCHAR(50),
  size_class      VARCHAR(20) NOT NULL DEFAULT 'ALL'
                    CHECK (size_class IN ('KLEIN','MITTEL','GROSS','ALL')),
  is_virtual      BOOLEAN NOT NULL DEFAULT false,
  active          BOOLEAN NOT NULL DEFAULT true,
  valid_from      DATE NOT NULL,
  valid_to        DATE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(mandant_id, reference_code, valid_from)
);

CREATE INDEX IF NOT EXISTS idx_report_lines_mandant ON report_lines(mandant_id);
CREATE INDEX IF NOT EXISTS idx_report_lines_ref    ON report_lines(reference_code);

-- Closure Table (ancestor/descendant mit Tiefe)
CREATE TABLE IF NOT EXISTS report_line_closure (
  ancestor_id     BIGINT NOT NULL REFERENCES report_lines(id) ON DELETE CASCADE,
  descendant_id   BIGINT NOT NULL REFERENCES report_lines(id) ON DELETE CASCADE,
  depth           INTEGER NOT NULL CHECK (depth >= 0),
  mandant_id      UUID NOT NULL,
  PRIMARY KEY (ancestor_id, descendant_id)
);

CREATE INDEX IF NOT EXISTS idx_closure_ancestor   ON report_line_closure(ancestor_id, depth);
CREATE INDEX IF NOT EXISTS idx_closure_descendant ON report_line_closure(descendant_id, depth);
CREATE INDEX IF NOT EXISTS idx_closure_mandant    ON report_line_closure(mandant_id);

-- Mapping: Konto → Berichtszeile
CREATE TABLE IF NOT EXISTS account_report_mapping (
  id              BIGSERIAL PRIMARY KEY,
  mandant_id      UUID NOT NULL,
  account_id      UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  report_line_id  BIGINT NOT NULL REFERENCES report_lines(id) ON DELETE CASCADE,
  skr_version     VARCHAR(10) NOT NULL CHECK (skr_version IN ('SKR03','SKR04')),
  tag             VARCHAR(100),
  mapping_source  VARCHAR(20) NOT NULL
                    CHECK (mapping_source IN ('AUTO_RANGE','AUTO_TAG','MANUAL')),
  valid_from      DATE NOT NULL,
  valid_to        DATE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(mandant_id, account_id, skr_version, valid_from)
);

CREATE INDEX IF NOT EXISTS idx_arm_account     ON account_report_mapping(account_id);
CREATE INDEX IF NOT EXISTS idx_arm_mandant_skr ON account_report_mapping(mandant_id, skr_version);

-- Erweiterung accounts für Tags und Wechselkonto-Flag
ALTER TABLE accounts
  ADD COLUMN IF NOT EXISTS tags            TEXT[] DEFAULT '{}'::TEXT[],
  ADD COLUMN IF NOT EXISTS skr_version     VARCHAR(10),
  ADD COLUMN IF NOT EXISTS is_wechselkonto BOOLEAN NOT NULL DEFAULT false;

-- ============================================================================
-- Row-Level-Security (RLS)
-- ============================================================================

ALTER TABLE report_lines             ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_line_closure      ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_report_mapping   ENABLE ROW LEVEL SECURITY;

-- Policies analog zu anderen Mandanten-Tabellen: user sieht nur eigenen mandant.
-- (Die konkreten Policies hängen von Ihrer company_members/mandant-Struktur ab;
--  Platzhalter — ggf. an existierende helper_functions anpassen.)
CREATE POLICY report_lines_tenant_isolation ON report_lines
  FOR ALL USING (
    mandant_id IN (
      SELECT id FROM clients WHERE company_id = auth.uid()
    )
  );

CREATE POLICY closure_tenant_isolation ON report_line_closure
  FOR ALL USING (
    mandant_id IN (
      SELECT id FROM clients WHERE company_id = auth.uid()
    )
  );

CREATE POLICY arm_tenant_isolation ON account_report_mapping
  FOR ALL USING (
    mandant_id IN (
      SELECT id FROM clients WHERE company_id = auth.uid()
    )
  );

-- ============================================================================
-- Audit-Trigger für Mapping-Änderungen (GoBD Rz. 107 Historisation)
-- ============================================================================

CREATE OR REPLACE FUNCTION audit_account_report_mapping()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO audit_log (entity, entity_id, action, summary, created_at)
  VALUES (
    'account_report_mapping',
    COALESCE(NEW.id, OLD.id)::text,
    TG_OP,
    COALESCE(
      'account=' || COALESCE(NEW.account_id, OLD.account_id)::text
        || ' line=' || COALESCE(NEW.report_line_id, OLD.report_line_id)::text
        || ' source=' || COALESCE(NEW.mapping_source, OLD.mapping_source),
      'mapping change'
    ),
    now()
  );
  RETURN COALESCE(NEW, OLD);
END; $$;

CREATE TRIGGER account_report_mapping_audit
  AFTER INSERT OR UPDATE OR DELETE ON account_report_mapping
  FOR EACH ROW EXECUTE FUNCTION audit_account_report_mapping();
