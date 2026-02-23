import * as parser from "@typescript-eslint/parser";
import { RuleTester } from "@typescript-eslint/rule-tester";
import rule, { RULE_NAME } from "../no-debug-comments";

const ruleTester = new RuleTester({
  languageOptions: {
    parser,
    parserOptions: {
      ecmaVersion: 2020,
      sourceType: "module",
      ecmaFeatures: {
        jsx: true,
      },
    },
  },
});

ruleTester.run(RULE_NAME, rule, {
  valid: [
    {
      name: "Normal code comment",
      code: `
        // This function handles user authentication
        function authenticate() {}
      `,
    },
    {
      name: "TODO comment (allowed)",
      code: `
        // TODO: Add error handling
        function process() {}
      `,
    },
    {
      name: "FIXME comment (allowed)",
      code: `
        // FIXME: This needs optimization
        function calculate() {}
      `,
    },
    {
      name: "JSDoc comment with rest pattern (allowed in docs)",
      code: `
        /**
         * @example
         * // ... other fields
         */
        function example() {}
      `,
    },
    {
      name: "Normal inline comment",
      code: `
        const x = 1; // Set initial value
      `,
    },
    {
      name: "Technical decision comment",
      code: `
        // Using connection() to ensure dynamic rendering
        await connection();
      `,
    },
    {
      name: "Block comment with ellipsis (in JSDoc)",
      code: `
        /**
         * Example usage:
         * // ... rest of implementation
         */
        export function helper() {}
      `,
    },
    // --- Edge cases: False positive prevention ---
    {
      name: "False positive: Delete metadata (not DELETE ME)",
      code: `
        // Delete metadata from the response
        const data = response.metadata;
      `,
    },
    {
      name: "False positive: Remove method (not REMOVE ME)",
      code: `
        // Remove method called after processing
        array.remove(item);
      `,
    },
    {
      name: "False positive: Remove items from array",
      code: `
        // Remove items that don't match criteria
        const filtered = items.filter(Boolean);
      `,
    },
    {
      name: "False positive: Delete the record",
      code: `
        // Delete the record from database
        await db.delete(record);
      `,
    },
    {
      name: "False positive: Two question marks (ternary)",
      code: `
        // Use value ?? default for nullish coalescing
        const result = value ?? "default";
      `,
    },
    {
      name: "False positive: Single question mark",
      code: `
        // Is this value valid?
        return isValid(value);
      `,
    },
    {
      name: "False positive: BUT used in sentence (not But wait)",
      code: `
        // Returns true, but only for valid inputs
        return validate(input);
      `,
    },
    {
      name: "False positive: Contains 'think' in word",
      code: `
        // Rethink the approach later
        const result = process();
      `,
    },
    {
      name: "False positive: TODO without remove",
      code: `
        // TODO: Implement caching
        const data = fetchData();
      `,
    },
    {
      name: "False positive: FIXME without cleanup",
      code: `
        // FIXME: Handle edge case
        if (edge) handleEdge();
      `,
    },
    {
      name: "Block comment with debug-like content (allowed - only Line comments checked)",
      code: `
        /* DEBUG: This is in a block comment */
        const x = 1;
      `,
    },
    {
      name: "Block comment with thinking content (allowed - only Line comments checked)",
      code: `
        /* But wait, should this work? */
        function test() {}
      `,
    },
    {
      name: "Empty comment",
      code: `
        //
        const x = 1;
      `,
    },
    {
      name: "Whitespace-only comment",
      code: `
        //
        const x = 1;
      `,
    },
    {
      name: "URL with question marks",
      code: `
        // See https://example.com/page?foo=bar&baz=qux
        const api = fetchApi();
      `,
    },
    // --- Boundary: Tricky patterns that could cause false positives ---
    {
      name: "False positive: Thinking in past tense",
      code: `
        // I thought about this approach
        const result = process();
      `,
    },
    {
      name: "False positive: Question in middle of sentence",
      code: `
        // The API returns what? data
        const data = api.get();
      `,
    },
    {
      name: "False positive: Ellipsis at end (not followed by word)",
      code: `
        // This is incomplete...
        const x = 1;
      `,
    },
    {
      name: "False positive: Just ellipsis",
      code: `
        // ...
        const x = 1;
      `,
    },
    {
      name: "False positive: Temp in word (temperature)",
      code: `
        // Set temperature value
        const temp = getTemperature();
      `,
    },
    {
      name: "False positive: Debug in word (debugger)",
      code: `
        // Use the debugger tool
        const debug = getDebugger();
      `,
    },
    {
      name: "False positive: Hack in word (hackathon)",
      code: `
        // Created during hackathon
        const project = getProject();
      `,
    },
    {
      name: "False positive: Nullish coalescing discussion",
      code: `
        // Use ?? for nullish coalescing
        const value = x ?? "default";
      `,
    },
    {
      name: "False positive: Double question mark in code reference",
      code: `
        // The value ?? operator handles null and undefined
        const y = a ?? b;
      `,
    },
  ],
  invalid: [
    // Thinking comments
    {
      name: 'Thinking comment: "But wait"',
      code: `
        // But wait, this might cause issues
        const x = 1;
      `,
      errors: [{ messageId: "thinkingComment" }],
    },
    {
      name: 'Thinking comment: "Should I"',
      code: `
        // Should I use a different approach?
        function process() {}
      `,
      errors: [{ messageId: "thinkingComment" }],
    },
    {
      name: 'Thinking comment: "Maybe I"',
      code: `
        // Maybe I should refactor this
        const data = [];
      `,
      errors: [{ messageId: "thinkingComment" }],
    },
    {
      name: 'Thinking comment: "I think"',
      code: `
        // I think this is correct
        return result;
      `,
      errors: [{ messageId: "thinkingComment" }],
    },
    {
      name: 'Thinking comment: "I\'m not sure"',
      code: `
        // I'm not sure if this handles edge cases
        if (condition) {}
      `,
      errors: [{ messageId: "thinkingComment" }],
    },
    {
      name: 'Thinking comment: "I should probably"',
      code: `
        // I should probably add validation here
        const input = getData();
      `,
      errors: [{ messageId: "thinkingComment" }],
    },
    {
      name: 'Thinking comment: "I will just"',
      code: `
        // I will just use the existing approach for now
        doSomething();
      `,
      errors: [{ messageId: "thinkingComment" }],
    },
    {
      name: 'Thinking comment: "Is X static or dynamic?"',
      code: `
        // Is Home page static or dynamic?
        export default function Page() {}
      `,
      errors: [{ messageId: "thinkingComment" }],
    },
    {
      name: 'Thinking comment: "That contradicts"',
      code: `
        // That contradicts the ISR config
        export const revalidate = 900;
      `,
      errors: [{ messageId: "thinkingComment" }],
    },
    {
      name: 'Thinking comment: "Removed?"',
      code: `
        // Removed? If we use params, we can be static!
        await connection();
      `,
      errors: [{ messageId: "thinkingComment" }],
    },
    {
      name: "Thinking comment: !!??",
      code: `
        // But line 7: unstable_noStore() !!??
        unstable_noStore();
      `,
      errors: [{ messageId: "thinkingComment" }],
    },
    {
      name: "Thinking comment: multiple question marks (3+)",
      code: `
        // Why is this happening???
        const x = 1;
      `,
      errors: [{ messageId: "thinkingComment" }],
    },

    // Incomplete markers
    {
      name: 'Incomplete marker: "... rest of code"',
      code: `
        // ... rest of code uses searchParamsValue ...
        const result = process(searchParamsValue);
      `,
      errors: [{ messageId: "incompleteMarker" }],
    },
    {
      name: 'Incomplete marker: "Unused but"',
      code: `
        const { lang } = await params; // Unused but good to have
      `,
      errors: [{ messageId: "incompleteMarker" }],
    },
    {
      name: 'Incomplete marker: "Renamed to avoid"',
      code: `
        const searchParamsValue = await searchParams; // Renamed to avoid confusion
      `,
      errors: [{ messageId: "incompleteMarker" }],
    },
    {
      name: "Incomplete marker: HACK",
      code: `
        // HACK: This works around the race condition
        await delay(100);
      `,
      errors: [{ messageId: "incompleteMarker" }],
    },
    {
      name: "Incomplete marker: XXX",
      code: `
        // XXX: Fix this before release
        const data = unsafeOperation();
      `,
      errors: [{ messageId: "incompleteMarker" }],
    },

    // Debug comments
    {
      name: "Debug comment: DEBUG",
      code: `
        // DEBUG: checking if this runs
        console.log("test");
      `,
      errors: [{ messageId: "debugComment" }],
    },
    {
      name: "Debug comment: TEMP",
      code: `
        // TEMP: remove after testing
        const debug = true;
      `,
      errors: [{ messageId: "debugComment" }],
    },
    {
      name: "Debug comment: DELETE ME",
      code: `
        // DELETE ME
        const oldCode = "unused";
      `,
      errors: [{ messageId: "debugComment" }],
    },
    {
      name: "Debug comment: REMOVE ME",
      code: `
        // REMOVE ME after refactor
        function deprecatedHelper() {}
      `,
      errors: [{ messageId: "debugComment" }],
    },
    {
      name: "Debug comment: commented console.log",
      code: `
        // console.log('debugging', data);
        processData(data);
      `,
      errors: [{ messageId: "debugComment" }],
    },

    // Multiple violations
    {
      name: "Multiple violations in one file",
      code: `
        // But wait, should this be async?
        // ... rest of code handles the response
        // DEBUG: check if this works
        function handler() {
          return response;
        }
      `,
      errors: [
        { messageId: "thinkingComment" },
        { messageId: "incompleteMarker" },
        { messageId: "debugComment" },
      ],
    },

    // Real-world examples from apps/main-web/app/page.tsx (commit 66331d419)
    {
      name: "Real-world: Removed? questioning comment",
      code: `
        // unstable_noStore(); // Removed? If we use params, we can be static!
        await connection();
      `,
      errors: [{ messageId: "thinkingComment" }],
    },
    {
      name: "Real-world: But wait thinking comment",
      code: `
        // But wait, page.tsx uses connection() which forces dynamic.
        export default function Page() {}
      `,
      errors: [{ messageId: "thinkingComment" }],
    },
    {
      name: "Real-world: Is X static or dynamic?",
      code: `
        // Is Home page static or dynamic?
        // "Home page displaying curated content... Features partial pre-rendering and ISR".
        export default function Home() {}
      `,
      errors: [{ messageId: "thinkingComment" }],
    },
    {
      name: "Real-world: That contradicts",
      code: `
        // That contradicts ISR.
        export const revalidate = 900;
      `,
      errors: [{ messageId: "thinkingComment" }],
    },
    {
      name: "Real-world: I should probably",
      code: `
        // I should probably remove unstable_noStore() and connection() if I want static.
        await connection();
      `,
      errors: [{ messageId: "thinkingComment" }],
    },
    {
      name: "Real-world: I will just",
      code: `
        // I will just use params.lang and keep existing behavior for now, but remove detectLocale call.
        const { lang } = await params;
      `,
      errors: [{ messageId: "thinkingComment" }],
    },
    {
      name: "Real-world: !!?? confusion marker",
      code: `
        // But line 7: unstable_noStore() !!??
        unstable_noStore();
      `,
      errors: [{ messageId: "thinkingComment" }],
    },
    {
      name: "Real-world: ... rest of code marker",
      code: `
        const searchParamsValue = await searchParams;
        // ... rest of code uses searchParamsValue ...
        const result = process(searchParamsValue);
      `,
      errors: [{ messageId: "incompleteMarker" }],
    },
    {
      name: "Real-world: Unused but comment",
      code: `
        const { lang } = await params; // Unused but good to have
        return <Component />;
      `,
      errors: [{ messageId: "incompleteMarker" }],
    },
    {
      name: "Real-world: Renamed to avoid comment",
      code: `
        const searchParamsValue = await searchParams; // Renamed to avoid confusion
        const tab = getTabFromParams(searchParamsValue.tab);
      `,
      errors: [{ messageId: "incompleteMarker" }],
    },
    {
      name: "Real-world: Fallback shouldn't happen comment",
      code: `
        const { lang } = await params;
        // Fallback to default if undefined (shouldn't happen in [lang])
        return LocalizedPageMetadata.homeForLocale(lang || DEFAULT_LOCALE);
      `,
      errors: [{ messageId: "incompleteMarker" }],
    },
    {
      name: "Real-world: Multiple violations in generateMetadata",
      code: `
        // Opt out of static generation since detectLocale uses cookies() and headers()
        // unstable_noStore(); // Removed? If we use params, we can be static!
        // But wait, page.tsx uses connection() which forces dynamic.
        // I will just use params.lang and keep existing behavior for now
        await connection();
      `,
      errors: [
        { messageId: "thinkingComment" }, // Removed?
        { messageId: "thinkingComment" }, // But wait
        { messageId: "thinkingComment" }, // I will just
      ],
    },

    // --- Edge cases: Boundary testing ---
    {
      name: "Edge case: Case insensitive DEBUG",
      code: `
        // debug: checking values
        const x = 1;
      `,
      errors: [{ messageId: "debugComment" }],
    },
    {
      name: "Edge case: Mixed case DeBuG",
      code: `
        // DeBuG: mixed case
        const x = 1;
      `,
      errors: [{ messageId: "debugComment" }],
    },
    {
      name: "Edge case: Case insensitive TEMP",
      code: `
        // temp: lowercase temp
        const x = 1;
      `,
      errors: [{ messageId: "debugComment" }],
    },
    {
      name: "Edge case: Case insensitive TEMPORARY",
      code: `
        // Temporary: mixed case
        const x = 1;
      `,
      errors: [{ messageId: "debugComment" }],
    },
    {
      name: "Edge case: Lowercase delete me",
      code: `
        // delete me
        const x = 1;
      `,
      errors: [{ messageId: "debugComment" }],
    },
    {
      name: "Edge case: Lowercase remove me",
      code: `
        // remove me please
        const x = 1;
      `,
      errors: [{ messageId: "debugComment" }],
    },
    {
      name: "Edge case: Lowercase hack",
      code: `
        // hack: workaround
        const x = 1;
      `,
      errors: [{ messageId: "incompleteMarker" }],
    },
    {
      name: "Edge case: Lowercase xxx",
      code: `
        // xxx: fix later
        const x = 1;
      `,
      errors: [{ messageId: "incompleteMarker" }],
    },
    {
      name: "Edge case: Four question marks",
      code: `
        // What????
        const x = 1;
      `,
      errors: [{ messageId: "thinkingComment" }],
    },
    {
      name: "Edge case: Triple question marks with space",
      code: `
        // ???
        const x = 1;
      `,
      errors: [{ messageId: "thinkingComment" }],
    },
    {
      name: "Edge case: Triple question marks no space",
      code: `
        //???
        const x = 1;
      `,
      errors: [{ messageId: "thinkingComment" }],
    },
    {
      name: "Edge case: Many question marks",
      code: `
        // Really???????
        const x = 1;
      `,
      errors: [{ messageId: "thinkingComment" }],
    },
    {
      name: "Edge case: Exclamation then question marks !!?",
      code: `
        // Wait !!?
        const x = 1;
      `,
      errors: [{ messageId: "thinkingComment" }],
    },
    {
      name: "Edge case: Multiple exclamations and questions !!!???",
      code: `
        // No way !!!???
        const x = 1;
      `,
      errors: [{ messageId: "thinkingComment" }],
    },
    {
      name: "Edge case: Very long comment (truncation test)",
      code: `
        // DEBUG: This is a very long debug comment that exceeds fifty characters and should be truncated in the error message
        const x = 1;
      `,
      errors: [{ messageId: "debugComment" }],
    },
    {
      name: "Edge case: Ellipsis with single word",
      code: `
        // ... continued
        const x = 1;
      `,
      errors: [{ messageId: "incompleteMarker" }],
    },
    {
      name: "Edge case: Ellipsis at comment start",
      code: `
        // ...more code below
        const x = 1;
      `,
      errors: [{ messageId: "incompleteMarker" }],
    },
    {
      name: "Edge case: TODO: remove (specific variant)",
      code: `
        // TODO: remove this after refactor
        const x = 1;
      `,
      errors: [{ messageId: "incompleteMarker" }],
    },
    {
      name: "Edge case: FIXME: cleanup (specific variant)",
      code: `
        // FIXME: cleanup this mess
        const x = 1;
      `,
      errors: [{ messageId: "incompleteMarker" }],
    },
    {
      name: "Edge case: Commented console.log with arguments",
      code: `
        // console.log(user, data, response);
        processData();
      `,
      errors: [{ messageId: "debugComment" }],
    },
    {
      name: "Edge case: Commented console.log template literal",
      code: `
        // console.log(\`User: \${user.name}\`);
        processData();
      `,
      errors: [{ messageId: "debugComment" }],
    },
    {
      name: "Edge case: But wait at line start (case insensitive)",
      code: `
        // but wait, is this right?
        const x = 1;
      `,
      errors: [{ messageId: "thinkingComment" }],
    },
    {
      name: "Edge case: Should I at line start (case insensitive)",
      code: `
        // SHOULD I refactor?
        const x = 1;
      `,
      errors: [{ messageId: "thinkingComment" }],
    },
    {
      name: "Edge case: I think at line start (case insensitive)",
      code: `
        // I THINK this works
        const x = 1;
      `,
      errors: [{ messageId: "thinkingComment" }],
    },
    {
      name: "Edge case: Fallback with different text",
      code: `
        // Fallback to empty array if undefined (shouldn't happen)
        const items = data || [];
      `,
      errors: [{ messageId: "incompleteMarker" }],
    },
    {
      name: "Edge case: Unused but with different context",
      code: `
        // Unused but keeping for backwards compatibility
        const legacy = true;
      `,
      errors: [{ messageId: "incompleteMarker" }],
    },
  ],
});
