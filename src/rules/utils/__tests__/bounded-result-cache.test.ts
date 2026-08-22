import { BoundedResultCache } from "../bounded-result-cache";

describe("BoundedResultCache", () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it("returns stored values before expiry", () => {
    const cache = new BoundedResultCache<string>({
      maxEntries: 10,
      maxTotalBytes: 10_000,
      ttlMs: 1000,
    });

    cache.set("a", "value-a");
    expect(cache.get("a")).toBe("value-a");
  });

  it("distinguishes cached null from a cache miss", () => {
    const cache = new BoundedResultCache<string | null>({
      maxEntries: 10,
      maxTotalBytes: 10_000,
      ttlMs: 1000,
    });

    cache.set("conservative", null);
    expect(cache.get("conservative")).toBeNull();
    expect(cache.get("missing")).toBeUndefined();
  });

  it("evicts the least recently used entry beyond maxEntries", () => {
    const cache = new BoundedResultCache<number>({
      maxEntries: 3,
      maxTotalBytes: 100_000,
      ttlMs: 60_000,
    });

    cache.set("a", 1);
    cache.set("b", 2);
    cache.set("c", 3);
    cache.get("a");
    cache.set("d", 4);

    expect(cache.get("b")).toBeUndefined();
    expect(cache.get("a")).toBe(1);
    expect(cache.get("c")).toBe(3);
    expect(cache.get("d")).toBe(4);
    expect(cache.size).toBe(3);
  });

  it("plateaus under sustained edit churn", () => {
    const cache = new BoundedResultCache<string>({
      maxEntries: 50,
      maxTotalBytes: 1_000_000,
      ttlMs: 60_000,
    });

    for (let revision = 0; revision < 5000; revision += 1) {
      cache.set(`file.ts::revision-${revision}`, `result-${revision}`);
    }

    expect(cache.size).toBeLessThanOrEqual(50);
    expect(cache.approximateTotalBytes).toBeLessThanOrEqual(1_000_000);
  });

  it("enforces the approximate byte budget", () => {
    const cache = new BoundedResultCache<string>({
      maxEntries: 1000,
      maxTotalBytes: 500,
      ttlMs: 60_000,
    });

    for (let index = 0; index < 100; index += 1) {
      cache.set(`key-${index}`, "x".repeat(50));
    }

    expect(cache.approximateTotalBytes).toBeLessThanOrEqual(500);
    expect(cache.size).toBeLessThan(100);
  });

  it("rejects single entries larger than the byte budget", () => {
    const cache = new BoundedResultCache<string>({
      maxEntries: 10,
      maxTotalBytes: 100,
      ttlMs: 60_000,
    });

    cache.set("huge", "x".repeat(1000));
    expect(cache.get("huge")).toBeUndefined();
    expect(cache.size).toBe(0);
  });

  it("expires entries after the TTL", () => {
    jest.useFakeTimers();
    jest.setSystemTime(0);

    const cache = new BoundedResultCache<string>({
      maxEntries: 10,
      maxTotalBytes: 10_000,
      ttlMs: 1000,
    });

    cache.set("a", "value-a");
    jest.setSystemTime(1001);
    expect(cache.get("a")).toBeUndefined();
    expect(cache.size).toBe(0);
  });

  it("clears all entries and byte accounting", () => {
    const cache = new BoundedResultCache<string>({
      maxEntries: 10,
      maxTotalBytes: 10_000,
      ttlMs: 1000,
    });

    cache.set("a", "value-a");
    cache.set("b", "value-b");
    cache.clear();

    expect(cache.size).toBe(0);
    expect(cache.approximateTotalBytes).toBe(0);
    expect(cache.get("a")).toBeUndefined();
  });
});
