import path from "node:path";
import * as parser from "@typescript-eslint/parser";
import { RuleTester } from "@typescript-eslint/rule-tester";
import rule, { RULE_NAME } from "../no-jsx-logical-and";

const tester = new RuleTester({
  languageOptions: { parser, parserOptions: { ecmaFeatures: { jsx: true } } },
});

tester.run(RULE_NAME, rule, {
  valid: [
    {
      code: "function C(unsupported: boolean, notice: string | null) { return <div>{(unsupported || notice) && <p>{unsupported ? 'Unsupported' : notice}</p>}</div>; }",
    },
    {
      code: "function C(ready: boolean) { return <div>{ready && <span />}</div>; }",
    },
    {
      code: "function C(name: string) { return <div>{name && <span />}</div>; }",
    },
    { code: "const C = <div>{count > 0 && <span />}</div>;" },
    { code: "const C = <div>{!!count && <span />}</div>;" },
    { code: "const C = <div>{unknownCondition && <span />}</div>;" },
    { code: "const C = <div>{unknownCondition || <span />}</div>;" },
    { code: "const C = <div>{1 && <span />}</div>;" },
    { code: "const C = <div>{-1 && <span />}</div>;" },
    { code: "const C = <div>{condition ? <A /> : <B />}</div>;" },
    { code: "const C = <Panel content={count ? <span /> : null} />;" },
    { code: "const C = <Panel content={0 && <span />} />;" },
    { code: "const C = <div>{(0 && <span />) ? <A /> : <B />}</div>;" },
    { code: "const C = <div>{consume(0 && <span />)}</div>;" },
    { code: "const C = <div>{(() => 0 && <span />)()}</div>;" },
    {
      code: "function C(NaN: boolean) { return <div>{NaN && <span />}</div>; }",
    },
  ],
  invalid: [
    {
      code: "const C = <div>{!! /* keep */ count ? <span /> : null}</div>;",
      output: "const C = <div>{!! /* keep */ count && <span />}</div>;",
      errors: [{ messageId: "preferShortCircuit" }],
    },
    {
      code: "Boolean = custom; const C = <div>{Boolean(count) ? <span /> : null}</div>;",
      output:
        "Boolean = custom; const C = <div>{!!Boolean(count) && <span />}</div>;",
      errors: [{ messageId: "preferShortCircuit" }],
    },
    {
      code: "const C = <div>{Boolean(count) ? <span /> : null}</div>;",
      output: "const C = <div>{!!count && <span />}</div>;",
      errors: [{ messageId: "preferShortCircuit" }],
    },
    {
      code: "const C = <div>{ready ? /* keep this comment */ <span /> : null}</div>;",
      output: null,
      errors: [{ messageId: "preferShortCircuit" }],
    },
    {
      code: "const C = <div>{0 && <span />}</div>;",
      output: "const C = <div>{!!0 && <span />}</div>;",
      errors: [{ messageId: "numericCondition" }],
    },
    {
      code: "const C = <div>{NaN && <span />}</div>;",
      output: "const C = <div>{!!NaN && <span />}</div>;",
      errors: [{ messageId: "numericCondition" }],
    },
    {
      code: "function C(count: number) { return <div>{count && <span />}</div>; }",
      output:
        "function C(count: number) { return <div>{!!count && <span />}</div>; }",
      errors: [{ messageId: "numericCondition" }],
    },
    {
      code: "const C = <div>{total - used && <span />}</div>;",
      output: "const C = <div>{!!(total - used) && <span />}</div>;",
      errors: [{ messageId: "numericCondition" }],
    },
    {
      code: "function C(ready: boolean) { return <div>{ready ? <span /> : null}</div>; }",
      output:
        "function C(ready: boolean) { return <div>{ready && <span />}</div>; }",
      errors: [{ messageId: "preferShortCircuit" }],
    },
    {
      code: "const C = <div>{count > 0 ? <span /> : null}</div>;",
      output: "const C = <div>{count > 0 && <span />}</div>;",
      errors: [{ messageId: "preferShortCircuit" }],
    },
    {
      code: "const C = <div>{getCount() ? <span /> : null}</div>;",
      output: "const C = <div>{!!getCount() && <span />}</div>;",
      errors: [{ messageId: "preferShortCircuit" }],
    },
    {
      code: "const C = <div>{ready ? null : <span />}</div>;",
      output: "const C = <div>{!ready && <span />}</div>;",
      errors: [{ messageId: "preferShortCircuit" }],
    },
    {
      code: "function C(ready: boolean) { return <div>{!ready ? null : <span />}</div>; }",
      output:
        "function C(ready: boolean) { return <div>{ready && <span />}</div>; }",
      errors: [{ messageId: "preferShortCircuit" }],
    },
    {
      code: "function C(a: boolean, b: boolean) { return <div>{a || b ? <><span /></> : null}</div>; }",
      output:
        "function C(a: boolean, b: boolean) { return <div>{(a || b) && <><span /></>}</div>; }",
      errors: [{ messageId: "preferShortCircuit" }],
    },
    {
      code: "function C(count: number, ready: boolean) { return <div>{count && ready && <span />}</div>; }",
      output:
        "function C(count: number, ready: boolean) { return <div>{!!(count && ready) && <span />}</div>; }",
      errors: [{ messageId: "numericCondition" }],
    },
  ],
});

