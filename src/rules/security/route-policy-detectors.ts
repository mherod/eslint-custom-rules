import type { TSESTree } from "@typescript-eslint/utils";

const PROTECTED_ROUTE_PATTERNS: readonly string[] = [
  "/admin/",
  "/dashboard/",
  "/profile/",
  "/settings/",
  "/account/",
  "/user/",
  "/private/",
  "/protected/",
];

export function isProtectedRoute(filename: string): boolean {
  for (const pattern of PROTECTED_ROUTE_PATTERNS) {
    if (filename.includes(pattern)) {
      return true;
    }
  }
  return false;
}

function bodyContainsKeywords(
  node: TSESTree.FunctionDeclaration,
  sourceCode: { getText(node: TSESTree.Node): string },
  keywords: readonly string[]
): boolean {
  const bodyText = sourceCode.getText(node.body);
  for (const keyword of keywords) {
    if (bodyText.includes(keyword)) {
      return true;
    }
  }
  return false;
}

const AUTH_KEYWORDS = ["auth", "verify", "authenticate", "authorize"] as const;

export function hasAuthValidation(
  node: TSESTree.FunctionDeclaration,
  sourceCode: { getText(node: TSESTree.Node): string }
): boolean {
  return bodyContainsKeywords(node, sourceCode, AUTH_KEYWORDS);
}

const RATE_LIMIT_KEYWORDS = ["rateLimit", "throttle", "limit"] as const;

export function hasRateLimit(
  node: TSESTree.FunctionDeclaration,
  sourceCode: { getText(node: TSESTree.Node): string }
): boolean {
  return bodyContainsKeywords(node, sourceCode, RATE_LIMIT_KEYWORDS);
}
