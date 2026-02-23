// React/Next.js-specific rules plugin
import { prefixRules } from "./config-utils";
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
import noLazyStateInit from "./rules/react/no-lazy-state-init";
import noNonSerializableProps from "./rules/react/no-non-serializable-props";
import noParenthesizedUseCache from "./rules/react/no-parenthesized-use-cache";
import noReactHooksInServerComponent from "./rules/react/no-react-hooks-in-server-component";
import noReexportsInUseServer from "./rules/react/no-reexports-in-use-server";
import noRequestAccessInUseCache from "./rules/react/no-request-access-in-use-cache";
import noSequentialDataFetching from "./rules/react/no-sequential-data-fetching";
import noUseClientInLayout from "./rules/react/no-use-client-in-layout";
import noUseClientInPage from "./rules/react/no-use-client-in-page";
import noUseParamsInClientComponent from "./rules/react/no-use-params-in-client-component";
import noUseSearchParamsAsInitialState from "./rules/react/no-use-search-params-as-initial-state";
import noUseStateInAsyncComponent from "./rules/react/no-use-state-in-async-component";
import noUseMemoForPrimitives from "./rules/react/no-usememo-for-primitives";
import noWaterfallChains from "./rules/react/no-waterfall-chains";
import preferAsyncPageComponent from "./rules/react/prefer-async-page-component";
import preferAwaitParamsInPage from "./rules/react/prefer-await-params-in-page";
import preferCacheApi from "./rules/react/prefer-cache-api";
import preferDynamicImportForHeavyLibs from "./rules/react/prefer-dynamic-import-for-heavy-libs";
import preferFunctionalSetstate from "./rules/react/prefer-functional-setstate";
import preferLinkOverRouterPush from "./rules/react/prefer-link-over-router-push";
import preferNextNavigation from "./rules/react/prefer-next-navigation";
import preferPassiveEventListeners from "./rules/react/prefer-passive-event-listeners";
import preferPromiseAllForParallelFetching from "./rules/react/prefer-promise-all-for-parallel-fetching";
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
import noUnstableMathRandom from "./rules/shared/no-unstable-math-random";

// Rule severity maps -- single source of truth for both legacy and flat configs
export const REACT_RECOMMENDED_SEVERITIES = {
  "enforce-component-patterns": "warn",
  "enforce-server-client-separation": "error",
  "enforce-use-server-vs-server-only": "warn",
  "no-async-server-component-in-client": "error",
  "no-conflicting-directives": "error",
  "no-context-provider-in-server-component": "error",
  "no-dynamic-tailwind-classes": "warn",
  "no-event-handlers-to-client-props": "error",
  "no-internal-fetch-in-server-component": "warn",
  "no-lazy-state-init": "warn",
  "no-non-serializable-props": "error",
  "no-parenthesized-use-cache": "error",
  "no-react-hooks-in-server-component": "error",
  "no-reexports-in-use-server": "error",
  "no-request-access-in-use-cache": "error",
  "no-sequential-data-fetching": "warn",
  "no-unstable-math-random": "warn",
  "no-use-client-in-layout": "error",
  "no-use-client-in-page": "error",
  "no-use-params-in-client-component": "error",
  "no-use-search-params-as-initial-state": "error",
  "no-use-state-in-async-component": "error",
  "no-waterfall-chains": "warn",
  "prefer-async-page-component": "warn",
  "prefer-passive-event-listeners": "warn",
  "prefer-await-params-in-page": "error",
  "prefer-cache-api": "error",
  "prefer-react-destructured-imports": "warn",
  "prefer-search-params-over-state": "warn",
  "prefer-use-hook-for-promise-props": "warn",
  "prevent-environment-poisoning": "error",
  "require-directive-first": "error",
} as const;

export const REACT_STRICT_SEVERITIES = {
  ...REACT_RECOMMENDED_SEVERITIES,
  "enforce-admin-separation": "error",
  "enforce-component-patterns": "error",
  "no-dynamic-tailwind-classes": "error",
  "no-force-dynamic": "warn",
  "no-jsx-logical-and": "warn",
  "prefer-functional-setstate": "warn",
  "prefer-promise-all-for-parallel-fetching": "warn",
  "no-unstable-math-random": "error",
  "no-usememo-for-primitives": "warn",
  "prefer-dynamic-import-for-heavy-libs": "warn",
  "prefer-link-over-router-push": "warn",
  "prefer-next-navigation": "warn",
  "prefer-react-destructured-imports": "error",
  "prefer-reusable-swr-hooks": "warn",
  "prefer-start-transition-for-server-actions": "warn",
  "prefer-ui-promise-handling": "warn",
  "prefer-use-swr-over-fetch": "warn",
  "require-use-client-for-client-named-files": "warn",
  "require-use-client-for-react-hooks": "warn",
  "suggest-server-component-pages": "warn",
  "use-after-for-non-blocking": "warn",
} as const;

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
  "no-lazy-state-init": noLazyStateInit,
  "no-usememo-for-primitives": noUseMemoForPrimitives,
  "prefer-dynamic-import-for-heavy-libs": preferDynamicImportForHeavyLibs,
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
  "no-use-search-params-as-initial-state": noUseSearchParamsAsInitialState,
  "no-use-state-in-async-component": noUseStateInAsyncComponent,
  "no-waterfall-chains": noWaterfallChains,
  "prefer-async-page-component": preferAsyncPageComponent,
  "prefer-await-params-in-page": preferAwaitParamsInPage,
  "prefer-cache-api": preferCacheApi,
  "prefer-promise-all-for-parallel-fetching":
    preferPromiseAllForParallelFetching,
  "prefer-link-over-router-push": preferLinkOverRouterPush,
  "prefer-next-navigation": preferNextNavigation,
  "prefer-react-destructured-imports": preferReactDestructuredImports,
  "prefer-search-params-over-state": preferSearchParamsOverState,
  "prefer-reusable-swr-hooks": preferReusableSwrHooks,
  "prefer-start-transition-for-server-actions":
    preferStartTransitionForServerActions,
  "prefer-ui-promise-handling": preferUiPromiseHandling,
  "prefer-functional-setstate": preferFunctionalSetstate,
  "prefer-passive-event-listeners": preferPassiveEventListeners,
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

const REACT_PREFIX = "@mherod/react";

export const reactPlugin = {
  rules: reactRules,
  configs: {
    recommended: {
      plugins: [REACT_PREFIX],
      rules: prefixRules(REACT_RECOMMENDED_SEVERITIES, REACT_PREFIX),
    },
    strict: {
      plugins: [REACT_PREFIX],
      rules: prefixRules(REACT_STRICT_SEVERITIES, REACT_PREFIX),
    },
  },
};

// Support for flat config
export const reactConfigs = {
  recommended: {
    plugins: { [REACT_PREFIX]: reactPlugin },
    rules: prefixRules(REACT_RECOMMENDED_SEVERITIES, REACT_PREFIX),
  },
  strict: {
    plugins: { [REACT_PREFIX]: reactPlugin },
    rules: prefixRules(REACT_STRICT_SEVERITIES, REACT_PREFIX),
  },
};

export default reactPlugin;
