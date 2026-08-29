const STORAGE_PREFIX = "reclaim";

export interface JsonStorage {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
}

export function buildStorageKey(thing: string, version = 1) {
  return `${STORAGE_PREFIX}:${thing}:v${version}`;
}

export function buildScopedStorageKey(
  thing: string,
  scope: string,
  version = 1,
) {
  return buildStorageKey(`${thing}:${scope}`, version);
}

function browserStorage(storage?: JsonStorage) {
  if (storage) return storage;
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function safeReadJson<T>(key: string, storage?: JsonStorage): T | null {
  try {
    const raw = browserStorage(storage)?.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function safeWriteJson(
  key: string,
  value: unknown,
  storage?: JsonStorage,
) {
  try {
    const target = browserStorage(storage);
    if (!target) return false;
    target.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}
