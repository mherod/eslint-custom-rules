import { RuleTester } from "@typescript-eslint/rule-tester";
import rule from "../no-unsafe-redirect";

const ruleTester = new RuleTester({
  languageOptions: {
    parserOptions: {
      ecmaVersion: 2021,
      sourceType: "module",
    },
  },
});

ruleTester.run("no-unsafe-redirect", rule, {
  valid: [
    // Static string literal — safe internal navigation
    'router.push("/dashboard");',
    'router.push("/caption", { scroll: false });',
    'router.replace("/");',

    // Template literal with no expressions — safe
    "router.push(`/settings`);",

    // withQuery with static first arg — safe URL builder
    'router.push(withQuery("/search", queryParams), { scroll: false });',
    'redirect(withQuery("/", queryParams));',

    // Server-side redirect with static path
    'redirect("/login");',
    'permanentRedirect("/new-path");',

    // Unrelated function calls — not redirect patterns
    'console.log("redirect");',
    'fetch("/api/redirect");',

    // Static location assignment — safe internal navigation
    'window.location.href = "/dashboard";',
    'location.href = "/home";',
    "window.location.href = `/settings`;",

    // Response/NextResponse redirect with static path — safe
    'Response.redirect("/login");',
    'NextResponse.redirect("/login");',
    'NextResponse.redirect(withQuery("/search", params));',
  ],
  invalid: [
    // User-controlled variable — unsafe
    {
      code: "router.push(userInput);",
      errors: [{ messageId: "noUnsafeRedirect" }],
    },
    {
      code: "router.replace(url);",
      errors: [{ messageId: "noUnsafeRedirect" }],
    },
    // redirect with variable — unsafe
    {
      code: "redirect(destination);",
      errors: [{ messageId: "noUnsafeRedirect" }],
    },
    {
      code: "permanentRedirect(nextUrl);",
      errors: [{ messageId: "noUnsafeRedirect" }],
    },
    // Template literal with expression — potentially unsafe
    {
      code: "router.push(`/path/${userInput}`);",
      errors: [{ messageId: "noUnsafeRedirect" }],
    },
    // withQuery with dynamic first arg — unsafe
    {
      code: "redirect(withQuery(baseUrl, params));",
      errors: [{ messageId: "noUnsafeRedirect" }],
    },
    // window.location.href = userInput — open redirect sink
    {
      code: "window.location.href = userInput;",
      errors: [{ messageId: "noUnsafeRedirect" }],
    },
    {
      code: "location.href = nextUrl;",
      errors: [{ messageId: "noUnsafeRedirect" }],
    },
    // window.location = userInput — direct navigation sink
    {
      code: "window.location = userInput;",
      errors: [{ messageId: "noUnsafeRedirect" }],
    },
    // Response/NextResponse.redirect with attacker-controlled URL
    {
      code: "Response.redirect(userInput);",
      errors: [{ messageId: "noUnsafeRedirect" }],
    },
    {
      code: "NextResponse.redirect(target);",
      errors: [{ messageId: "noUnsafeRedirect" }],
    },
    // Dynamic template literal assigned to location — unsafe
    {
      code: "window.location.href = `/go/${userInput}`;",
      errors: [{ messageId: "noUnsafeRedirect" }],
    },
  ],
});
