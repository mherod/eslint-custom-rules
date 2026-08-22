// Combined rule registry, derived from the category manifests.
//
// Each category entrypoint (src/<category>.ts) owns the canonical manifest
// for its rules; this module only merges the derived category rule maps so
// a rule registered in its manifest is automatically part of the combined
// plugin. Do not register rules here directly.
import { generalRules } from "../general";
import { reactRules } from "../react";
import { securityRules } from "../security";
import { typescriptRules } from "../typescript";
import { vueRules } from "../vue";

export const rules = {
  ...generalRules,
  ...reactRules,
  ...securityRules,
  ...typescriptRules,
  ...vueRules,
};
