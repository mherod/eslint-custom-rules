import { RuleTester } from "@typescript-eslint/rule-tester";
import rule from "../no-hardcoded-secrets";

const ruleTester = new RuleTester({
  languageOptions: {
    parser: require("@typescript-eslint/parser"),
    parserOptions: {
      ecmaVersion: 2021,
      sourceType: "module",
    },
  },
});

// Client component filename (includes "components/") — triggers isClientFile check
const CLIENT_FILE = "/src/components/Config.tsx";
// Server/utility file — not flagged by client-side check
const SERVER_FILE = "/src/lib/secret.ts";

ruleTester.run("no-hardcoded-secrets", rule, {
  valid: [
    // Environment variable access — no hardcoded literal
    {
      code: "const apiKey = process.env.API_KEY;",
      filename: SERVER_FILE,
    },
    // Short string — does not meet length threshold
    {
      code: `const name = "hello";`,
      filename: SERVER_FILE,
    },
    // URL with special characters — does not match alphanumeric/hex patterns
    {
      code: `const endpoint = "https://api.example.com/v1/data";`,
      filename: SERVER_FILE,
    },
    // Numeric literal — not a string, rule skips it
    {
      code: "const timeout = 5000;",
      filename: SERVER_FILE,
    },
    // Client file with env var — no literal, no secret
    {
      code: "const key = process.env.NEXT_PUBLIC_KEY;",
      filename: CLIENT_FILE,
    },
    // Client file with safe short string — too short to match any pattern
    {
      code: `const label = "Submit";`,
      filename: CLIENT_FILE,
    },
  ],
  invalid: [
    // Long alphanumeric string (32+ chars) — matches generic API key pattern
    {
      code: `const key = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdef1234";`,
      filename: SERVER_FILE,
      errors: [{ messageId: "noHardcodedSecrets" }],
      output: "const key = process.env.SECRET_KEY;",
    },
    // 32-char hex string — matches hex secret pattern
    {
      code: `const secret = "0123456789abcdef0123456789abcdef";`,
      filename: SERVER_FILE,
      errors: [{ messageId: "noHardcodedSecrets" }],
      output: "const secret = process.env.SECRET_KEY;",
    },
    // JWT-like token — matches ey... pattern
    {
      code: `const token = "eyJhbGciOiJIUzI1NiJ9somePayload";`,
      filename: SERVER_FILE,
      errors: [{ messageId: "noHardcodedSecrets" }],
      output: "const token = process.env.SECRET_KEY;",
    },
    // GitHub personal access token in client component — matches isApiKeyOrSecret
    {
      code: `const token = "ghp_SomeShortGitHubKey";`,
      filename: CLIENT_FILE,
      errors: [{ messageId: "noClientSideSecrets" }],
      output: "const token = process.env.TOKEN;",
    },
    // Stripe public key in client component — matches isApiKeyOrSecret
    {
      code: `const pk = "pk_live_test123456789";`,
      filename: CLIENT_FILE,
      errors: [{ messageId: "noClientSideSecrets" }],
      output: "const pk = process.env.PK;",
    },
  ],
});
