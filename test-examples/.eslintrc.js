module.exports = {
  parser: "@typescript-eslint/parser",
  plugins: ["@mherod/custom"],
  rules: {
    "@mherod/custom/prevent-environment-poisoning": "error",
    "@mherod/custom/no-use-state-in-async-component": "error",
  },
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: "module",
    ecmaFeatures: {
      jsx: true,
    },
  },
  env: {
    node: true,
    es6: true,
  },
};
