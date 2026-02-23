import {
  AST_NODE_TYPES,
  ESLintUtils,
  type TSESTree,
} from "@typescript-eslint/utils";

export const RULE_NAME = "no-unsafe-type-assertion";

type MessageIds =
  | "noIndexAccessCast"
  | "noObjectKeysKeyofCast"
  | "noParametersTypeofIndexed";

type Options = [];

/**
 * Returns true when a TSTypeReference refers to the `Record` utility type,
 * regardless of its type arguments. e.g. Record<string, unknown>.
 */
function isRecordTypeReference(typeNode: TSESTree.TypeNode): boolean {
  return (
    typeNode.type === AST_NODE_TYPES.TSTypeReference &&
    typeNode.typeName.type === AST_NODE_TYPES.Identifier &&
    typeNode.typeName.name === "Record"
  );
}

/**
 * Returns true when a type node is `(keyof typeof X)[]` — the pattern used to
 * cast Object.keys() results so bracket access compiles.
 *
 * AST shape:
 *   TSArrayType
 *     elementType: TSTypeOperator (operator: "keyof")
 *       typeAnnotation: TSTypeQuery   ← typeof X
 */
function isKeyofTypeofArray(typeNode: TSESTree.TypeNode): boolean {
  if (typeNode.type !== AST_NODE_TYPES.TSArrayType) {
    return false;
  }
  const { elementType } = typeNode;
  if (
    elementType.type !== AST_NODE_TYPES.TSTypeOperator ||
    elementType.operator !== "keyof"
  ) {
    return false;
  }
  return elementType.typeAnnotation?.type === AST_NODE_TYPES.TSTypeQuery;
}

/**
 * Returns true when a type node is `Array<keyof typeof X>` — alternate
 * spelling of the same pattern.
 *
 * AST shape:
 *   TSTypeReference (typeName: "Array")
 *     typeArguments[0]: TSTypeOperator (operator: "keyof")
 *       typeAnnotation: TSTypeQuery
 */
function isKeyofTypeofArrayGeneric(typeNode: TSESTree.TypeNode): boolean {
  if (typeNode.type !== AST_NODE_TYPES.TSTypeReference) {
    return false;
  }
  if (
    typeNode.typeName.type !== AST_NODE_TYPES.Identifier ||
    typeNode.typeName.name !== "Array"
  ) {
    return false;
  }
  const args = typeNode.typeArguments?.params;
  if (!args || args.length !== 1) {
    return false;
  }
  const arg = args[0];
  return (
    arg !== undefined &&
    arg.type === AST_NODE_TYPES.TSTypeOperator &&
    arg.operator === "keyof" &&
    arg.typeAnnotation?.type === AST_NODE_TYPES.TSTypeQuery
  );
}

/**
 * Returns true when a type node is `Parameters<typeof fn>[N]` or the
 * ReturnType/ConstructorParameters/InstanceType variants —
 * extracting a type from a value reference rather than naming it directly.
 *
 * AST shape:
 *   TSIndexedAccessType
 *     objectType: TSTypeReference { typeName: "Parameters" | "ReturnType" | … }
 *       typeArguments[0]: TSTypeQuery (typeof fn)
 *     indexType: TSLiteralType { literal: Literal (number) }
 *              | TSNumberKeyword   (rare, but defensive)
 */
const TYPEOF_UTILITY_TYPES = new Set([
  "Parameters",
  "ConstructorParameters",
  "ReturnType",
  "InstanceType",
  "Awaited",
]);

function isParametersTypeofIndexed(typeNode: TSESTree.TypeNode): boolean {
  if (typeNode.type !== AST_NODE_TYPES.TSIndexedAccessType) {
    return false;
  }
  const { objectType, indexType } = typeNode;
  // objectType must be Parameters<typeof fn> (or similar utility)
  if (objectType.type !== AST_NODE_TYPES.TSTypeReference) {
    return false;
  }
  if (
    objectType.typeName.type !== AST_NODE_TYPES.Identifier ||
    !TYPEOF_UTILITY_TYPES.has(objectType.typeName.name)
  ) {
    return false;
  }
  const args = objectType.typeArguments?.params;
  if (!args || args.length !== 1) {
    return false;
  }
  if (args[0]?.type !== AST_NODE_TYPES.TSTypeQuery) {
    return false;
  }
  // indexType must be a numeric literal (e.g. [0], [1], [2])
  return (
    indexType.type === AST_NODE_TYPES.TSLiteralType &&
    indexType.literal.type === AST_NODE_TYPES.Literal &&
    typeof indexType.literal.value === "number"
  );
}

/**
 * Returns true when the call expression is Object.keys/values/entries(…).
 */
function isObjectKeysValuesEntries(node: TSESTree.CallExpression): boolean {
  const { callee } = node;
  if (callee.type !== AST_NODE_TYPES.MemberExpression) {
    return false;
  }
  if (
    callee.object.type !== AST_NODE_TYPES.Identifier ||
    callee.object.name !== "Object"
  ) {
    return false;
  }
  if (callee.property.type !== AST_NODE_TYPES.Identifier) {
    return false;
  }
  return (
    callee.property.name === "keys" ||
    callee.property.name === "values" ||
    callee.property.name === "entries"
  );
}

