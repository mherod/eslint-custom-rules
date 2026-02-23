import {
  AST_NODE_TYPES,
  ESLintUtils,
  type TSESTree,
} from "@typescript-eslint/utils";

export const RULE_NAME = "prefer-dynamic-import-for-heavy-libs";

type MessageIds = "preferDynamicImport";
type Options = [];

/**
 * Known heavy libraries that should be loaded dynamically using next/dynamic
 * when used as React components. These are visualization, editor, or map packages
 * that significantly bloat the initial bundle.
 */
const HEAVY_COMPONENT_PACKAGES: ReadonlySet<string> = new Set([
  // Charts / data visualization
  "recharts",
  "chart.js",
  "react-chartjs-2",
  "apexcharts",
  "react-apexcharts",
  "highcharts",
  "highcharts-react-official",
  "victory",
  "nivo",
  "@nivo/bar",
  "@nivo/line",
  "@nivo/pie",
  "@nivo/core",
  "visx",
  "@visx/shape",
  "@visx/group",
  "plotly.js",
  "react-plotly.js",
  "d3",
  "d3-scale",
  "d3-shape",
  "d3-axis",
  // Code editors
  "@monaco-editor/react",
  "monaco-editor",
  "@codemirror/view",
  "codemirror",
  "react-ace",
  "brace",
  "react-codemirror2",
  "@uiw/react-codemirror",
  // Maps
  "mapbox-gl",
  "react-map-gl",
  "leaflet",
  "react-leaflet",
  "@react-google-maps/api",
  "google-map-react",
  // Rich text editors
  "quill",
  "react-quill",
  "draft-js",
  "react-draft-wysiwyg",
  "@tiptap/react",
  "@tiptap/core",
  "slate",
  "slate-react",
  "tinymce",
  "@tinymce/tinymce-react",
  // PDF
  "pdfjs-dist",
  "react-pdf",
  // 3D / WebGL
  "three",
  "@react-three/fiber",
  "@react-three/drei",
  "babylon",
  "@babylonjs/core",
  // Video
  "video.js",
  "react-player",
  "hls.js",
  // Heavy UI
  "@fullcalendar/react",
  "@fullcalendar/core",
  "react-big-calendar",
]);

/**
 * Extracts the package root from an import path.
 * "@scope/pkg/sub" → "@scope/pkg", "pkg/sub" → "pkg"
 */
function getPackageRoot(importPath: string): string {
  if (importPath.startsWith("@")) {
    const parts = importPath.split("/");
    return parts.slice(0, 2).join("/");
  }
  return importPath.split("/")[0] ?? importPath;
}

export default ESLintUtils.RuleCreator.withoutDocs<Options, MessageIds>({
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Prefer next/dynamic for importing heavy component libraries to avoid including them in the initial bundle. This significantly improves initial page load performance.",
    },
    schema: [],
    messages: {
      preferDynamicImport:
        "'{{pkg}}' is a heavy library. Use `next/dynamic` to load it lazily and avoid bloating the initial bundle: `const Component = dynamic(() => import('{{source}}'))`.",
    },
  },
  defaultOptions: [],
  create(context) {
    return {
      ImportDeclaration(node: TSESTree.ImportDeclaration): void {
        const source = node.source.value;

        // Only check non-relative, non-builtin imports
        if (source.startsWith(".") || source.startsWith("node:")) {
          return;
        }

        // Skip next/dynamic itself
        if (source === "next/dynamic") {
          return;
        }

        const pkg = getPackageRoot(source);

        if (
          !(
            HEAVY_COMPONENT_PACKAGES.has(source) ||
            HEAVY_COMPONENT_PACKAGES.has(pkg)
          )
        ) {
          return;
        }

        // Only flag imports that include value specifiers (not type-only imports)
        if (node.importKind === "type") {
          return;
        }

        const hasValueSpecifiers = node.specifiers.some(
          (spec) =>
            spec.type !== AST_NODE_TYPES.ImportSpecifier ||
            spec.importKind !== "type"
        );

        if (!hasValueSpecifiers) {
          return;
        }

        context.report({
          node,
          messageId: "preferDynamicImport",
          data: {
            pkg,
            source,
          },
        });
      },
    };
  },
});
