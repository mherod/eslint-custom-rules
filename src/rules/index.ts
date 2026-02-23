// TypeScript rules

// General rules
import enforceFileNaming from "./general/enforce-file-naming";
import enforceImportOrder from "./general/enforce-import-order";
import noDebugComments from "./general/no-debug-comments";
import noDeprecatedDeclarations from "./general/no-deprecated-declarations";
import noImportTypeQueries from "./general/no-import-type-queries";
import noLongRelativeImports from "./general/no-long-relative-imports";
import preferDateFns from "./general/prefer-date-fns";
import preferDateFnsOverDateOperations from "./general/prefer-date-fns-over-date-operations";
import preferDirectImports from "./general/prefer-direct-imports";
import preferLodashEsImports from "./general/prefer-lodash-es-imports";
import preferLodashUniqOverSet from "./general/prefer-lodash-uniq-over-set";
import preferUfoWithQuery from "./general/prefer-ufo-with-query";
import preferZodDefaultWithCatch from "./general/prefer-zod-default-with-catch";
import preferZodUrl from "./general/prefer-zod-url";
// React/Next.js rules
import enforceAdminSeparation from "./react/enforce-admin-separation";
import enforceComponentPatterns from "./react/enforce-component-patterns";
import enforceServerClientSeparation from "./react/enforce-server-client-separation";
import enforceUseServerVsServerOnly from "./react/enforce-use-server-vs-server-only";
import noAsyncServerComponentInClient from "./react/no-async-server-component-in-client";
import noConflictingDirectives from "./react/no-conflicting-directives";
import noContextProviderInServerComponent from "./react/no-context-provider-in-server-component";
import noDynamicTailwindClasses from "./react/no-dynamic-tailwind-classes";
import noEventHandlersToClientProps from "./react/no-event-handlers-to-client-props";
import noForceDynamic from "./react/no-force-dynamic";
import noInternalFetchInServerComponent from "./react/no-internal-fetch-in-server-component";
import noJsxLogicalAnd from "./react/no-jsx-logical-and";
import noLazyStateInit from "./react/no-lazy-state-init";
import noNonSerializableProps from "./react/no-non-serializable-props";
import noParenthesizedUseCache from "./react/no-parenthesized-use-cache";
import noReactHooksInServerComponent from "./react/no-react-hooks-in-server-component";
import noReexportsInUseServer from "./react/no-reexports-in-use-server";
import noRequestAccessInUseCache from "./react/no-request-access-in-use-cache";
import noSequentialDataFetching from "./react/no-sequential-data-fetching";
import noUseClientInLayout from "./react/no-use-client-in-layout";
import noUseClientInPage from "./react/no-use-client-in-page";
import noUseParamsInClientComponent from "./react/no-use-params-in-client-component";
import noUseSearchParamsAsInitialState from "./react/no-use-search-params-as-initial-state";
import noUseStateInAsyncComponent from "./react/no-use-state-in-async-component";
import noUseMemoForPrimitives from "./react/no-usememo-for-primitives";
import noWaterfallChains from "./react/no-waterfall-chains";
import preferAsyncPageComponent from "./react/prefer-async-page-component";
import preferAwaitParamsInPage from "./react/prefer-await-params-in-page";
import preferCacheApi from "./react/prefer-cache-api";
import preferDynamicImportForHeavyLibs from "./react/prefer-dynamic-import-for-heavy-libs";
import preferLinkOverRouterPush from "./react/prefer-link-over-router-push";
import preferNextNavigation from "./react/prefer-next-navigation";
import preferPromiseAllForParallelFetching from "./react/prefer-promise-all-for-parallel-fetching";
import preferReactDestructuredImports from "./react/prefer-react-destructured-imports";
import preferReusableSwrHooks from "./react/prefer-reusable-swr-hooks";
import preferSearchParamsOverState from "./react/prefer-search-params-over-state";
import preferStartTransitionForServerActions from "./react/prefer-start-transition-for-server-actions";
import preferUiPromiseHandling from "./react/prefer-ui-promise-handling";
import preferUseHookForPromiseProps from "./react/prefer-use-hook-for-promise-props";
import preferUseSwrOverFetch from "./react/prefer-use-swr-over-fetch";
import preventEnvironmentPoisoning from "./react/prevent-environment-poisoning";
import requireDirectiveFirst from "./react/require-directive-first";
import requireUseClientForClientNamedFiles from "./react/require-use-client-for-client-named-files";
import requireUseClientForReactHooks from "./react/require-use-client-for-react-hooks";
import suggestServerComponentPages from "./react/suggest-server-component-pages";
import useAfterForNonBlocking from "./react/use-after-for-non-blocking";
// Security rules
import enforceSecurityPatterns from "./security/enforce-security-patterns";
import noHardcodedSecrets from "./security/no-hardcoded-secrets";
import noLogSecrets from "./security/no-log-secrets";
import noSqlInjection from "./security/no-sql-injection";
import noUnsafeEval from "./security/no-unsafe-eval";
import noUnsafeInnerHTML from "./security/no-unsafe-inner-html";
import noUnsafeRedirect from "./security/no-unsafe-redirect";
import noUnsafeTemplateLiterals from "./security/no-unsafe-template-literals";
import noWeakCrypto from "./security/no-weak-crypto";
import requireAuthValidation from "./security/require-auth-validation";
import requireRateLimiting from "./security/require-rate-limiting";
import noUnstableMathRandom from "./shared/no-unstable-math-random";
import enforceApiPatterns from "./typescript/enforce-api-patterns";
import enforceDocumentation from "./typescript/enforce-documentation";
import enforceTypescriptPatterns from "./typescript/enforce-typescript-patterns";
import enforceZodSchemaNaming from "./typescript/enforce-zod-schema-naming";
import noEmptyFunctionImplementations from "./typescript/no-empty-function-implementations";

