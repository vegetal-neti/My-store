interface CacheItem<T> {
  data: T;
  timestamp: number;
}

export function saveToLocalCache<T>(key: string, data: T): void {
  try {
    const item: CacheItem<T> = {
      data,
      timestamp: Date.now()
    };
    localStorage.setItem(`shoplix_cache_${key}`, JSON.stringify(item));
  } catch (err) {
    console.warn(`Error saving to localStorage for key: ${key}`, err);
  }
}

export function getFromLocalCache<T>(key: string): CacheItem<T> | null {
  try {
    const raw = localStorage.getItem(`shoplix_cache_${key}`);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (err) {
    console.warn(`Error loading from localStorage for key: ${key}`, err);
    return null;
  }
}

export function getCacheDataIfValid<T>(key: string, ttlMs: number): T | null {
  const item = getFromLocalCache<T>(key);
  if (!item) return null;
  if (Date.now() - item.timestamp < ttlMs) {
    return item.data;
  }
  return null;
}
