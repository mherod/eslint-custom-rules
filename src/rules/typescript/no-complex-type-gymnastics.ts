import {
  AST_NODE_TYPES,
  ESLintUtils,
  type TSESTree,
} from "@typescript-eslint/utils";

export const RULE_NAME = "no-complex-type-gymnastics";

type MessageIds = "typeNestingTooDeep";

export interface RuleOptions {
  maxDepth: number;
}

type Options = [RuleOptions];

const DEFAULT_MAX_DEPTH = 3;

/**
 * Recursively compute the maximum generic nesting depth of a type node.
 *
 * - TSTypeReference with typeArguments: +1 for the wrapper, then recurse into args
 * - TSTypeQuery (typeof X): +1, then recurse into the inner type if present
 * - TSUnionType / TSIntersectionType: max of members (horizontal branching, no extra depth)
 * - TSArrayType: recurse into elementType (array syntax doesn't add cognitive nesting)
 * - TSIndexedAccessType: recurse into both objectType and indexType
 * - Everything else: 0 (leaf)
 */
function computeTypeDepth(node: TSESTree.TypeNode): number {
  switch (node.type) {
    case AST_NODE_TYPES.TSTypeReference: {
      if (node.typeArguments && node.typeArguments.params.length > 0) {
        const maxArgDepth = Math.max(
          ...node.typeArguments.params.map(computeTypeDepth)
        );
        return 1 + maxArgDepth;
      }
      return 0;
    }

    case AST_NODE_TYPES.TSTypeQuery: {
      // typeof X — adds 1 level of indirection
      if (node.typeArguments && node.typeArguments.params.length > 0) {
        const maxArgDepth = Math.max(
          ...node.typeArguments.params.map(computeTypeDepth)
        );
        return 1 + maxArgDepth;
      }
      return 1;
    }

    case AST_NODE_TYPES.TSUnionType:
    case AST_NODE_TYPES.TSIntersectionType: {
      if (node.types.length === 0) {
        return 0;
      }
      return Math.max(...node.types.map(computeTypeDepth));
    }

    case AST_NODE_TYPES.TSArrayType: {
      return computeTypeDepth(node.elementType);
    }

    case AST_NODE_TYPES.TSIndexedAccessType: {
      return Math.max(
        computeTypeDepth(node.objectType),
        computeTypeDepth(node.indexType)
      );
    }

    default:
      return 0;
  }
}

export default ESLintUtils.RuleCreator.withoutDocs<Options, MessageIds>({
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Disallow overly complex type gymnastics with deeply nested utility types",
    },
    schema: [
      {
        type: "object",
        properties: {
          maxDepth: {
            type: "integer",
            minimum: 1,
            description:
              "Maximum allowed generic nesting depth before the rule reports",
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      typeNestingTooDeep:
        "Type nesting depth {{depth}} exceeds maximum of {{maxDepth}}. Extract a named type alias for readability.",
    },
  },
  defaultOptions: [{ maxDepth: DEFAULT_MAX_DEPTH }],
  create(context) {
    const options = context.options[0] || { maxDepth: DEFAULT_MAX_DEPTH };
    const { maxDepth } = options;

    function checkType(node: TSESTree.TypeNode): void {
      const depth = computeTypeDepth(node);
      if (depth >= maxDepth) {
        context.report({
          node,
          messageId: "typeNestingTooDeep",
          data: {
            depth: String(depth),
            maxDepth: String(maxDepth),
          },
        });
      }
    }

    return {
      // Type alias declarations: type X = Awaited<ReturnType<typeof fn>>;
      TSTypeAliasDeclaration(node: TSESTree.TSTypeAliasDeclaration): void {
        checkType(node.typeAnnotation);
      },

      // All type annotations (variable declarations, function params, return types)
      TSTypeAnnotation(node: TSESTree.TSTypeAnnotation): void {
        checkType(node.typeAnnotation);
      },
    };
  },
});
