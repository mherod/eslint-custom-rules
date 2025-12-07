// TypeScript rules

// General rules
import enforceFileNaming from "./general/enforce-file-naming";
import enforceImportOrder from "./general/enforce-import-order";
import preferDateFnsOverDateOperations from "./general/prefer-date-fns-over-date-operations";
// React/Next.js rules
import enforceAdminSeparation from "./react/enforce-admin-separation";
import enforceComponentPatterns from "./react/enforce-component-patterns";
import enforceServerClientSeparation from "./react/enforce-server-client-separation";
import noContextProviderInServerComponent from "./react/no-context-provider-in-server-component";
import noDynamicTailwindClasses from "./react/no-dynamic-tailwind-classes";
import noEventHandlersToClientProps from "./react/no-event-handlers-to-client-props";
import noInternalFetchInServerComponent from "./react/no-internal-fetch-in-server-component";
import noNonSerializableProps from "./react/no-non-serializable-props";
import noReactHooksInServerComponent from "./react/no-react-hooks-in-server-component";
import noSequentialDataFetching from "./react/no-sequential-data-fetching";
import noUnstableMathRandom from "./react/no-unstable-math-random";
import noUseClientInLayout from "./react/no-use-client-in-layout";
import noUseClientInPage from "./react/no-use-client-in-page";
import noUseParamsInClientComponent from "./react/no-use-params-in-client-component";
import noUseStateInAsyncComponent from "./react/no-use-state-in-async-component";
import preferAsyncPageComponent from "./react/prefer-async-page-component";
import preferAwaitParamsInPage from "./react/prefer-await-params-in-page";
import preferCacheApi from "./react/prefer-cache-api";
import preferLinkOverRouterPush from "./react/prefer-link-over-router-push";
import preferNextNavigation from "./react/prefer-next-navigation";
import preferReactDestructuredImports from "./react/prefer-react-destructured-imports";
import preferReusableSwrHooks from "./react/prefer-reusable-swr-hooks";
import preferUiPromiseHandling from "./react/prefer-ui-promise-handling";
import preferUseHookForPromiseProps from "./react/prefer-use-hook-for-promise-props";
import preferUseSwrOverFetch from "./react/prefer-use-swr-over-fetch";
import preventEnvironmentPoisoning from "./react/prevent-environment-poisoning";
import suggestServerComponentPages from "./react/suggest-server-component-pages";
// Security rules
import enforceSecurityPatterns from "./security/enforce-security-patterns";
import enforceApiPatterns from "./typescript/enforce-api-patterns";
import enforceDocumentation from "./typescript/enforce-documentation";
import enforceTypescriptPatterns from "./typescript/enforce-typescript-patterns";
import enforceZodSchemaNaming from "./typescript/enforce-zod-schema-naming";
import noEmptyFunctionImplementations from "./typescript/no-empty-function-implementations";
import preferLodashUniqOverSet from "./typescript/prefer-lodash-uniq-over-set";

export const rules = {
  "no-dynamic-tailwind-classes": noDynamicTailwindClasses,
  "no-context-provider-in-server-component": noContextProviderInServerComponent,
  "no-internal-fetch-in-server-component": noInternalFetchInServerComponent,
  "no-react-hooks-in-server-component": noReactHooksInServerComponent,
  "no-use-client-in-layout": noUseClientInLayout,
  "no-use-client-in-page": noUseClientInPage,
  "no-use-params-in-client-component": noUseParamsInClientComponent,
  "no-empty-function-implementations": noEmptyFunctionImplementations,
  "no-event-handlers-to-client-props": noEventHandlersToClientProps,
  "no-unstable-math-random": noUnstableMathRandom,
  "no-non-serializable-props": noNonSerializableProps,
  "no-sequential-data-fetching": noSequentialDataFetching,
  "no-use-state-in-async-component": noUseStateInAsyncComponent,
  "prefer-async-page-component": preferAsyncPageComponent,
  "prefer-await-params-in-page": preferAwaitParamsInPage,
  "prefer-cache-api": preferCacheApi,
  "prefer-date-fns-over-date-operations": preferDateFnsOverDateOperations,
  "prefer-link-over-router-push": preferLinkOverRouterPush,
  "prefer-lodash-uniq-over-set": preferLodashUniqOverSet,
  "prefer-next-navigation": preferNextNavigation,
  "prefer-react-destructured-imports": preferReactDestructuredImports,
  "prefer-reusable-swr-hooks": preferReusableSwrHooks,
  "prefer-use-swr-over-fetch": preferUseSwrOverFetch,
  "prefer-ui-promise-handling": preferUiPromiseHandling,
  "prefer-use-hook-for-promise-props": preferUseHookForPromiseProps,
  "prevent-environment-poisoning": preventEnvironmentPoisoning,
  "enforce-import-order": enforceImportOrder,
  "enforce-file-naming": enforceFileNaming,
  "enforce-server-client-separation": enforceServerClientSeparation,
  "enforce-component-patterns": enforceComponentPatterns,
  "enforce-admin-separation": enforceAdminSeparation,
  "enforce-api-patterns": enforceApiPatterns,
  "enforce-typescript-patterns": enforceTypescriptPatterns,
  "enforce-security-patterns": enforceSecurityPatterns,
  "enforce-documentation": enforceDocumentation,
  "enforce-zod-schema-naming": enforceZodSchemaNaming,
  "suggest-server-component-pages": suggestServerComponentPages,
};

export type RuleNames = keyof typeof rules;
