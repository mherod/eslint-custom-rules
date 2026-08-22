import {
  AST_NODE_TYPES,
  ESLintUtils,
  type TSESTree,
} from "@typescript-eslint/utils";
import { classifyBarrelImportSync } from "../utils/resect-sync-bridge";

export const RULE_NAME = "no-barrel-file-imports";

type MessageIds = "noBarrelImport";

type Options = [];

/**
 * Packages whose root entry point is a barrel file with thousands of re-exports.
 * Importing from the root causes 200-800ms cold start overhead per import.
 *
 * Not included here: packages that are explicitly designed for tree-shaking at
 * their root entry (e.g. lucide-react, @phosphor-icons/react, @headlessui/react,
 * @tabler/icons-react) — modern bundlers handle those correctly without any
 * special configuration.
 */
const BARREL_PACKAGES: ReadonlySet<string> = new Set([
  "@mui/material",
  "@mui/icons-material",
  "@mui/lab",
  "@mui/system",
  "@mui/joy",
  "react-icons",
  "react-icons/ai",
  "react-icons/bi",
  "react-icons/bs",
  "react-icons/cg",
  "react-icons/di",
  "react-icons/fa",
  "react-icons/fa6",
  "react-icons/fc",
  "react-icons/fi",
  "react-icons/gi",
  "react-icons/go",
  "react-icons/gr",
  "react-icons/hi",
  "react-icons/hi2",
  "react-icons/im",
  "react-icons/io",
  "react-icons/io5",
  "react-icons/lia",
  "react-icons/lu",
  "react-icons/md",
  "react-icons/pi",
  "react-icons/ri",
  "react-icons/rx",
  "react-icons/si",
  "react-icons/sl",
  "react-icons/tb",
  "react-icons/tfi",
  "react-icons/ti",
  "react-icons/vsc",
  "react-icons/wi",
  "ramda",
  "rxjs",
  "react-use",
]);

/**
 * Packages where subpath imports are already direct (safe).
 * A subpath import for these packages uses a path separator after the root.
 * e.g. `lodash/merge` or `date-fns/format` are already direct.
 *
 * We flag only the root-level barrel import form:
 *   import { X } from 'lucide-react'          <-- barrel (bad)
 *   import X from 'lucide-react/icons/check'   <-- direct (fine)
 */
const RADIX_BARREL_RE = /^@radix-ui\/react-[^/]+$/;

const TREE_SHAKEABLE_ROOT_PACKAGES: ReadonlySet<string> = new Set([
  "@headlessui/react",
  "@phosphor-icons/react",
  "@tabler/icons-react",
  "lucide-react",
]);

function isBarrelImport(source: string): boolean {
  // Exact match against the known barrel package set
  if (BARREL_PACKAGES.has(source)) {
    return true;
  }

  // @radix-ui/react-* (e.g. @radix-ui/react-dialog). Cheap startsWith gate
  // before paying for the regex — most imports don't begin with "@".
  return source.charCodeAt(0) === 64 /* '@' */ && RADIX_BARREL_RE.test(source);
}

function isPackageLikeSpecifier(source: string): boolean {
  return !(
    source.startsWith(".") ||
    source.startsWith("/") ||
    source.startsWith("@/") ||
    source.startsWith("~/") ||
    source.startsWith("#") ||
    source.startsWith("node:")
  );
}

export default ESLintUtils.RuleCreator.withoutDocs<Options, MessageIds>({
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Prevent importing from structurally detected barrel files of heavy packages to avoid loading thousands of unused modules",
    },
    fixable: "code",
    schema: [],
    messages: {
      noBarrelImport:
        "Avoid importing from the barrel entry of '{{package}}'. " +
        "Barrel imports load every re-exported module at once (up to 10,000 modules), " +
        "adding 200-800ms to cold start times and slowing down builds. " +
        "Fix option 1 — Add optimizePackageImports to next.config.js (easiest): " +
        "`experimental: { optimizePackageImports: ['{{package}}'] }` " +
        "then keep your existing import syntax unchanged. " +
        "Fix option 2 — Use direct subpath imports: " +
        "e.g. `import Check from 'lucide-react/dist/esm/icons/check'` " +
        "or `import Button from '@mui/material/Button'`. " +
        "Direct imports load only the modules you actually use.",
    },
  },
  defaultOptions: [],
  create(context) {
    return {
      ImportDeclaration(node: TSESTree.ImportDeclaration): void {
        // Only flag named imports (value imports with specifiers)
        // Default/namespace imports from barrel roots are already covered by other rules.
        if (node.importKind === "type") {
          return;
        }

        const source = node.source.value;

        if (
          TREE_SHAKEABLE_ROOT_PACKAGES.has(source) ||
          !isPackageLikeSpecifier(source)
        ) {
          return;
        }

        const structuralResult = classifyBarrelImportSync({
          filePath: context.filename,
          specifier: source,
        });

        if (!(structuralResult ?? isBarrelImport(source))) {
          return;
        }

        // Only flag when there are named specifiers — side-effect-only imports
        // (`import 'lucide-react'`) are a separate concern.
        let hasNamedSpecifiers = false;
        for (const s of node.specifiers) {
          if (s.type === AST_NODE_TYPES.ImportSpecifier) {
            hasNamedSpecifiers = true;
            break;
          }
        }

        if (!hasNamedSpecifiers) {
          return;
        }

        context.report({
          node,
          messageId: "noBarrelImport",
          data: {
            package: source,
          },
        });
      },
    };
  },
});
