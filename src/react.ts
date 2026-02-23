// React/Next.js-specific rules plugin
import enforceAdminSeparation from "./rules/react/enforce-admin-separation";
import enforceComponentPatterns from "./rules/react/enforce-component-patterns";
import enforceServerClientSeparation from "./rules/react/enforce-server-client-separation";
import noDynamicTailwindClasses from "./rules/react/no-dynamic-tailwind-classes";
import noEventHandlersToClientProps from "./rules/react/no-event-handlers-to-client-props";
import noNonSerializableProps from "./rules/react/no-non-serializable-props";
import noSequentialDataFetching from "./rules/react/no-sequential-data-fetching";
import noUnstableMathRandom from "./rules/react/no-unstable-math-random";
import noUseStateInAsyncComponent from "./rules/react/no-use-state-in-async-component";
import preferCacheApi from "./rules/react/prefer-cache-api";
import preferLinkOverRouterPush from "./rules/react/prefer-link-over-router-push";
import preferNextNavigation from "./rules/react/prefer-next-navigation";
import preferReactDestructuredImports from "./rules/react/prefer-react-destructured-imports";
import preferReusableSwrHooks from "./rules/react/prefer-reusable-swr-hooks";
import preferSearchParamsOverState from "./rules/react/prefer-search-params-over-state";
import preferUiPromiseHandling from "./rules/react/prefer-ui-promise-handling";
import preferUseHookForPromiseProps from "./rules/react/prefer-use-hook-for-promise-props";
import preferUseSwrOverFetch from "./rules/react/prefer-use-swr-over-fetch";
import preventEnvironmentPoisoning from "./rules/react/prevent-environment-poisoning";
import suggestServerComponentPages from "./rules/react/suggest-server-component-pages";

export const reactRules = {
  "enforce-admin-separation": enforceAdminSeparation,
  "enforce-component-patterns": enforceComponentPatterns,
  "enforce-server-client-separation": enforceServerClientSeparation,
  "no-dynamic-tailwind-classes": noDynamicTailwindClasses,
  "no-event-handlers-to-client-props": noEventHandlersToClientProps,
  "no-non-serializable-props": noNonSerializableProps,
  "no-sequential-data-fetching": noSequentialDataFetching,
  "no-unstable-math-random": noUnstableMathRandom,
  "no-use-state-in-async-component": noUseStateInAsyncComponent,
  "prefer-cache-api": preferCacheApi,
  "prefer-link-over-router-push": preferLinkOverRouterPush,
  "prefer-next-navigation": preferNextNavigation,
  "prefer-react-destructured-imports": preferReactDestructuredImports,
  "prefer-search-params-over-state": preferSearchParamsOverState,
  "prefer-reusable-swr-hooks": preferReusableSwrHooks,
  "prefer-ui-promise-handling": preferUiPromiseHandling,
  "prefer-use-swr-over-fetch": preferUseSwrOverFetch,
  "prefer-use-hook-for-promise-props": preferUseHookForPromiseProps,
  "prevent-environment-poisoning": preventEnvironmentPoisoning,
  "suggest-server-component-pages": suggestServerComponentPages,
};