const fixtureRoot = path.join(__dirname, "fixtures", "jsx-conditionals");
const typedTester = new RuleTester({
  languageOptions: {
    parser,
    parserOptions: { project: "./tsconfig.json", tsconfigRootDir: fixtureRoot },
  },
});
const filename = "input.tsx";
typedTester.run(`${RULE_NAME} with type information`, rule, {
  valid: [
    {
      filename,
      code: "function C(unsupported: boolean, notice: string | null) { return <div>{(unsupported || notice) && <p>{unsupported ? 'Unsupported' : notice}</p>}</div>; }",
    },
    {
      filename,
      code: "function C({ ready }: { ready: boolean }) { return <div>{ready && <span />}</div>; }",
    },
    {
      filename,
      code: "function C({ count }: { count: 1 | 2 }) { return <div>{count && <span />}</div>; }",
    },
    {
      filename,
      code: "function C({ user }: { user?: { name: string } }) { return <div>{user && user.name && <span />}</div>; }",
    },
    {
      filename,
      code: "function C({ value }: { value: unknown }) { return <div>{value && <span />}</div>; }",
    },
    {
      filename,
      code: "function C({ count }: { count: 0 | 1 }) { return <div>{count !== 0 && count && <span />}</div>; }",
    },
  ],
  invalid: [
    {
      filename,
      code: "function C(unsupported: boolean, notice: string | null) { return <div>{unsupported || notice ? <p>{unsupported ? 'Unsupported' : notice}</p> : null}</div>; }",
      output:
        "function C(unsupported: boolean, notice: string | null) { return <div>{(unsupported || notice) && <p>{unsupported ? 'Unsupported' : notice}</p>}</div>; }",
      errors: [{ messageId: "preferShortCircuit" }],
    },
    {
      filename,
      code: "function C({ items }: { items: string[] }) { return <div>{items.length && <span />}</div>; }",
      output:
        "function C({ items }: { items: string[] }) { return <div>{!!items.length && <span />}</div>; }",
      errors: [{ messageId: "numericCondition" }],
    },
    {
      filename,
      code: "function C({ count }: { count: number | undefined }) { return <div>{count && <span />}</div>; }",
      output:
        "function C({ count }: { count: number | undefined }) { return <div>{!!count && <span />}</div>; }",
      errors: [{ messageId: "numericCondition" }],
    },
    {
      filename,
      code: "function C({ ready }: { ready: boolean }) { return <div>{ready ? <span /> : null}</div>; }",
      output:
        "function C({ ready }: { ready: boolean }) { return <div>{ready && <span />}</div>; }",
      errors: [{ messageId: "preferShortCircuit" }],
    },
    {
      filename,
      code: "function C({ items }: { items: string[] }) { return <div>{items.length ? <span /> : null}</div>; }",
      output:
        "function C({ items }: { items: string[] }) { return <div>{!!items.length && <span />}</div>; }",
      errors: [{ messageId: "preferShortCircuit" }],
    },
  ],
});
