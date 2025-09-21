// Test file that should NOT trigger errors (valid usage)
import "server-only";

// Server secret WITH server-only import (should NOT error)
const apiKey = process.env.API_SECRET_KEY;
const dbPassword = process.env.DATABASE_PASSWORD;

// Server-only module import WITH server-only import (should NOT error)
import fs from "node:fs";
import { createConnection } from "mysql2";

// Public environment variables (should NOT error)
const publicUrl = process.env.NEXT_PUBLIC_APP_URL;
const publicKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

export { apiKey, dbPassword, fs, createConnection, publicUrl, publicKey };
