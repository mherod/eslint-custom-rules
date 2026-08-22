// React/Next.js-specific rules plugin
import { buildCategoryPlugin } from "./config-utils";
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

// Canonical manifest: one entry per rule holding identity + preset policy.
export const REACT_MANIFEST = {
  "enforce-admin-separation": {
    rule: enforceAdminSeparation,
    strict: "error",
  },
  "enforce-component-patterns": {
    recommended: "warn",
    rule: enforceComponentPatterns,
    strict: "error",
  },
  "enforce-server-client-separation": {
    recommended: "error",
    rule: enforceServerClientSeparation,
  },
  "enforce-use-server-vs-server-only": {
    recommended: "warn",
    rule: enforceUseServerVsServerOnly,
  },
  "no-async-server-component-in-client": {
    recommended: "error",
    rule: noAsyncServerComponentInClient,
  },
  "no-conflicting-directives": {
    recommended: "error",
    rule: noConflictingDirectives,
  },
  "no-context-provider-in-server-component": {
    recommended: "error",
    rule: noContextProviderInServerComponent,
  },
  "no-dynamic-tailwind-classes": {
    recommended: "warn",
    rule: noDynamicTailwindClasses,
    strict: "error",
  },
  "no-event-handlers-to-client-props": {
    recommended: "error",
    rule: noEventHandlersToClientProps,
  },
  "no-force-dynamic": { rule: noForceDynamic, strict: "warn" },
  "no-internal-fetch-in-server-component": {
    recommended: "warn",
    rule: noInternalFetchInServerComponent,
  },
  "no-jsx-logical-and": { rule: noJsxLogicalAnd, strict: "warn" },
  "no-lazy-state-init": { recommended: "warn", rule: noLazyStateInit },
  "no-non-serializable-props": {
    recommended: "error",
    rule: noNonSerializableProps,
  },
  "no-parenthesized-use-cache": {
    recommended: "error",
    rule: noParenthesizedUseCache,
  },
  "no-react-hooks-in-server-component": {
    recommended: "error",
    rule: noReactHooksInServerComponent,
  },
  "no-reexports-in-use-server": {
    recommended: "error",
    rule: noReexportsInUseServer,
  },
  "no-request-access-in-use-cache": {
    recommended: "error",
    rule: noRequestAccessInUseCache,
  },
  "no-sequential-data-fetching": {
    recommended: "warn",
    rule: noSequentialDataFetching,
  },
  "no-unstable-math-random": {
    recommended: "warn",
    rule: noUnstableMathRandom,
    strict: "error",
  },
  "no-use-client-in-layout": {
    recommended: "error",
    rule: noUseClientInLayout,
  },
  "no-use-client-in-page": { recommended: "error", rule: noUseClientInPage },
  "no-use-params-in-client-component": {
    recommended: "error",
    rule: noUseParamsInClientComponent,
  },
  "no-use-search-params-as-initial-state": {
    recommended: "error",
    rule: noUseSearchParamsAsInitialState,
  },
  "no-use-state-in-async-component": {
    recommended: "error",
    rule: noUseStateInAsyncComponent,
  },
  "no-usememo-for-primitives": {
    rule: noUseMemoForPrimitives,
    strict: "warn",
  },
  "no-waterfall-chains": { recommended: "warn", rule: noWaterfallChains },
  "prefer-async-page-component": {
    recommended: "warn",
    rule: preferAsyncPageComponent,
  },
  "prefer-await-params-in-page": {
    recommended: "error",
    rule: preferAwaitParamsInPage,
  },
  "prefer-cache-api": { recommended: "error", rule: preferCacheApi },
  "prefer-dynamic-import-for-heavy-libs": {
    rule: preferDynamicImportForHeavyLibs,
    strict: "warn",
  },
  "prefer-functional-setstate": {
    rule: preferFunctionalSetstate,
    strict: "warn",
  },
  "prefer-link-over-router-push": {
    rule: preferLinkOverRouterPush,
    strict: "warn",
  },
  "prefer-next-navigation": { rule: preferNextNavigation, strict: "warn" },
  "prefer-passive-event-listeners": {
    recommended: "warn",
    rule: preferPassiveEventListeners,
  },
  "prefer-promise-all-for-parallel-fetching": {
    rule: preferPromiseAllForParallelFetching,
    strict: "warn",
  },
  "prefer-react-destructured-imports": {
    recommended: "warn",
    rule: preferReactDestructuredImports,
    strict: "error",
  },
  "prefer-reusable-swr-hooks": {
    rule: preferReusableSwrHooks,
    strict: "warn",
  },
  "prefer-search-params-over-state": {
    recommended: "warn",
    rule: preferSearchParamsOverState,
  },
  "prefer-start-transition-for-server-actions": {
    rule: preferStartTransitionForServerActions,
    strict: "warn",
  },
  "prefer-ui-promise-handling": {
    rule: preferUiPromiseHandling,
    strict: "warn",
  },
  "prefer-use-hook-for-promise-props": {
    recommended: "warn",
    rule: preferUseHookForPromiseProps,
  },
  "prefer-use-swr-over-fetch": {
    rule: preferUseSwrOverFetch,
    strict: "warn",
  },
  "prevent-environment-poisoning": {
    recommended: "error",
    rule: preventEnvironmentPoisoning,
  },
  "require-directive-first": {
    recommended: "error",
    rule: requireDirectiveFirst,
  },
  "require-use-client-for-client-named-files": {
    rule: requireUseClientForClientNamedFiles,
    strict: "warn",
  },
  "require-use-client-for-react-hooks": {
    rule: requireUseClientForReactHooks,
    strict: "warn",
  },
  "suggest-server-component-pages": {
    rule: suggestServerComponentPages,
    strict: "warn",
  },
  "use-after-for-non-blocking": {
    rule: useAfterForNonBlocking,
    strict: "warn",
  },
} as const;

const assembly = buildCategoryPlugin("@mherod/react", REACT_MANIFEST);

export const REACT_RECOMMENDED_SEVERITIES = assembly.recommendedSeverities;
export const REACT_STRICT_SEVERITIES = assembly.strictSeverities;
export const reactRules = assembly.rules;
export const reactPlugin = assembly.plugin;
export const reactConfigs = assembly.configs;

export default reactPlugin;
