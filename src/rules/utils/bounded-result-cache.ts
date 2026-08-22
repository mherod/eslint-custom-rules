interface CacheEntry<TValue> {
  approximateBytes: number;
  expiresAt: number;
  value: TValue;
}

export interface BoundedResultCacheOptions {
  maxEntries: number;
  maxTotalBytes: number;
  ttlMs: number;
}

export function approximateValueBytes(key: string, value: unknown): number {
  let serializedLength = 0;
  try {
    serializedLength = JSON.stringify(value)?.length ?? 0;
  } catch {
    serializedLength = 0;
  }

  // UTF-16 code units are two bytes each; this is an upper-bound estimate.
  return (key.length + serializedLength) * 2;
}

/**
 * A small LRU cache with three independent bounds: a maximum entry count, an
 * approximate total byte budget, and a per-entry TTL.
 *
 * The TTL doubles as the invalidation strategy for derived project state:
 * results computed from tsconfig, workspace metadata, or the import graph
 * expire within `ttlMs`, so external edits to those inputs are picked up
 * without explicit file watching.
 */
export class BoundedResultCache<TValue> {
  private readonly entries = new Map<string, CacheEntry<TValue>>();
  private readonly options: BoundedResultCacheOptions;
  private totalBytes = 0;

  constructor(options: BoundedResultCacheOptions) {
    this.options = options;
  }

  get size(): number {
    return this.entries.size;
  }

  get approximateTotalBytes(): number {
    return this.totalBytes;
  }

  get(key: string): TValue | undefined {
    const entry = this.entries.get(key);
    if (!entry) {
      return;
    }

    if (entry.expiresAt <= Date.now()) {
      this.delete(key);
      return;
    }

    // Refresh recency: Map iteration order is insertion order.
    this.entries.delete(key);
    this.entries.set(key, entry);
    return entry.value;
  }

  set(key: string, value: TValue): void {
    this.delete(key);

    const approximateBytes = approximateValueBytes(key, value);
    if (approximateBytes > this.options.maxTotalBytes) {
      return;
    }

    this.entries.set(key, {
      approximateBytes,
      expiresAt: Date.now() + this.options.ttlMs,
      value,
    });
    this.totalBytes += approximateBytes;
    this.evictToBounds();
  }

  delete(key: string): void {
    const entry = this.entries.get(key);
    if (entry) {
      this.entries.delete(key);
      this.totalBytes -= entry.approximateBytes;
    }
  }

  clear(): void {
    this.entries.clear();
    this.totalBytes = 0;
  }

  private evictToBounds(): void {
    for (const key of this.entries.keys()) {
      if (
        this.entries.size <= this.options.maxEntries &&
        this.totalBytes <= this.options.maxTotalBytes
      ) {
        return;
      }

      this.delete(key);
    }
  }
}
