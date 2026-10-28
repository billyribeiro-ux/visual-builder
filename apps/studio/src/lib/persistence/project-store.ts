/**
 * Durable, versioned project persistence for the Studio.
 *
 * - IndexedDB (not localStorage) so real projects with assets don't hit the ~5 MB quota.
 * - Every load goes through `migrateBlueprintWithReport`, so projects saved by any older
 *   schema version keep opening, and invalid data is quarantined instead of overwritten.
 * - Writes throw on failure (quota, private mode); the editor surfaces that in the UI
 *   instead of pretending the save worked.
 * - Falls back to an in-memory store when IndexedDB is unavailable (SSR, locked-down browsers).
 */
import { z } from 'zod';
import {
  BlueprintNodeSchema,
  migrateBlueprintWithReport,
  type ProjectBlueprint,
  type BlueprintNode
} from '@app-viz/schema';

const DB_NAME = 'app-viz-studio';
const DB_VERSION = 1;
const STORE_PROJECTS = 'projects';
const STORE_SNAPSHOTS = 'snapshots';
const STORE_KV = 'kv';
export const MAX_SNAPSHOTS_PER_PROJECT = 30;

/** Pre-IndexedDB localStorage keys (v1). Imported once, then renamed — never deleted. */
const LEGACY_KEYS = {
  blueprint: 'app-viz-studio-blueprint-v1',
  snapshots: 'app-viz-studio-snapshots-v1',
  favorites: 'app-viz-studio-favorites-v1',
  symbols: 'app-viz-studio-symbols-v1'
} as const;

export interface ProjectSummary {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
  schemaVersion: string;
  pageCount: number;
  nodeCount: number;
}

interface ProjectRecord extends ProjectSummary {
  blueprint: unknown;
}

export interface SnapshotRecord {
  id: string;
  projectId: string;
  label: string;
  /** ISO-8601 timestamp. */
  createdAt: string;
  blueprint: ProjectBlueprint;
}

export const SavedSymbolSchema = z.object({
  id: z.string().min(1),
  name: z.string(),
  componentType: z.string(),
  createdAt: z.string(),
  node: BlueprintNodeSchema
});
export type SavedSymbol = { id: string; name: string; componentType: string; createdAt: string; node: BlueprintNode };

const FavoritesSchema = z.array(z.string()).max(200);

export type LoadResult =
  | { ok: true; blueprint: ProjectBlueprint; migratedFrom?: string; appliedSteps: string[] }
  | { ok: false; error: string; quarantineKey?: string };

/** Portable project file format (`*.appviz.json`). */
export const PROJECT_FILE_FORMAT = 'app-viz-project';
export const PROJECT_FILE_VERSION = 1;

export function serializeProjectFile(blueprint: ProjectBlueprint): string {
  return JSON.stringify(
    {
      format: PROJECT_FILE_FORMAT,
      formatVersion: PROJECT_FILE_VERSION,
      exportedAt: new Date().toISOString(),
      blueprint
    },
    null,
    2
  );
}

/** Accepts a `.appviz.json` envelope or a raw blueprint, from any supported schema version. */
export function parseProjectFile(text: string): LoadResult {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch (e) {
    return { ok: false, error: `Not valid JSON: ${(e as Error).message}` };
  }
  const payload =
    data && typeof data === 'object' && (data as Record<string, unknown>).format === PROJECT_FILE_FORMAT
      ? (data as Record<string, unknown>).blueprint
      : data;
  return validateBlueprint(payload);
}

export function validateBlueprint(payload: unknown): LoadResult {
  try {
    const report = migrateBlueprintWithReport(payload);
    return {
      ok: true,
      blueprint: report.blueprint,
      migratedFrom: report.appliedSteps.length ? report.fromVersion : undefined,
      appliedSteps: report.appliedSteps
    };
  } catch (e) {
    const err = e as Error & { issues?: Array<{ path: PropertyKey[]; message: string }> };
    const detail = err.issues?.length
      ? err.issues
          .slice(0, 3)
          .map((i) => `${i.path.map(String).join('.') || '(root)'}: ${i.message}`)
          .join('; ')
      : err.message;
    return { ok: false, error: detail };
  }
}

function countNodes(node: BlueprintNode): number {
  return 1 + (node.children ?? []).reduce((n, c) => n + countNodes(c), 0);
}

export function summarize(bp: ProjectBlueprint): ProjectSummary {
  return {
    id: bp.meta.id,
    name: bp.meta.name,
    slug: bp.meta.slug,
    createdAt: bp.meta.createdAt,
    updatedAt: bp.meta.updatedAt,
    schemaVersion: bp.schemaVersion,
    pageCount: bp.pages.length,
    nodeCount:
      bp.pages.reduce((n, p) => n + countNodes(p.rootNode), 0) +
      bp.layouts.reduce((n, l) => n + countNodes(l.rootNode), 0)
  };
}

