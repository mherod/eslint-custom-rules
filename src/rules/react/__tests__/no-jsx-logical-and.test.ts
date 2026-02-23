import * as parser from "@typescript-eslint/parser";
import { RuleTester } from "@typescript-eslint/rule-tester";
import rule, { RULE_NAME } from "../no-jsx-logical-and";

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
      name: "Ternary operator in JSX",
      code: `
        function Badge({ count }: { count: number }) {
          return (
            <div>
              {count > 0 ? <span className="badge">{count}</span> : null}
            </div>
          )
        }
      `,
    },
    {
      name: "Logical AND outside JSX",
      code: `
        function checkCondition(condition: boolean, value: string) {
          return condition && value;
        }
      `,
    },
    {
      name: "Logical OR in JSX",
      code: `
        function Component({ condition }: { condition: boolean }) {
          return (
            <div>
              {condition || <span>Default</span>}
            </div>
          )
        }
      `,
    },
    {
      name: "Logical AND in non-JSX expression",
      code: `
        const result = condition && value;
        console.log(result);
      `,
    },
    {
      name: "Logical AND in function arguments (not JSX)",
      code: `
        someFunction(condition && value);
      `,
    },
    {
      name: "Logical AND in object properties",
      code: `
        const obj = {
          prop: condition && value
        };
      `,
    },
    {
      name: "Complex logical AND with multiple conditions",
      code: `
        const result = (a && b) && c;
      `,
    },
  ],
  invalid: [
    {
      name: "Simple logical AND in JSX",
      code: `
        function Badge({ count }: { count: number }) {
          return (
            <div>
              {count && <span className="badge">{count}</span>}
            </div>
          )
        }
      `,
      output: `
        function Badge({ count }: { count: number }) {
          return (
            <div>
              {count ? <span className="badge">{count}</span> : null}
            </div>
          )
        }
      `,
      errors: [
        {
          messageId: "noJsxLogicalAnd",
        },
      ],
    },
    {
      name: "Logical AND with function call",
      code: `
        function Component({ items }: { items: string[] }) {
          return (
            <div>
              {items.length && <ul>{items.map(item => <li key={item}>{item}</li>)}</ul>}
            </div>
          )
        }
      `,
      output: `
        function Component({ items }: { items: string[] }) {
          return (
            <div>
              {items.length ? <ul>{items.map(item => <li key={item}>{item}</li>)}</ul> : null}
            </div>
          )
        }
      `,
      errors: [
        {
          messageId: "noJsxLogicalAnd",
        },
      ],
    },
    {
      name: "Logical AND with complex expression",
      code: `
        function Component({ user }: { user?: { name: string } }) {
          return (
            <div>
              {user && user.name && <span>Hello {user.name}!</span>}
            </div>
          )
        }
      `,
      output: `
        function Component({ user }: { user?: { name: string } }) {
          return (
            <div>
              {user && user.name ? <span>Hello {user.name}!</span> : null}
            </div>
          )
        }
      `,
      errors: [
        {
          messageId: "noJsxLogicalAnd",
        },
      ],
    },
    {
      name: "Logical AND in JSX fragment",
      code: `
        function Component({ show }: { show: boolean }) {
          return (
            <>
              {show && <div>Content</div>}
            </>
          )
        }
      `,
      output: `
        function Component({ show }: { show: boolean }) {
          return (
            <>
              {show ? <div>Content</div> : null}
            </>
          )
        }
      `,
      errors: [
        {
          messageId: "noJsxLogicalAnd",
        },
      ],
    },
    {
      name: "Logical AND in nested JSX",
      code: `
        function Component({ items }: { items: any[] }) {
          return (
            <div className="container">
              <div className="header">
                {items.length && <span>{items.length} items</span>}
              </div>
            </div>
          )
        }
      `,
      output: `
        function Component({ items }: { items: any[] }) {
          return (
            <div className="container">
              <div className="header">
                {items.length ? <span>{items.length} items</span> : null}
              </div>
            </div>
          )
        }
      `,
      errors: [
        {
          messageId: "noJsxLogicalAnd",
        },
      ],
    },
    {
      name: "Logical AND with number that could be 0",
      code: `
        function Counter({ count }: { count: number }) {
          return (
            <div>
              {count && <span>Count: {count}</span>}
            </div>
          )
        }
      `,
      output: `
        function Counter({ count }: { count: number }) {
          return (
            <div>
              {count ? <span>Count: {count}</span> : null}
            </div>
          )
        }
      `,
      errors: [
        {
          messageId: "noJsxLogicalAnd",
        },
      ],
    },
  ],
});
