import {
  ESLintUtils,
  type TSESLint,
  type TSESTree,
} from "@typescript-eslint/utils";

export const RULE_NAME = "enforce-import-order";

type MessageIds =
  | "wrongOrder"
  | "missingEmptyLine"
  | "extraEmptyLine"
  | "unsortedImports";

type Options = [];

type ImportGroup = {
  type: "external" | "internal" | "relative";
  imports: TSESTree.ImportDeclaration[];
  startLine: number;
  endLine: number;
};

export default ESLintUtils.RuleCreator.withoutDocs<Options, MessageIds>({
  meta: {
    type: "layout",
    docs: {
      description: "Enforce consistent import ordering and grouping",
    },
    fixable: "code",
    schema: [],
    messages: {
      wrongOrder:
        "Imports should be ordered: external packages, internal imports (@/*), relative imports",
      missingEmptyLine:
        "Missing empty line between {{currentGroup}} and {{nextGroup}} import groups",
      extraEmptyLine: "Extra empty line within {{group}} import group",
      unsortedImports: "{{group}} imports should be sorted alphabetically",
    },
  },
  defaultOptions: [],
  create(context) {
    const sourceCode = context.getSourceCode();
    const imports: TSESTree.ImportDeclaration[] = [];

    return {
      ImportDeclaration(node: TSESTree.ImportDeclaration): void {
        imports.push(node);
      },

      "Program:exit"(): void {
        if (imports.length < 2) {
          return;
        }

        // Group imports by type
        const groups = groupImports(imports);

        // Check group order
        validateGroupOrder(context, groups);

        // Check sorting within groups
        validateSortingWithinGroups(context, groups);

        // Check empty lines between groups
        validateEmptyLinesBetweenGroups(context, sourceCode, groups);
      },
    };
  },
});

function groupImports(imports: TSESTree.ImportDeclaration[]): ImportGroup[] {
  const groups: ImportGroup[] = [];
  let currentGroup: ImportGroup | null = null;

  for (const importNode of imports) {
    const importSource = importNode.source.value;
    const importType = getImportType(importSource);

    if (!currentGroup || currentGroup.type !== importType) {
      // Start new group
      if (currentGroup) {
        groups.push(currentGroup);
      }
      currentGroup = {
        type: importType,
        imports: [importNode],
        startLine: importNode.loc.start.line,
        endLine: importNode.loc.end.line,
      };
    } else {
      // Add to current group
      currentGroup.imports.push(importNode);
      currentGroup.endLine = importNode.loc.end.line;
    }
  }

  if (currentGroup) {
    groups.push(currentGroup);
  }

  return groups;
}

function getImportType(importSource: string): ImportGroup["type"] {
  if (typeof importSource !== "string") {
    return "external";
  }

  // Relative imports (start with . or ..)
  if (importSource.startsWith(".")) {
    return "relative";
  }

  // Internal imports (alias imports starting with @/)
  if (importSource.startsWith("@/")) {
    return "internal";
  }

  // External packages (node_modules)
  return "external";
}

function validateGroupOrder(
  context: Readonly<TSESLint.RuleContext<string, unknown[]>>,
  groups: ImportGroup[]
): void {
  const expectedOrder: ImportGroup["type"][] = [
    "external",
    "internal",
    "relative",
  ];

  const groupOrder = groups.map((g) => g.type);
  const sortedOrder = [...groupOrder].sort(
    (a, b) => expectedOrder.indexOf(a) - expectedOrder.indexOf(b)
  );

  if (JSON.stringify(groupOrder) !== JSON.stringify(sortedOrder)) {
    const firstImport = groups[0]?.imports[0];
    if (firstImport) {
      context.report({
        node: firstImport,
        messageId: "wrongOrder",
      });
    }
  }
}

function validateSortingWithinGroups(
  context: Readonly<TSESLint.RuleContext<string, unknown[]>>,
  groups: ImportGroup[]
): void {
  for (const group of groups) {
    const importSources = group.imports.map((imp) => imp.source.value);
    const sortedSources = [...importSources].sort();

    if (JSON.stringify(importSources) !== JSON.stringify(sortedSources)) {
      const firstImport = group.imports[0];
      if (firstImport) {
        context.report({
          node: firstImport,
          messageId: "unsortedImports",
          data: { group: group.type },
        });
      }
    }
  }
}

function validateEmptyLinesBetweenGroups(
  context: Readonly<TSESLint.RuleContext<string, unknown[]>>,
  _sourceCode: TSESLint.SourceCode,
  groups: ImportGroup[]
): void {
  for (let i = 0; i < groups.length - 1; i++) {
    const currentGroup = groups[i];
    const nextGroup = groups[i + 1];

    if (!(nextGroup?.startLine && currentGroup?.endLine)) {
      return;
    }

    const linesBetween = nextGroup.startLine - currentGroup.endLine - 1;

    // Should have exactly 1 empty line between different groups
    if (linesBetween !== 1) {
      if (linesBetween === 0) {
        const nextImport = nextGroup.imports[0];
        if (nextImport) {
          context.report({
            node: nextImport,
            messageId: "missingEmptyLine",
            data: {
              currentGroup: currentGroup.type,
              nextGroup: nextGroup.type,
            },
          });
        }
      } else if (linesBetween > 1) {
        const nextImport = nextGroup.imports[0];
        if (nextImport) {
          context.report({
            node: nextImport,
            messageId: "extraEmptyLine",
            data: { group: nextGroup.type },
          });
        }
      }
    }
  }
}
