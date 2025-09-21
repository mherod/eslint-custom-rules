// Test file in lib directory to verify prevent-environment-poisoning rule
// This file should trigger ESLint errors

// Server secret without server-only import (should error)
const apiKey = process.env.API_SECRET_KEY;
const dbPassword = process.env.DATABASE_PASSWORD;

// Server-only module import without server-only import (should error)
import fs from "node:fs";
import { createConnection } from "mysql2";

// Browser-only hook without client-only import (should error)
export function useLocalStorageUtil() {
  return useLocalStorage("key", "defaultValue");
}

export function useWindowSizeUtil() {
  return useWindowSize();
}

// Bracket notation access to secrets (should error)
const _stripeSecret = process.env.STRIPE_SECRET_KEY;

export { apiKey, dbPassword, fs, createConnection };