export default ESLintUtils.RuleCreator.withoutDocs<Options, MessageIds>({
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Disallow type assertions used to bypass the type system for property access or Object.keys iteration",
    },
    schema: [],
    messages: {
      noIndexAccessCast:
        "Avoid `(expr as Record<string, ...>)[key]` to bypass the type system. " +
        "This silences a legitimate type error rather than fixing it. " +
        "Prefer: (1) add an index signature to the type, " +
        "(2) use a type guard or `in` check, or " +
        "(3) use `(Object.hasOwn(expr, key) ? expr[key as keyof typeof expr] : undefined)`.",

      noObjectKeysKeyofCast:
        "Avoid `Object.keys(x) as (keyof typeof x)[]`. " +
        "Object.keys() returns string[] by design — not (keyof T)[] — because the runtime " +
        "object may have extra keys the type doesn't know about (excess properties, " +
        "prototype chains, Proxy traps). Casting silences this intentional widening. " +
        "Prefer: (1) use a `for...in` loop with `Object.hasOwn` guard, " +
        "(2) cast at the use site with `key as keyof typeof x` so each access is explicit, or " +
        "(3) define a typed `typedKeys<T>(obj: T): (keyof T)[]` helper that makes the " +
        "unsoundness visible and centralised.",

      noParametersTypeofIndexed:
        "Avoid `{{utility}}<typeof {{fn}}>[{{index}}]` to extract a parameter type inline. " +
        "This is brittle: renaming the function, reordering its parameters, or changing its " +
        "signature silently breaks every site that indexes into Parameters<typeof fn>. " +
        "Prefer: extract and name the type explicitly — " +
        "`type MyParam = Parameters<typeof {{fn}}>[{{index}}]` at the declaration site, " +
        "then use `MyParam` directly — or refactor the function to accept a named options object.",
    },
  },
  defaultOptions: [],
  create(context) {
    return {
      /**
       * Detects: (expr as Record<string, ...>)[key]
       *
       * AST: MemberExpression (computed: true)
       *   object: TSAsExpression
       *     typeAnnotation: TSTypeReference { typeName: "Record" }
       */
      "MemberExpression[computed=true]"(node: TSESTree.MemberExpression): void {
        if (node.object.type !== AST_NODE_TYPES.TSAsExpression) {
          return;
        }
        const cast = node.object;
        if (!isRecordTypeReference(cast.typeAnnotation)) {
          return;
        }
        context.report({ node: cast, messageId: "noIndexAccessCast" });
      },

      /**
       * Detects: Object.keys(x) as (keyof typeof x)[]
       *          Object.keys(x) as Array<keyof typeof x>
       *
       * AST: TSAsExpression
       *   expression: CallExpression (Object.keys / .values / .entries)
       *   typeAnnotation: TSArrayType | TSTypeReference("Array")
       *     elementType/arg: TSTypeOperator("keyof") > TSTypeQuery
       */
      TSAsExpression(node: TSESTree.TSAsExpression): void {
        if (node.expression.type !== AST_NODE_TYPES.CallExpression) {
          return;
        }
        if (!isObjectKeysValuesEntries(node.expression)) {
          return;
        }
        if (
          isKeyofTypeofArray(node.typeAnnotation) ||
          isKeyofTypeofArrayGeneric(node.typeAnnotation)
        ) {
          context.report({ node, messageId: "noObjectKeysKeyofCast" });
        }
      },

      /**
       * Detects: Parameters<typeof fn>[0], ReturnType<typeof fn>, etc. used
       * as inline type annotations instead of named extracted types.
       *
       * AST: TSIndexedAccessType
       *   objectType: TSTypeReference { typeName: "Parameters" | … }
       *     typeArguments[0]: TSTypeQuery (typeof fn)
       *   indexType: TSLiteralType { literal: Literal (number) }
       */
      TSIndexedAccessType(node: TSESTree.TSIndexedAccessType): void {
        if (!isParametersTypeofIndexed(node)) {
          return;
        }
        // Safe to access: isParametersTypeofIndexed already validated the shape
        const objectType = node.objectType as TSESTree.TSTypeReference;
        const utilityName = (objectType.typeName as TSESTree.Identifier).name;
        const typeQuery = objectType.typeArguments?.params[0] as
          | TSESTree.TSTypeQuery
          | undefined;
        if (typeQuery === undefined) {
          return;
        }
        const fnName =
          typeQuery.exprName.type === AST_NODE_TYPES.Identifier
            ? typeQuery.exprName.name
            : context.sourceCode.getText(typeQuery.exprName);
        const indexLiteral = (node.indexType as TSESTree.TSLiteralType)
          .literal as TSESTree.Literal;
        context.report({
          node,
          messageId: "noParametersTypeofIndexed",
          data: {
            utility: utilityName,
            fn: fnName,
            index: String(indexLiteral.value),
          },
        });
      },
    };
  },
});
