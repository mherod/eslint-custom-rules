// Test file for browser-only hooks WITH client-only import (should NOT error)
import "client-only";

// Browser-only hooks WITH client-only import (should NOT error)
export function useLocalStorageUtil() {
  return useLocalStorage("key", "defaultValue");
}

export function useWindowSizeUtil() {
  return useWindowSize();
}

export function useClipboardUtil() {
  return useClipboard();
}

export function useMediaQueryUtil() {
  return useMediaQuery("(min-width: 768px)");
}
