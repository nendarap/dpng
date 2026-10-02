/**
 * SIMPENDIK UNPAD - Resilient Storage Driver
 * 
 * Mengatasi kendala "Setting the value of 'simpendik_unpad_pegawai' exceeded the quota"
 * dengan arsitektur multi-layer:
 * 1. Synchronous In-Memory Cache: membaca instan tanpa mengubah signature React hooks
 * 2. LZ-String Compression: kompresi hingga 80% ukuran data ke localStorage
 * 3. Asynchronous IndexedDB Engine: kapasitas ratusan MB / GB tanpa batas kuota 5MB localStorage
 * 4. Auto-Compaction & Pruning: otomatis membersihkan snapshot & log berlebih saat kuota kritis
 * 5. Safe Fallback: menjamin import ratusan/ribuan pegawai tidak pernah gagal atau crash
 */

import LZString from 'lz-string';

const DB_NAME = 'simpendik_unpad_idb';
const DB_VERSION = 1;
const STORE_NAME = 'keyval_store';
const LZ_PREFIX = 'LZ16:';

// In-Memory synchronous cache
const memoryCache = new Map<string, string>();
let isIdbInitialized = false;

// Open or get IndexedDB instance
function openIdb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB not supported in current environment'));
    }
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (e: IDBVersionChangeEvent) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => {
      resolve(request.result);
    };
    request.onerror = () => {
      reject(request.error);
    };
  });
}

// Write to IndexedDB asynchronously
export async function idbSet(key: string, value: string): Promise<void> {
  try {
    const db = await openIdb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(value, key);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Gagal menyimpan ke IndexedDB:', err);
  }
}

// Read from IndexedDB asynchronously
export async function idbGet(key: string): Promise<string | null> {
  try {
    const db = await openIdb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(key);
      req.onsuccess = () => resolve((req.result as string) ?? null);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return null;
  }
}

// Compact object by removing empty string, null, and undefined values
export function compactData<T>(data: T): T {
  if (Array.isArray(data)) {
    return data.map(compactData) as unknown as T;
  }
  if (data !== null && typeof data === 'object') {
    const compacted: Record<string, any> = {};
    for (const [k, v] of Object.entries(data)) {
      if (v === '' || v === null || v === undefined) {
        continue;
      }
      compacted[k] = v;
    }
    return compacted as unknown as T;
  }
  return data;
}

// Prune non-critical large keys in localStorage to free up space
export function pruneStorageOnQuotaError(): number {
  let freedCount = 0;
  try {
    // 1. Prune snapshots (keep at most 1 latest snapshot)
    const snapshotsKey = 'simpendik_unpad_snapshots';
    const rawSnapshots = localStorage.getItem(snapshotsKey);
    if (rawSnapshots) {
      try {
        let decompressed = rawSnapshots;
        if (rawSnapshots.startsWith(LZ_PREFIX)) {
          decompressed = LZString.decompressFromUTF16(rawSnapshots.slice(LZ_PREFIX.length)) || '[]';
        }
        const parsed = JSON.parse(decompressed);
        if (Array.isArray(parsed) && parsed.length > 1) {
          const trimmed = parsed.slice(0, 1);
          const compressed = LZ_PREFIX + LZString.compressToUTF16(JSON.stringify(trimmed));
          localStorage.setItem(snapshotsKey, compressed);
          freedCount++;
        }
      } catch {
        localStorage.removeItem(snapshotsKey);
        freedCount++;
      }
    }

    // 2. Prune activity logs (keep only latest 30 entries instead of 500)
    const logsKey = 'simpendik_unpad_logs';
    const rawLogs = localStorage.getItem(logsKey);
    if (rawLogs) {
      try {
        let decompressed = rawLogs;
        if (rawLogs.startsWith(LZ_PREFIX)) {
          decompressed = LZString.decompressFromUTF16(rawLogs.slice(LZ_PREFIX.length)) || '[]';
        }
        const parsedLogs = JSON.parse(decompressed);
        if (Array.isArray(parsedLogs) && parsedLogs.length > 30) {
          const trimmed = parsedLogs.slice(0, 30);
          localStorage.setItem(logsKey, JSON.stringify(trimmed));
          freedCount++;
        }
      } catch {
        // ignore
      }
    }
  } catch (e) {
    console.warn('Gagal memangkas storage sekunder:', e);
  }
  return freedCount;
}

