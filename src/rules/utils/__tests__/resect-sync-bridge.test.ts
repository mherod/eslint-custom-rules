import { TextEncoder } from "node:util";
import { decodeBoundedPayload } from "../resect-sync-bridge";

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
