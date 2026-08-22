import { readFileSync } from "node:fs";
import path from "node:path";
import { TextEncoder } from "node:util";
import { BoundedResultCache } from "../bounded-result-cache";
import {
  buildExportOwnerCacheKey,
  decodeBoundedPayload,
  decodeBridgeResponse,
  getOrCreateCachedValue,
  writeBridgeDebug,
} from "../resect-sync-bridge";

const encoder = new TextEncoder();

function bufferWith(text: string, capacity: number): Uint8Array {
  const buffer = new Uint8Array(capacity);
  buffer.set(encoder.encode(text));
  return buffer;
}

describe("decodeBoundedPayload", () => {
  it("decodes exactly the published length", () => {
    const buffer = bufferWith("hello", 64);
    expect(decodeBoundedPayload(buffer, 5)).toBe("hello");
  });

  it("does not expose stale bytes when a short payload follows a long one", () => {
    const buffer = bufferWith('{"ok":true,"result":"long-stale-payload"}', 64);
    const shortPayload = '{"ok":true}';
    buffer.set(encoder.encode(shortPayload));

    expect(decodeBoundedPayload(buffer, shortPayload.length)).toBe(
      shortPayload
    );
  });

  it("rejects negative lengths", () => {
    const buffer = bufferWith("hello", 64);
    expect(decodeBoundedPayload(buffer, -1)).toBeNull();
  });

  it("rejects lengths larger than the buffer", () => {
    const buffer = bufferWith("hello", 64);
    expect(decodeBoundedPayload(buffer, 65)).toBeNull();
  });

  it("rejects non-integer lengths", () => {
    const buffer = bufferWith("hello", 64);
    expect(decodeBoundedPayload(buffer, 2.5)).toBeNull();
    expect(decodeBoundedPayload(buffer, Number.NaN)).toBeNull();
  });

  it("decodes an empty payload as an empty string", () => {
    const buffer = bufferWith("stale", 64);
    expect(decodeBoundedPayload(buffer, 0)).toBe("");
  });
});

describe("bridge debug output", () => {
  const originalDebugValue = process.env.RESECT_BRIDGE_DEBUG;

  afterEach(() => {
    jest.restoreAllMocks();
    if (originalDebugValue === undefined) {
      delete process.env.RESECT_BRIDGE_DEBUG;
    } else {
      process.env.RESECT_BRIDGE_DEBUG = originalDebugValue;
    }
  });

  it("keeps worker failures silent by default", () => {
    delete process.env.RESECT_BRIDGE_DEBUG;
    const writeSpy = jest
      .spyOn(process.stderr, "write")
      .mockImplementation(() => true);
    const response = decodeBridgeResponse<never>(
      '{"ok":false,"error":"worker import failed"}'
    );

    writeBridgeDebug(
      { filePath: "/project/src/example.ts", operation: "resolve-specifiers" },
      response.error ?? "unknown failure"
    );

    expect(response).toMatchObject({ handled: true, ok: false, result: null });
    expect(writeSpy).not.toHaveBeenCalled();
  });

  it("writes failed worker responses when debug mode is enabled", () => {
    process.env.RESECT_BRIDGE_DEBUG = "1";
    const writeSpy = jest
      .spyOn(process.stderr, "write")
      .mockImplementation(() => true);
    const response = decodeBridgeResponse<never>(
      '{"ok":false,"error":"worker import failed"}'
    );

    writeBridgeDebug(
      { filePath: "/project/src/example.ts", operation: "resolve-specifiers" },
      response.error ?? "unknown failure"
    );

    expect(writeSpy).toHaveBeenCalledWith(
      "[eslint-plugin-custom/resect-bridge] operation=resolve-specifiers " +
        "file=/project/src/example.ts error=worker import failed\n"
    );
  });
});

describe("bridge source safety", () => {
  it("keeps export-owner cache keys collision-safe", () => {
    expect(buildExportOwnerCacheKey("ab", "c")).not.toBe(
      buildExportOwnerCacheKey("a", "bc")
    );
    expect(buildExportOwnerCacheKey("ab", "c")).toBe("2:abc");
  });

  it("contains no literal control bytes", () => {
    const source = readFileSync(
      path.join(__dirname, "..", "resect-sync-bridge.ts"),
      "utf8"
    );

    const hasControlCharacter = Array.from(source).some((character) => {
      const codePoint = character.charCodeAt(0);
      return (
        codePoint <= 8 ||
        codePoint === 11 ||
        codePoint === 12 ||
        (codePoint >= 14 && codePoint <= 31) ||
        codePoint === 127
      );
    });

    expect(hasControlCharacter).toBe(false);
  });
});

describe("project analysis caching", () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it("builds once per project during the TTL window", async () => {
    jest.useFakeTimers();
    jest.setSystemTime(0);
    const cache = new BoundedResultCache<string>({
      maxEntries: 2,
      maxTotalBytes: 1000,
      ttlMs: 1000,
    });
    const build = jest.fn(async () => "cycle-analysis");

    await expect(
      getOrCreateCachedValue(cache, "/project/tsconfig.json", build)
    ).resolves.toBe("cycle-analysis");
    await expect(
      getOrCreateCachedValue(cache, "/project/tsconfig.json", build)
    ).resolves.toBe("cycle-analysis");
    expect(build).toHaveBeenCalledTimes(1);

    jest.setSystemTime(1001);
    await expect(
      getOrCreateCachedValue(cache, "/project/tsconfig.json", build)
    ).resolves.toBe("cycle-analysis");
    expect(build).toHaveBeenCalledTimes(2);
  });
});
