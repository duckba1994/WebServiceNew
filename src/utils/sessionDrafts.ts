// One tab, one account. Only registered UI state is stored; never credentials/files.
const STORAGE_KEY = 'app_session_draft_v1';
const MAX_AGE = 12 * 60 * 60 * 1000;
interface Entry { value: unknown; dirty: boolean }
interface Snapshot {
  version: 1;
  owner: string;
  path: string;
  suspended: boolean;
  updatedAt: number;
  entries: Record<string, Entry>;
}
let current: Snapshot | null = null;
let generation = 0;
const leases = new Map<string, symbol>();

function plain(value: unknown): unknown {
  if (value === null || typeof value === 'string' || typeof value === 'boolean' || typeof value === 'number') return value;
  if (Array.isArray(value)) return value.map(plain).filter(v => v !== undefined);
  if (value && typeof value === 'object' && Object.getPrototypeOf(value) === Object.prototype) {
    return Object.fromEntries(Object.entries(value).filter(([key]) => !/^(token|password|accessToken|refreshToken|canEdit|canEditAttachment|canAttach|availableActions)$/i.test(key))
      .map(([key, item]) => [key, plain(item)]).filter(([, item]) => item !== undefined));
  }
  return undefined; // File, Blob, DOM nodes, functions and other non-JSON state.
}

function persist() {
  try {
    if (current) sessionStorage.setItem(STORAGE_KEY, JSON.stringify(current));
    else sessionStorage.removeItem(STORAGE_KEY);
  } catch { /* In-memory recovery still works if browser storage is unavailable/full. */ }
}

function read(): Snapshot | null {
  if (current && Date.now() - current.updatedAt < MAX_AGE) return current;
  try {
    const saved = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || 'null') as Snapshot | null;
    if (saved?.version === 1 && typeof saved.owner === 'string' && saved.entries &&
        typeof saved.path === 'string' && Date.now() - saved.updatedAt < MAX_AGE) return saved;
  } catch { /* Ignore an invalid/older draft, never break login. */ }
  return null;
}

export function startDraftSession(owner: string, fromLogin = false): string | null {
  const saved = read();
  const reusable = saved?.owner === owner && (!fromLogin || saved.suspended);
  const resumePath = reusable && saved.suspended && /^\/(?!\/)/.test(saved.path) && saved.path !== '/login' ? saved.path : null;
  current = reusable ? { ...saved, suspended: false } : {
    version: 1, owner, path: '', suspended: false, updatedAt: Date.now(), entries: {},
  };
  generation++;
  leases.clear();
  persist();
  return resumePath;
}

export function suspendDraftSession(path: string) {
  if (!current || current.suspended || path === '/login') return;
  current.path = path;
  current.suspended = true;
  current.updatedAt = Date.now();
  persist();
}

export function clearDraftSession() {
  current = null;
  generation++;
  leases.clear();
  persist();
}

export const draftGeneration = () => generation;
export const readDraft = (key: string): Entry | undefined => current?.entries[key];
export function discardDraftScope(prefix: string) {
  if (!current || current.suspended) return;
  for (const key of Object.keys(current.entries)) {
    if (key.startsWith(`${prefix}/`)) delete current.entries[key];
  }
  persist();
}
export function writeDraft(key: string, value: unknown, dirty: boolean, version: number) {
  if (!current || current.suspended || version !== generation) return;
  const safe = plain(value);
  if (safe === undefined) return;
  current.entries[key] = { value: safe, dirty };
  current.updatedAt = Date.now();
  persist();
}

export function registerDraft(key: string, lease: symbol) { leases.set(key, lease); }
export function releaseDraft(key: string, lease: symbol, version: number) {
  // Delay cleanup so StrictMode's setup/cleanup/setup does not erase a live field.
  queueMicrotask(() => {
    if (!current || current.suspended || generation !== version || leases.get(key) !== lease) return;
    leases.delete(key);
    delete current.entries[key];
    persist();
  });
}