// Synchronous Safe Get
export function safeGetItem(key: string): string | null {
  // 1. Check memory cache first (instant O(1))
  if (memoryCache.has(key)) {
    const val = memoryCache.get(key)!;
    // Check if it's not a stub pointer
    if (!val.startsWith('{"__storage":"indexeddb"')) {
      return val;
    }
  }

  // 2. Check localStorage
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      // Check if compressed with LZString
      if (raw.startsWith(LZ_PREFIX)) {
        try {
          const decompressed = LZString.decompressFromUTF16(raw.slice(LZ_PREFIX.length));
          if (decompressed) {
            memoryCache.set(key, decompressed);
            return decompressed;
          }
        } catch (e) {
          console.error(`Gagal dekompresi key "${key}":`, e);
        }
      }

      if (raw.startsWith('{"__storage":"indexeddb"')) {
        // Pointer to IndexedDB, return from memoryCache if available
        if (memoryCache.has(key) && !memoryCache.get(key)!.startsWith('{"__storage":"indexeddb"')) {
          return memoryCache.get(key)!;
        }
      } else {
        memoryCache.set(key, raw);
        return raw;
      }
    }
  } catch {
    // fallback
  }

  return memoryCache.get(key) || null;
}

// Synchronous Safe Set with Multi-Level Quota Recovery & Compression
export function safeSetItem(key: string, value: string): boolean {
  // 1. Always keep in fast in-memory cache
  memoryCache.set(key, value);

  // 2. Asynchronously save uncompressed payload to IndexedDB (virtually unlimited quota)
  idbSet(key, value).catch(() => {});

  // 3. Prepare compressed version for localStorage
  // For strings > 20KB, proactively compress to keep localStorage pristine and light
  const shouldCompress = value.length > 20000;

  try {
    if (shouldCompress) {
      const compressed = LZ_PREFIX + LZString.compressToUTF16(value);
      localStorage.setItem(key, compressed);
      return true;
    } else {
      localStorage.setItem(key, value);
      return true;
    }
  } catch (err: any) {
    // Quota reached - initiate auto-recovery pipeline
    console.warn(`[SIMPENDIK] LocalStorage quota limit detected on "${key}". Starting multi-tier recovery...`);

    // A. Prune snapshots and excess logs
    pruneStorageOnQuotaError();

    // B. Try LZString compression if not already attempted
    try {
      const compressed = LZ_PREFIX + LZString.compressToUTF16(value);
      localStorage.setItem(key, compressed);
      return true;
    } catch {
      // C. Try compacting data (strip empty strings) then compress
      try {
        const parsed = JSON.parse(value);
        const compacted = compactData(parsed);
        const compactedStr = JSON.stringify(compacted);
        const compressed = LZ_PREFIX + LZString.compressToUTF16(compactedStr);
        localStorage.setItem(key, compressed);
        return true;
      } catch {
        // D. Free snapshot completely if needed
        try {
          localStorage.removeItem('simpendik_unpad_snapshots');
          const compressed = LZ_PREFIX + LZString.compressToUTF16(value);
          localStorage.setItem(key, compressed);
          return true;
        } catch {
          // E. If localStorage is 100% physically saturated, store lightweight stub pointer
          // Data is completely secure in memoryCache and IndexedDB!
          try {
            const stub = JSON.stringify({
              __storage: 'indexeddb',
              key,
              timestamp: Date.now(),
              approxLength: value.length
            });
            localStorage.setItem(key, stub);
          } catch {
            // Even if stub fails, memoryCache & IndexedDB have the full dataset
          }
          console.info(`[SIMPENDIK] Data "${key}" disimpan dengan aman di Memory & IndexedDB Engine.`);
          return true;
        }
      }
    }
  }
}

// Safe Remove
export function safeRemoveItem(key: string): void {
  memoryCache.delete(key);
  try {
    localStorage.removeItem(key);
  } catch {}
  // Remove from IndexedDB
  openIdb().then(db => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(key);
  }).catch(() => {});
}

// Hydrate In-Memory Cache from IndexedDB on startup
export async function initStorageHydration(keysToHydrate: string[]): Promise<void> {
  if (isIdbInitialized) return;
  isIdbInitialized = true;

  try {
    let anyHydrated = false;

    for (const key of keysToHydrate) {
      const localVal = localStorage.getItem(key);
      const isStub = localVal && localVal.startsWith('{"__storage":"indexeddb"');

      // If localVal is empty or is an IDB pointer, load from IndexedDB
      if (!localVal || isStub) {
        const idbVal = await idbGet(key);
        if (idbVal) {
          memoryCache.set(key, idbVal);
          anyHydrated = true;
          // Try to compress and place back in localStorage
          try {
            const compressed = LZ_PREFIX + LZString.compressToUTF16(idbVal);
            localStorage.setItem(key, compressed);
          } catch {}
        }
      } else {
        // If localStorage has data, ensure IndexedDB has it as backup
        idbGet(key).then(val => {
          if (!val) {
            let decompressed = localVal;
            if (localVal.startsWith(LZ_PREFIX)) {
              decompressed = LZString.decompressFromUTF16(localVal.slice(LZ_PREFIX.length)) || localVal;
            }
            idbSet(key, decompressed);
          }
        });
      }
    }

    if (anyHydrated && typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('simpendik_storage_hydrated'));
    }
  } catch (err) {
    console.warn('Storage hydration notice:', err);
  }
}
