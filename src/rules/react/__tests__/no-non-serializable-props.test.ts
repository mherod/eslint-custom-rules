import { RuleTester } from "@typescript-eslint/rule-tester";
import rule from "../no-non-serializable-props";

const ruleTester = new RuleTester({
  languageOptions: {
    parser: require("@typescript-eslint/parser"),
    parserOptions: {
      ecmaVersion: 2021,
      sourceType: "module",
      ecmaFeatures: {
        jsx: true,
      },
    },
  },
});

ruleTester.run("no-non-serializable-props", rule, {
  valid: [
    // String prop — serializable
    {
      code: `<Component name="hello" />`,
    },
    // Number prop — serializable
    {
      code: "<Component count={42} />",
    },
    // Boolean prop — serializable
    {
      code: "<Component active={true} />",
    },
    // Array literal — serializable
    {
      code: "<Component items={[1, 2, 3]} />",
    },
    // Date prop with .toISOString() — safe
    {
      code: "<Component createdDate={user.createdAt.toISOString()} />",
    },
    // Date prop with .format() — safe (date-fns/moment)
    {
      code: `<Component startDate={date.format("YYYY-MM-DD")} />`,
    },
    // Date prop as template literal — safe
    {
      code: "<Component endDate={`${year}-${month}`} />",
    },
    // Non-date-named prop with variable — not flagged
    {
      code: "<Component title={pageTitle} />",
    },
  ],
  invalid: [
    // Arrow function prop
    {
      code: `<Component onClick={() => console.log("click")} />`,
      errors: [{ messageId: "functionProp" }],
    },
    // Function expression prop
    {
      code: "<Component onSubmit={function() { return true; }} />",
      errors: [{ messageId: "functionProp" }],
    },
    // Symbol() prop
    {
      code: `<Component id={Symbol("unique")} />`,
      errors: [{ messageId: "symbolProp" }],
    },
    // Symbol.for() prop
    {
      code: `<Component key={Symbol.for("shared")} />`,
      errors: [{ messageId: "symbolProp" }],
    },
    // new Date() prop
    {
      code: "<Component timestamp={new Date()} />",
      errors: [{ messageId: "nonSerializableProp" }],
    },
    // new Map() prop
    {
      code: "<Component data={new Map()} />",
      errors: [{ messageId: "nonSerializableProp" }],
    },
    // new Set() prop
    {
      code: "<Component tags={new Set()} />",
      errors: [{ messageId: "nonSerializableProp" }],
    },
    // new RegExp() prop
    {
      code: `<Component pattern={new RegExp("test")} />`,
      errors: [{ messageId: "nonSerializableProp" }],
    },
    // new Error() prop
    {
      code: `<Component error={new Error("fail")} />`,
      errors: [{ messageId: "nonSerializableProp" }],
    },
    // Date-named prop with variable (heuristic)
    {
      code: "<Component createdDate={user.createdAt} />",
      errors: [{ messageId: "nonSerializableProp" }],
    },
    // BigInt literal prop
    {
      code: "<Component value={42n} />",
      errors: [{ messageId: "bigintProp" }],
    },
    // Regex literal prop
    {
      code: "<Component pattern={/test/gi} />",
      errors: [{ messageId: "regexProp" }],
    },
    // new WeakMap() prop
    {
      code: "<Component cache={new WeakMap()} />",
      errors: [{ messageId: "nonSerializableProp" }],
    },
    // new WeakSet() prop
    {
      code: "<Component visited={new WeakSet()} />",
      errors: [{ messageId: "nonSerializableProp" }],
    },
    // new WeakRef() prop
    {
      code: "<Component ref={new WeakRef(target)} />",
      errors: [{ messageId: "nonSerializableProp" }],
    },
  ],
});
