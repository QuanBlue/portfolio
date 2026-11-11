/**
 * Browser-side content store (IndexedDB). Holds the owner's edits so they can be
 * previewed instantly; export them as `content.json` to publish.
 */
import { defaultPortfolioData, mergePortfolioData, portfolioData } from '../data/portfolio';
import type { PortfolioData } from '../data/portfolio';
import { fetchRemote, isSupabaseConfigured } from './supabase';

const DB_NAME = 'portfolio-cms';
const STORE = 'kv';
const KEY = 'content';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function tx<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const req = fn(db.transaction(STORE, mode).objectStore(STORE));
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function loadStored(): Promise<Partial<PortfolioData> | null> {
  try {
    return ((await tx('readonly', (s) => s.get(KEY))) as Partial<PortfolioData>) ?? null;
  } catch {
    return null;
  }
}

export async function saveStored(data: PortfolioData): Promise<void> {
  await tx('readwrite', (s) => s.put(data, KEY));
}

export async function clearStored(): Promise<void> {
  await tx('readwrite', (s) => s.delete(KEY));
}

/**
 * Data shown to visitors: build-time data overlaid with Supabase (when configured),
 * otherwise with this browser's local edits.
 */
export async function loadLiveData(): Promise<PortfolioData> {
  let data: PortfolioData;
  try {
    let override: Partial<PortfolioData> | null = null;
    if (isSupabaseConfigured) {
      override = await fetchRemote();
      if (!override) {
        override = await loadStored();
      }
    } else {
      override = await loadStored();
    }
    data = mergePortfolioData(portfolioData, override);
    (window as any).__PORTFOLIO_OVERRIDE__ = override;
  } catch {
    data = portfolioData;
    (window as any).__PORTFOLIO_OVERRIDE__ = null;
  } finally {
    document.documentElement.classList.remove('cms-loading');
  }
  (window as any).__PORTFOLIO__ = data;
  return data;
}

/** Data the admin starts from: unpublished local draft if any, else the live data. */
export async function loadAdminData(): Promise<{ data: PortfolioData; fromDraft: boolean }> {
  const live = await (async () => {
    try {
      const remote = isSupabaseConfigured ? await fetchRemote() : null;
      return mergePortfolioData(portfolioData, remote);
    } catch {
      return portfolioData;
    }
  })();
  const draft = await loadStored();
  if (draft) {
    const mergedDraft = mergePortfolioData(live, draft);
    const isDifferent = JSON.stringify(mergedDraft) !== JSON.stringify(live);
    return { data: mergedDraft, fromDraft: isDifferent };
  }
  return { data: live, fromDraft: false };
}
export { defaultPortfolioData, portfolioData };

/** Resize + compress an image file to a JPEG/WebP data URL. */
export async function fileToDataUrl(file: File, maxDim = 1600, quality = 0.82): Promise<string> {
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, maxDim / Math.max(bmp.width, bmp.height));
  const w = Math.round(bmp.width * scale);
  const h = Math.round(bmp.height * scale);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(bmp, 0, 0, w, h);
  bmp.close();
  return canvas.toDataURL('image/jpeg', quality);
}

/** Same as fileToDataUrl but returns a JPEG Blob (for uploading to storage). */
export async function fileToBlob(file: File, maxDim = 1600, quality = 0.82): Promise<Blob> {
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, maxDim / Math.max(bmp.width, bmp.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bmp.width * scale);
  canvas.height = Math.round(bmp.height * scale);
  canvas.getContext('2d')!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
  bmp.close();
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('encode failed'))), 'image/jpeg', quality),
  );
}

/** Read a file as-is (keeps GIF animation). */
export function fileToRawDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });
}