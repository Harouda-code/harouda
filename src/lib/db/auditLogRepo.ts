/**
 * Audit-Log Repository — Lese-Zugriff auf die bestehende `audit_log`-Tabelle.
 *
 * Schreibzugriff erfolgt weiterhin über `src/api/audit.ts:log()` (mit Hash-Kette).
 * Dieses Repo stellt strukturierte Abfragen für den Audit-Trail-Viewer bereit.
 *
 * DEMO_MODE: liest aus dem localStorage-Store (siehe api/store.ts). Produktion:
 * Supabase-RPC / -Query gegen audit_log-Tabelle.
 */

import type {
  AuditLogEntry,
  AuditAction,
  AuditEntity,
} from "../../types/db";
import { store } from "../../api/store";
import { supabase, DEMO_MODE } from "../../api/supabase";

export type AuditQueryFilters = {
  entity?: AuditEntity;
  action?: AuditAction;
  actor?: string;
  dateFrom?: string; // ISO
  dateTo?: string; // ISO
  entityId?: string;
  limit?: number;
  offset?: number;
};

export type AuditQueryResult = {
  entries: AuditLogEntry[];
  total: number;
};

export type AuditStatistics = {
  totalOperations: number;
  byEntity: Array<{ entity: string; count: number }>;
  byAction: Array<{ action: string; count: number }>;
  byActor: Array<{ actor: string; count: number }>;
  sensitiveOperations: number; // delete, reverse
  dailyTrend: Array<{ date: string; count: number }>;
};

const SENSITIVE_ACTIONS: AuditAction[] = ["delete", "reverse"];

function matchesFilter(e: AuditLogEntry, f: AuditQueryFilters): boolean {
  if (f.entity && e.entity !== f.entity) return false;
  if (f.action && e.action !== f.action) return false;
  if (f.actor && (e.actor ?? "").toLowerCase() !== f.actor.toLowerCase())
    return false;
  if (f.entityId && e.entity_id !== f.entityId) return false;
  if (f.dateFrom && e.at < f.dateFrom) return false;
  if (f.dateTo && e.at > f.dateTo) return false;
  return true;
}

export class AuditLogRepo {
  async query(filters: AuditQueryFilters = {}): Promise<AuditQueryResult> {
    if (DEMO_MODE) {
      const all = store.getAudit();
      const filtered = all.filter((e) => matchesFilter(e, filters));
      const total = filtered.length;
      const offset = filters.offset ?? 0;
      const limit = filters.limit ?? 50;
      const entries = filtered.slice(offset, offset + limit);
      return { entries, total };
    }
    // Supabase path
    let q = supabase
      .from("audit_log")
      .select("*", { count: "exact" })
      .order("at", { ascending: false });
    if (filters.entity) q = q.eq("entity", filters.entity);
    if (filters.action) q = q.eq("action", filters.action);
    if (filters.actor) q = q.eq("actor", filters.actor);
    if (filters.entityId) q = q.eq("entity_id", filters.entityId);
    if (filters.dateFrom) q = q.gte("at", filters.dateFrom);
    if (filters.dateTo) q = q.lte("at", filters.dateTo);
    const offset = filters.offset ?? 0;
    const limit = filters.limit ?? 50;
    q = q.range(offset, offset + limit - 1);
    const { data, error, count } = await q;
    if (error) throw error;
    return {
      entries: (data ?? []) as AuditLogEntry[],
      total: count ?? 0,
    };
  }

  async getEntityHistory(
    entity: AuditEntity,
    entityId: string
  ): Promise<AuditLogEntry[]> {
    const { entries } = await this.query({
      entity,
      entityId,
      limit: 500,
    });
    return [...entries].sort((a, b) => a.at.localeCompare(b.at));
  }

  async getStatistics(periodDays = 30): Promise<AuditStatistics> {
    const since = new Date(Date.now() - periodDays * 86400000).toISOString();
    const { entries } = await this.query({
      dateFrom: since,
      limit: 10000,
    });

    const byEntity = new Map<string, number>();
    const byAction = new Map<string, number>();
    const byActor = new Map<string, number>();
    const byDate = new Map<string, number>();
    let sensitive = 0;

    for (const e of entries) {
      byEntity.set(e.entity, (byEntity.get(e.entity) ?? 0) + 1);
      byAction.set(e.action, (byAction.get(e.action) ?? 0) + 1);
      const actor = e.actor ?? "(unbekannt)";
      byActor.set(actor, (byActor.get(actor) ?? 0) + 1);
      const day = e.at.slice(0, 10);
      byDate.set(day, (byDate.get(day) ?? 0) + 1);
      if (SENSITIVE_ACTIONS.includes(e.action)) sensitive++;
    }

    const toSortedArray = <T extends string>(
      m: Map<T, number>,
      key: string
    ): Array<Record<string, number | T>> =>
      Array.from(m.entries())
        .map(([k, count]) => ({ [key]: k, count }))
        .sort(
          (a, b) => (b.count as number) - (a.count as number)
        ) as Array<Record<string, number | T>>;

    return {
      totalOperations: entries.length,
      byEntity: toSortedArray(byEntity, "entity") as Array<{
        entity: string;
        count: number;
      }>,
      byAction: toSortedArray(byAction, "action") as Array<{
        action: string;
        count: number;
      }>,
      byActor: toSortedArray(byActor, "actor") as Array<{
        actor: string;
        count: number;
      }>,
      sensitiveOperations: sensitive,
      dailyTrend: Array.from(byDate.entries())
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date)),
    };
  }

  async getSensitiveOperations(periodDays = 30): Promise<AuditLogEntry[]> {
    const since = new Date(Date.now() - periodDays * 86400000).toISOString();
    const results: AuditLogEntry[] = [];
    for (const action of SENSITIVE_ACTIONS) {
      const { entries } = await this.query({
        action,
        dateFrom: since,
        limit: 1000,
      });
      results.push(...entries);
    }
    return results.sort((a, b) => b.at.localeCompare(a.at));
  }
}
