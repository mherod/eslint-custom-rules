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
    // "use client" files — all prop types are valid (no RSC boundary)
    {
      code: `"use client";\nconst Foo = () => <Button onClick={() => {}} />;`,
    },
    {
      code: `"use client";\nconst Foo = () => <Input onChange={function() {}} />;`,
    },
    {
      code: `"use client";\nconst Foo = () => <Component timestamp={new Date()} />;`,
    },
    {
      code: `"use client";\nconst Foo = () => <Component data={new Map()} />;`,
    },
    {
      code: `"use client";\nconst Foo = () => <Component tags={new Set()} />;`,
    },
    {
      code: `"use client";\nconst Foo = () => <Component createdDate={user.createdAt} />;`,
    },
    {
      code: `"use client";\nconst Foo = () => <Component id={Symbol("unique")} />;`,
    },
    {
      code: `"use client";\nconst Foo = () => <Component value={42n} />;`,
    },
    {
      code: `"use client";\nconst Foo = () => <Component pattern={/test/gi} />;`,
    },
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
    // new Date() prop — auto-fixed to .toISOString()
    {
      code: "<Component timestamp={new Date()} />",
      output: "<Component timestamp={new Date().toISOString()} />",
      errors: [
        {
          messageId: "dateProp",
          suggestions: [
            {
              messageId: "datePropSuggestIso",
              output: "<Component timestamp={new Date().toISOString()} />",
            },
            {
              messageId: "datePropSuggestTime",
              output: "<Component timestamp={new Date().getTime()} />",
            },
          ],
        },
      ],
    },
    // new Date(arg) prop — auto-fixed to .toISOString()
    {
      code: `<Component timestamp={new Date("2024-01-01")} />`,
      output: `<Component timestamp={new Date("2024-01-01").toISOString()} />`,
      errors: [
        {
          messageId: "dateProp",
          suggestions: [
            {
              messageId: "datePropSuggestIso",
              output: `<Component timestamp={new Date("2024-01-01").toISOString()} />`,
            },
            {
              messageId: "datePropSuggestTime",
              output: `<Component timestamp={new Date("2024-01-01").getTime()} />`,
            },
          ],
        },
      ],
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
    // Date-named prop with variable (heuristic) — suggestion fixes
    {
      code: "<Component createdDate={user.createdAt} />",
      errors: [
        {
          messageId: "dateProp",
          suggestions: [
            {
              messageId: "datePropSuggestIso",
              output:
                "<Component createdDate={user.createdAt.toISOString()} />",
            },
            {
              messageId: "datePropSuggestTime",
              output: "<Component createdDate={user.createdAt.getTime()} />",
            },
          ],
        },
      ],
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
    // new ArrayBuffer() prop
    {
      code: "<Component buffer={new ArrayBuffer(16)} />",
      errors: [{ messageId: "nonSerializableProp" }],
    },
    // new SharedArrayBuffer() prop
    {
      code: "<Component shared={new SharedArrayBuffer(16)} />",
      errors: [{ messageId: "nonSerializableProp" }],
    },
    // new DataView() prop
    {
      code: "<Component view={new DataView(buf)} />",
      errors: [{ messageId: "nonSerializableProp" }],
    },
    // new Promise() prop
    {
      code: "<Component pending={new Promise(() => {})} />",
      errors: [{ messageId: "nonSerializableProp" }],
    },
    // new Blob() prop
    {
      code: "<Component file={new Blob()} />",
      errors: [{ messageId: "nonSerializableProp" }],
    },
    // new FormData() prop
    {
      code: "<Component body={new FormData()} />",
      errors: [{ messageId: "nonSerializableProp" }],
    },
    // new ReadableStream() prop
    {
      code: "<Component stream={new ReadableStream()} />",
      errors: [{ messageId: "nonSerializableProp" }],
    },
    // new Worker() prop
    {
      code: `<Component worker={new Worker("worker.js")} />`,
      errors: [{ messageId: "nonSerializableProp" }],
    },
  ],
});
