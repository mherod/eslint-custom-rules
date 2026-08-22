import { AST_NODE_TYPES, type TSESTree } from "@typescript-eslint/utils";

const SECRET_PATTERNS: readonly RegExp[] = [
  /^sk_[a-zA-Z0-9]{20,}$/, // Stripe secret keys
  /^[a-zA-Z0-9]{32,}$/, // Generic long alphanumeric (potential API keys)
  /^[A-Za-z0-9+/]{40,}={0,2}$/, // Base64 encoded secrets
  /^[0-9a-f]{32,}$/, // Hex encoded secrets
  /^ey[A-Za-z0-9+/=]+$/, // JWT tokens
];

export function isHardcodedSecret(value: string): boolean {
  if (value.length <= 20) {
    return false;
  }
  for (const pattern of SECRET_PATTERNS) {
    if (pattern.test(value)) {
      return true;
    }
  }
  return false;
}

const API_KEY_PATTERNS: readonly RegExp[] = [
  /^sk_/, // Stripe
  /^pk_/, // Public keys
  /^AIza/, // Google API keys
  /^ya29/, // Google OAuth tokens
  /^ghp_/, // GitHub tokens
  /^xoxb/, // Slack tokens
  /^[0-9a-f]{32}$/, // 32 character hex
  /^[A-Za-z0-9+/]{40,}={0,2}$/, // Base64 encoded
];

export function isApiKeyOrSecret(value: string): boolean {
  for (const pattern of API_KEY_PATTERNS) {
    if (pattern.test(value)) {
      return true;
    }
  }
  return false;
}

const SECRET_SUBSTRINGS: readonly string[] = [
  "secret",
  "key",
  "token",
  "password",
];

export function hasSecretInArguments(
  args: TSESTree.CallExpressionArgument[]
): boolean {
  return args.some((arg) => {
    if (arg.type !== AST_NODE_TYPES.Identifier) {
      return false;
    }
    const varName = arg.name.toLowerCase();
    for (const sub of SECRET_SUBSTRINGS) {
      if (varName.includes(sub)) {
        return true;
      }
    }
    return false;
  });
}

const WEAK_CRYPTO_FUNCTIONS = new Set(["md5", "sha1", "des", "rc4", "crc32"]);

export function isWeakCryptoFunction(functionName: string): boolean {
  return WEAK_CRYPTO_FUNCTIONS.has(functionName.toLowerCase());
}
