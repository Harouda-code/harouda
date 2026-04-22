-- ============================================================================
-- harouda-app · Hash-chain fields on audit_log
--
-- Each row stores the SHA-256 of (prev_hash || canonical JSON of the row
-- without `hash`). A verifier walking the chain from the genesis (all zeros)
-- can detect any after-the-fact edit. This is tamper-EVIDENCE, not
-- tamper-PROOFing: a single operator with DB access could still rewrite
-- everything. For true immutability the log must also be shipped to an
-- append-only medium (WORM storage, external SIEM, …).
-- ============================================================================

alter table public.audit_log
  add column if not exists prev_hash text not null default '0000000000000000000000000000000000000000000000000000000000000000',
  add column if not exists hash text not null default '';

-- A cheap per-owner uniqueness on hash avoids duplicate rows during a
-- double-insert race. Genesis hash is allowed exactly once per owner since
-- only the very first row uses it.
create index if not exists audit_log_owner_hash_idx
  on public.audit_log (owner_id, hash);