// ---------------------------------------------------------------------------
// Low-level storage backends
// ---------------------------------------------------------------------------

interface Backend {
  get<T>(store: string, key: string): Promise<T | undefined>;
  getAll<T>(store: string): Promise<T[]>;
  put(store: string, value: unknown): Promise<void>;
  delete(store: string, key: string): Promise<void>;
}

function promisify<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error('IndexedDB request failed'));
  });
}

class IdbBackend implements Backend {
  private dbPromise: Promise<IDBDatabase>;

  constructor() {
    this.dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE_PROJECTS)) db.createObjectStore(STORE_PROJECTS, { keyPath: 'id' });
        if (!db.objectStoreNames.contains(STORE_SNAPSHOTS)) {
          const s = db.createObjectStore(STORE_SNAPSHOTS, { keyPath: 'id' });
          s.createIndex('projectId', 'projectId');
        }
        if (!db.objectStoreNames.contains(STORE_KV)) db.createObjectStore(STORE_KV, { keyPath: 'key' });
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error ?? new Error('Unable to open IndexedDB'));
      req.onblocked = () => reject(new Error('IndexedDB upgrade blocked by another open tab'));
    });
  }

  private async tx(store: string, mode: IDBTransactionMode): Promise<IDBObjectStore> {
    const db = await this.dbPromise;
    return db.transaction(store, mode).objectStore(store);
  }

  async get<T>(store: string, key: string): Promise<T | undefined> {
    return promisify((await this.tx(store, 'readonly')).get(key)) as Promise<T | undefined>;
  }

  async getAll<T>(store: string): Promise<T[]> {
    return promisify((await this.tx(store, 'readonly')).getAll()) as Promise<T[]>;
  }

  async put(store: string, value: unknown): Promise<void> {
    const os = await this.tx(store, 'readwrite');
    await promisify(os.put(value));
    await new Promise<void>((resolve, reject) => {
      os.transaction.oncomplete = () => resolve();
      os.transaction.onerror = () => reject(os.transaction.error ?? new Error('Write failed'));
      os.transaction.onabort = () =>
        reject(os.transaction.error ?? new Error('Write aborted (storage quota may be exceeded)'));
    });
  }

  async delete(store: string, key: string): Promise<void> {
    await promisify((await this.tx(store, 'readwrite')).delete(key));
  }
}

class MemoryBackend implements Backend {
  private stores = new Map<string, Map<string, unknown>>();
  private s(name: string) {
    if (!this.stores.has(name)) this.stores.set(name, new Map());
    return this.stores.get(name)!;
  }
  private keyOf(store: string, v: unknown): string {
    const r = v as Record<string, string>;
    return store === STORE_KV ? r.key : r.id;
  }
  async get<T>(store: string, key: string) {
    return structuredClone(this.s(store).get(key)) as T | undefined;
  }
  async getAll<T>(store: string) {
    return [...this.s(store).values()].map((v) => structuredClone(v)) as T[];
  }
  async put(store: string, value: unknown) {
    this.s(store).set(this.keyOf(store, value), structuredClone(value));
  }
  async delete(store: string, key: string) {
    this.s(store).delete(key);
  }
}

// ---------------------------------------------------------------------------
// Public store
// ---------------------------------------------------------------------------

export class ProjectStore {
  readonly durable: boolean;
  private backend: Backend;

  constructor(backend?: Backend) {
    if (backend) {
      this.backend = backend;
      this.durable = false;
    } else if (typeof indexedDB !== 'undefined') {
      this.backend = new IdbBackend();
      this.durable = true;
    } else {
      this.backend = new MemoryBackend();
      this.durable = false;
    }
  }

  static inMemory(): ProjectStore {
    return new ProjectStore(new MemoryBackend());
  }

