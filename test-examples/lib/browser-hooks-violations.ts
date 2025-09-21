// Test file for browser-only hooks without client-only import (should error)

// Browser-only hooks without client-only import (should error)
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