export const reactPlugin = {
  rules: reactRules,
  configs: {
    recommended: {
      plugins: ["@mherod/react"],
      rules: {
        "@mherod/react/no-dynamic-tailwind-classes": "warn",
        "@mherod/react/no-event-handlers-to-client-props": "error",
        "@mherod/react/no-unstable-math-random": "warn",
        "@mherod/react/no-use-state-in-async-component": "error",
        "@mherod/react/no-non-serializable-props": "error",
        "@mherod/react/no-sequential-data-fetching": "warn",
        "@mherod/react/prefer-cache-api": "error",
        "@mherod/react/prevent-environment-poisoning": "error",
        "@mherod/react/enforce-server-client-separation": "error",
        "@mherod/react/enforce-component-patterns": "warn",
        "@mherod/react/prefer-react-destructured-imports": "warn",
        "@mherod/react/prefer-search-params-over-state": "warn",
        "@mherod/react/prefer-use-hook-for-promise-props": "warn",
      },
    },
    strict: {
      plugins: ["@mherod/react"],
      rules: {
        "@mherod/react/enforce-admin-separation": "error",
        "@mherod/react/enforce-component-patterns": "error",
        "@mherod/react/enforce-server-client-separation": "error",
        "@mherod/react/no-dynamic-tailwind-classes": "error",
        "@mherod/react/no-event-handlers-to-client-props": "error",
        "@mherod/react/no-unstable-math-random": "error",
        "@mherod/react/no-use-state-in-async-component": "error",
        "@mherod/react/no-non-serializable-props": "error",
        "@mherod/react/no-sequential-data-fetching": "warn",
        "@mherod/react/prefer-cache-api": "error",
        "@mherod/react/prefer-link-over-router-push": "warn",
        "@mherod/react/prefer-next-navigation": "warn",
        "@mherod/react/prefer-react-destructured-imports": "error",
        "@mherod/react/prefer-reusable-swr-hooks": "warn",
        "@mherod/react/prefer-ui-promise-handling": "warn",
        "@mherod/react/prefer-use-swr-over-fetch": "warn",
        "@mherod/react/prefer-use-hook-for-promise-props": "warn",
        "@mherod/react/prevent-environment-poisoning": "error",
        "@mherod/react/suggest-server-component-pages": "warn",
        "@mherod/react/prefer-search-params-over-state": "warn",
      },
    },
  },
};

// Support for flat config
export const reactConfigs = {
  recommended: {
    plugins: {
      "@mherod/react": reactPlugin,
    },
    rules: {
      "@mherod/react/no-dynamic-tailwind-classes": "warn",
      "@mherod/react/no-event-handlers-to-client-props": "error",
      "@mherod/react/no-unstable-math-random": "warn",
      "@mherod/react/no-use-state-in-async-component": "error",
      "@mherod/react/no-non-serializable-props": "error",
      "@mherod/react/no-sequential-data-fetching": "warn",
      "@mherod/react/prefer-cache-api": "error",
      "@mherod/react/prevent-environment-poisoning": "error",
      "@mherod/react/enforce-server-client-separation": "error",
      "@mherod/react/enforce-component-patterns": "warn",
      "@mherod/react/prefer-react-destructured-imports": "warn",
      "@mherod/react/prefer-search-params-over-state": "warn",
      "@mherod/react/prefer-use-hook-for-promise-props": "warn",
    },
  },
  strict: {
    plugins: {
      "@mherod/react": reactPlugin,
    },
    rules: {
      "@mherod/react/enforce-admin-separation": "error",
      "@mherod/react/enforce-component-patterns": "error",
      "@mherod/react/enforce-server-client-separation": "error",
      "@mherod/react/no-dynamic-tailwind-classes": "error",
      "@mherod/react/no-event-handlers-to-client-props": "error",
      "@mherod/react/no-unstable-math-random": "error",
      "@mherod/react/no-use-state-in-async-component": "error",
      "@mherod/react/no-non-serializable-props": "error",
      "@mherod/react/no-sequential-data-fetching": "warn",
      "@mherod/react/prefer-cache-api": "error",
      "@mherod/react/prefer-link-over-router-push": "warn",
      "@mherod/react/prefer-next-navigation": "warn",
      "@mherod/react/prefer-react-destructured-imports": "error",
      "@mherod/react/prefer-reusable-swr-hooks": "warn",
      "@mherod/react/prefer-search-params-over-state": "warn",
      "@mherod/react/prefer-ui-promise-handling": "warn",
      "@mherod/react/prefer-use-swr-over-fetch": "warn",
      "@mherod/react/prefer-use-hook-for-promise-props": "warn",
      "@mherod/react/prevent-environment-poisoning": "error",
      "@mherod/react/suggest-server-component-pages": "warn",
    },
  },
};

export default reactPlugin;
