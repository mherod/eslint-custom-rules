import { defineConfig } from "tsup";

export default defineConfig({
  entry: [
    "src/index.ts",
    "src/typescript.ts",
    "src/react.ts",
    "src/vue.ts",
    "src/general.ts",
    "src/security.ts",
    "src/rules/**/!(*.test).ts",
  ],
  format: ["cjs", "esm"],
  dts: true,
  clean: true,
  sourcemap: true,
  splitting: false,
  minify: false,
  target: "node18",
  // Fix ESM compatibility issues - keep dependencies external
  external: [
    "@typescript-eslint/utils",
    "@typescript-eslint/parser",
    "eslint",
    "typescript",
  ],
});