export const rules = {
  // General rules
  "no-debug-comments": noDebugComments,
  "no-deprecated-declarations": noDeprecatedDeclarations,
  "no-dynamic-tailwind-classes": noDynamicTailwindClasses,
  "no-import-type-queries": noImportTypeQueries,
  "no-long-relative-imports": noLongRelativeImports,
  // React/Next.js rules
  "no-async-server-component-in-client": noAsyncServerComponentInClient,
  "no-conflicting-directives": noConflictingDirectives,
  "no-context-provider-in-server-component": noContextProviderInServerComponent,
  "no-empty-function-implementations": noEmptyFunctionImplementations,
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
  "prefer-date-fns": preferDateFns,
  "prefer-date-fns-over-date-operations": preferDateFnsOverDateOperations,
  "prefer-direct-imports": preferDirectImports,
  "prefer-link-over-router-push": preferLinkOverRouterPush,
  "prefer-lodash-es-imports": preferLodashEsImports,
  "prefer-lodash-uniq-over-set": preferLodashUniqOverSet,
  "prefer-next-navigation": preferNextNavigation,
  "prefer-react-destructured-imports": preferReactDestructuredImports,
  "prefer-reusable-swr-hooks": preferReusableSwrHooks,
  "prefer-search-params-over-state": preferSearchParamsOverState,
  "prefer-start-transition-for-server-actions":
    preferStartTransitionForServerActions,
  "prefer-ufo-with-query": preferUfoWithQuery,
  "prefer-ui-promise-handling": preferUiPromiseHandling,
  "prefer-use-hook-for-promise-props": preferUseHookForPromiseProps,
  "prefer-use-swr-over-fetch": preferUseSwrOverFetch,
  "prefer-zod-default-with-catch": preferZodDefaultWithCatch,
  "prefer-zod-url": preferZodUrl,
  "prevent-environment-poisoning": preventEnvironmentPoisoning,
  "require-directive-first": requireDirectiveFirst,
  "require-use-client-for-client-named-files":
    requireUseClientForClientNamedFiles,
  "require-use-client-for-react-hooks": requireUseClientForReactHooks,
  // Enforce rules
  "enforce-admin-separation": enforceAdminSeparation,
  "enforce-api-patterns": enforceApiPatterns,
  "enforce-component-patterns": enforceComponentPatterns,
  "enforce-documentation": enforceDocumentation,
  "enforce-file-naming": enforceFileNaming,
  "enforce-import-order": enforceImportOrder,
  "enforce-security-patterns": enforceSecurityPatterns,
  "no-hardcoded-secrets": noHardcodedSecrets,
  "no-log-secrets": noLogSecrets,
  "no-sql-injection": noSqlInjection,
  "no-unsafe-eval": noUnsafeEval,
  "no-unsafe-innerHTML": noUnsafeInnerHTML,
  "no-unsafe-redirect": noUnsafeRedirect,
  "no-unsafe-template-literals": noUnsafeTemplateLiterals,
  "no-weak-crypto": noWeakCrypto,
  "require-auth-validation": requireAuthValidation,
  "require-rate-limiting": requireRateLimiting,
  "enforce-server-client-separation": enforceServerClientSeparation,
  "enforce-typescript-patterns": enforceTypescriptPatterns,
  "enforce-use-server-vs-server-only": enforceUseServerVsServerOnly,
  "enforce-zod-schema-naming": enforceZodSchemaNaming,
  "suggest-server-component-pages": suggestServerComponentPages,
  "use-after-for-non-blocking": useAfterForNonBlocking,
};

export type RuleNames = keyof typeof rules;
