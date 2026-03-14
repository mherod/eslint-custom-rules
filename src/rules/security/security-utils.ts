export function isHardcodedSecret(value: string): boolean {
  const secretPatterns = [
    /^sk_[a-zA-Z0-9]{20,}$/, // Stripe secret keys
    /^[a-zA-Z0-9]{32,}$/, // Generic long alphanumeric (potential API keys)
    /^[A-Za-z0-9+/]{40,}={0,2}$/, // Base64 encoded secrets
    /^[0-9a-f]{32,}$/, // Hex encoded secrets
    /^ey[A-Za-z0-9+/=]+$/, // JWT tokens
  ];

  return (
    secretPatterns.some((pattern) => pattern.test(value)) && value.length > 20
  );
}

export function isWeakCryptoFunction(functionName: string): boolean {
  const weakFunctions = ["md5", "sha1", "des", "rc4", "crc32"];

  return weakFunctions.includes(functionName.toLowerCase());
}

export function isSqlFunction(functionName: string): boolean {
  const sqlFunctions = ["query", "execute", "raw", "sql", "exec"];

  return sqlFunctions.includes(functionName.toLowerCase());
}
