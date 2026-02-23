// React/Next.js-specific rules plugin
import enforceAdminSeparation from "./rules/react/enforce-admin-separation";
import enforceComponentPatterns from "./rules/react/enforce-component-patterns";
import enforceServerClientSeparation from "./rules/react/enforce-server-client-separation";
import enforceUseServerVsServerOnly from "./rules/react/enforce-use-server-vs-server-only";
import noAsyncServerComponentInClient from "./rules/react/no-async-server-component-in-client";
import noConflictingDirectives from "./rules/react/no-conflicting-directives";
import noContextProviderInServerComponent from "./rules/react/no-context-provider-in-server-component";
import noDynamicTailwindClasses from "./rules/react/no-dynamic-tailwind-classes";
import noEventHandlersToClientProps from "./rules/react/no-event-handlers-to-client-props";
import noForceDynamic from "./rules/react/no-force-dynamic";
import noInternalFetchInServerComponent from "./rules/react/no-internal-fetch-in-server-component";
import noJsxLogicalAnd from "./rules/react/no-jsx-logical-and";
import noNonSerializableProps from "./rules/react/no-non-serializable-props";
import noParenthesizedUseCache from "./rules/react/no-parenthesized-use-cache";
import noReactHooksInServerComponent from "./rules/react/no-react-hooks-in-server-component";
import noReexportsInUseServer from "./rules/react/no-reexports-in-use-server";
import noRequestAccessInUseCache from "./rules/react/no-request-access-in-use-cache";
import noSequentialDataFetching from "./rules/react/no-sequential-data-fetching";
import noUnstableMathRandom from "./rules/react/no-unstable-math-random";
import noUseClientInLayout from "./rules/react/no-use-client-in-layout";
import noUseClientInPage from "./rules/react/no-use-client-in-page";
import noUseParamsInClientComponent from "./rules/react/no-use-params-in-client-component";
import noUseStateInAsyncComponent from "./rules/react/no-use-state-in-async-component";
import noWaterfallChains from "./rules/react/no-waterfall-chains";
import preferAsyncPageComponent from "./rules/react/prefer-async-page-component";
import preferAwaitParamsInPage from "./rules/react/prefer-await-params-in-page";
import preferCacheApi from "./rules/react/prefer-cache-api";
import preferLinkOverRouterPush from "./rules/react/prefer-link-over-router-push";
import preferNextNavigation from "./rules/react/prefer-next-navigation";
import preferReactDestructuredImports from "./rules/react/prefer-react-destructured-imports";
import preferReusableSwrHooks from "./rules/react/prefer-reusable-swr-hooks";
import preferSearchParamsOverState from "./rules/react/prefer-search-params-over-state";
import preferStartTransitionForServerActions from "./rules/react/prefer-start-transition-for-server-actions";
import preferUiPromiseHandling from "./rules/react/prefer-ui-promise-handling";
import preferUseHookForPromiseProps from "./rules/react/prefer-use-hook-for-promise-props";
import preferUseSwrOverFetch from "./rules/react/prefer-use-swr-over-fetch";
import preventEnvironmentPoisoning from "./rules/react/prevent-environment-poisoning";
import requireDirectiveFirst from "./rules/react/require-directive-first";
import requireUseClientForClientNamedFiles from "./rules/react/require-use-client-for-client-named-files";
import requireUseClientForReactHooks from "./rules/react/require-use-client-for-react-hooks";
import suggestServerComponentPages from "./rules/react/suggest-server-component-pages";
import useAfterForNonBlocking from "./rules/react/use-after-for-non-blocking";

export const reactRules = {
  "enforce-admin-separation": enforceAdminSeparation,
  "enforce-component-patterns": enforceComponentPatterns,
  "enforce-server-client-separation": enforceServerClientSeparation,
  "enforce-use-server-vs-server-only": enforceUseServerVsServerOnly,
  "no-async-server-component-in-client": noAsyncServerComponentInClient,
  "no-conflicting-directives": noConflictingDirectives,
  "no-context-provider-in-server-component": noContextProviderInServerComponent,
  "no-dynamic-tailwind-classes": noDynamicTailwindClasses,
  "no-event-handlers-to-client-props": noEventHandlersToClientProps,
  "no-force-dynamic": noForceDynamic,
  "no-internal-fetch-in-server-component": noInternalFetchInServerComponent,
  "no-jsx-logical-and": noJsxLogicalAnd,
  "no-non-serializable-props": noNonSerializableProps,
  "no-parenthesized-use-cache": noParenthesizedUseCache,
  "no-react-hooks-in-server-component": noReactHooksInServerComponent,
  "no-reexports-in-use-server": noReexportsInUseServer,
  "no-request-access-in-use-cache": noRequestAccessInUseCache,
  "no-sequential-data-fetching": noSequentialDataFetching,
  "no-unstable-math-random": noUnstableMathRandom,
  "no-use-client-in-layout": noUseClientInLayout,
  "no-use-client-in-page": noUseClientInPage,
  "no-use-params-in-client-component": noUseParamsInClientComponent,
  "no-use-state-in-async-component": noUseStateInAsyncComponent,
  "no-waterfall-chains": noWaterfallChains,
  "prefer-async-page-component": preferAsyncPageComponent,
  "prefer-await-params-in-page": preferAwaitParamsInPage,
  "prefer-cache-api": preferCacheApi,
  "prefer-link-over-router-push": preferLinkOverRouterPush,
  "prefer-next-navigation": preferNextNavigation,
  "prefer-react-destructured-imports": preferReactDestructuredImports,
  "prefer-search-params-over-state": preferSearchParamsOverState,
  "prefer-reusable-swr-hooks": preferReusableSwrHooks,
  "prefer-start-transition-for-server-actions":
    preferStartTransitionForServerActions,
  "prefer-ui-promise-handling": preferUiPromiseHandling,
  "prefer-use-swr-over-fetch": preferUseSwrOverFetch,
  "prefer-use-hook-for-promise-props": preferUseHookForPromiseProps,
  "prevent-environment-poisoning": preventEnvironmentPoisoning,
  "require-directive-first": requireDirectiveFirst,
  "require-use-client-for-client-named-files":
    requireUseClientForClientNamedFiles,
  "require-use-client-for-react-hooks": requireUseClientForReactHooks,
  "suggest-server-component-pages": suggestServerComponentPages,
  "use-after-for-non-blocking": useAfterForNonBlocking,
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