  async listProjects(): Promise<ProjectSummary[]> {
    const records = await this.backend.getAll<ProjectRecord>(STORE_PROJECTS);
    return records
      .map(({ blueprint: _bp, ...summary }) => summary)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  async loadProject(id: string): Promise<LoadResult> {
    const record = await this.backend.get<ProjectRecord>(STORE_PROJECTS, id);
    if (!record) return { ok: false, error: 'Project not found' };
    const result = validateBlueprint(record.blueprint);
    if (!result.ok) {
      const quarantineKey = await this.quarantine(record.blueprint, `load:${id}: ${result.error}`);
      return { ...result, quarantineKey };
    }
    return result;
  }

  /** Persists a project. Throws if the browser refuses the write (e.g. quota exceeded). */
  async saveProject(blueprint: ProjectBlueprint): Promise<void> {
    const record: ProjectRecord = { ...summarize(blueprint), blueprint };
    await this.backend.put(STORE_PROJECTS, record);
  }

  async deleteProject(id: string): Promise<void> {
    await this.backend.delete(STORE_PROJECTS, id);
    for (const snap of await this.listSnapshots(id)) await this.backend.delete(STORE_SNAPSHOTS, snap.id);
  }

  async listSnapshots(projectId: string): Promise<SnapshotRecord[]> {
    const all = await this.backend.getAll<SnapshotRecord>(STORE_SNAPSHOTS);
    return all.filter((s) => s.projectId === projectId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async addSnapshot(blueprint: ProjectBlueprint, label: string): Promise<SnapshotRecord> {
    const snap: SnapshotRecord = {
      id: crypto.randomUUID(),
      projectId: blueprint.meta.id,
      label,
      createdAt: new Date().toISOString(),
      blueprint
    };
    await this.backend.put(STORE_SNAPSHOTS, snap);
    const existing = await this.listSnapshots(blueprint.meta.id);
    for (const old of existing.slice(MAX_SNAPSHOTS_PER_PROJECT)) await this.backend.delete(STORE_SNAPSHOTS, old.id);
    return snap;
  }

  async deleteSnapshot(id: string): Promise<void> {
    await this.backend.delete(STORE_SNAPSHOTS, id);
  }

  async getSetting<T>(key: string, schema: z.ZodType<T>): Promise<T | undefined> {
    const row = await this.backend.get<{ key: string; value: unknown }>(STORE_KV, key);
    if (!row) return undefined;
    const parsed = schema.safeParse(row.value);
    return parsed.success ? parsed.data : undefined;
  }

  async setSetting(key: string, value: unknown): Promise<void> {
    await this.backend.put(STORE_KV, { key, value });
  }

  async getFavorites(): Promise<string[] | undefined> {
    return this.getSetting('favorites', FavoritesSchema);
  }

  /** Loads saved symbols, silently dropping any individual entry that fails validation. */
  async getSymbols(): Promise<SavedSymbol[]> {
    const raw = await this.getSetting('symbols', z.array(z.unknown()));
    return (raw ?? []).flatMap((item) => {
      const parsed = SavedSymbolSchema.safeParse(item);
      return parsed.success ? [parsed.data] : [];
    });
  }

  /** Preserves unreadable data under a recovery key instead of letting it be overwritten. */
  async quarantine(raw: unknown, reason: string): Promise<string> {
    const key = `quarantine:${new Date().toISOString()}`;
    try {
      await this.backend.put(STORE_KV, { key, value: { reason, raw } });
    } catch {
      // Best effort: never let quarantine failure mask the original problem.
    }
    return key;
  }

  /**
   * One-time import of the legacy single-project localStorage format. Old keys are renamed
   * with a `-migrated` suffix (not deleted) so nothing is ever lost.
   */
  async importLegacyLocalStorage(): Promise<{ importedProjectId?: string; error?: string }> {
    if (typeof localStorage === 'undefined') return {};
    const out: { importedProjectId?: string; error?: string } = {};
    const retire = (key: string, value: string) => {
      try {
        localStorage.setItem(`${key}-migrated`, value);
        localStorage.removeItem(key);
      } catch {
        // If we cannot rename, leave the original in place.
      }
    };

    const rawBp = localStorage.getItem(LEGACY_KEYS.blueprint);
    if (rawBp) {
      const result = parseProjectFile(rawBp);
      if (result.ok) {
        await this.saveProject(result.blueprint);
        out.importedProjectId = result.blueprint.meta.id;
        retire(LEGACY_KEYS.blueprint, rawBp);
      } else {
        out.error = result.error;
        await this.quarantine(rawBp, `legacy-localStorage: ${result.error}`);
        retire(LEGACY_KEYS.blueprint, rawBp);
      }
    }

    const rawSnaps = localStorage.getItem(LEGACY_KEYS.snapshots);
    if (rawSnaps) {
      try {
        const list = JSON.parse(rawSnaps) as Array<{ label?: string; blueprint?: unknown }>;
        for (const item of Array.isArray(list) ? list : []) {
          const v = validateBlueprint(item?.blueprint);
          if (v.ok) await this.addSnapshot(v.blueprint, item.label || 'Imported snapshot');
        }
      } catch {
        // Corrupt legacy snapshots are skipped.
      }
      retire(LEGACY_KEYS.snapshots, rawSnaps);
    }

    for (const key of ['favorites', 'symbols'] as const) {
      const raw = localStorage.getItem(LEGACY_KEYS[key]);
      if (!raw) continue;
      try {
        await this.setSetting(key, JSON.parse(raw));
      } catch {
        // Ignore malformed legacy settings.
      }
      retire(LEGACY_KEYS[key], raw);
    }
    return out;
  }
}
