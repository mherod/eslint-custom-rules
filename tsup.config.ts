import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    typescript: "src/typescript.ts",
    react: "src/react.ts",
    vue: "src/vue.ts",
    general: "src/general.ts",
    security: "src/security.ts",
  },
  format: ["cjs", "esm"],
  dts: true,
  clean: true,
  sourcemap: true,
  splitting: false,
  minify: false,
  target: "node18",
});
