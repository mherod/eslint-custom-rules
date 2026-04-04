const ZOD_METHODS = new Set([
  "string",
  "number",
  "boolean",
  "array",
  "object",
  "union",
  "intersection",
  "enum",
  "nativeEnum",
  "date",
  "promise",
  "any",
  "unknown",
  "never",
  "void",
  "undefined",
  "null",
  "literal",
  "tuple",
  "record",
  "map",
  "set",
  "function",
  "lazy",
  "effect",
  "custom",
  "optional",
  "nullable",
  "bigint",
  "symbol",
  "discriminatedUnion",
  "preprocess",
  "transform",
  "refine",
  "superRefine",
  "pipeline",
  "brand",
  "catch",
  "default",
  "describe",
  "readonly",
  "effects",
  "coerce",
]);

export function isZodMethod(name: string): boolean {
  return ZOD_METHODS.has(name);
}

function splitIdentifierParts(name: string): string[] {
  return name
    .replace(/schema$/iu, "")
    .replace(/([a-z0-9])([A-Z])/gu, "$1 $2")
    .split(/[^A-Za-z0-9]+/u)
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
}

export function toPascalCaseWithSchemaSuffix(name: string): string | null {
  const parts = splitIdentifierParts(name);

  if (parts.length === 0) {
    return null;
  }

  const pascalCase = parts
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");

  if (pascalCase.length === 0) {
    return null;
  }

  return `${pascalCase}Schema`;
}

export function isPascalCaseWithSchemaSuffix(name: string): boolean {
  if (!name.endsWith("Schema")) {
    return false;
  }

  if (name === "Schema") {
    return false;
  }

  return /^[A-Z][a-zA-Z0-9]*$/u.test(name);
}
