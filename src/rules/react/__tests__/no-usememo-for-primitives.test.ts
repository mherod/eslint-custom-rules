import { RuleTester } from "@typescript-eslint/rule-tester";
import rule, { RULE_NAME } from "../no-usememo-for-primitives";

const ruleTester = new RuleTester({
  languageOptions: {
    parserOptions: {
      ecmaVersion: 2020,
      sourceType: "module",
    },
  },
});

ruleTester.run(RULE_NAME, rule, {
  valid: [
    // Object result — memoization is worthwhile
    {
      code: "const obj = useMemo(() => ({ x: a, y: b }), [a, b]);",
    },
    // Array result — memoization is worthwhile
    {
      code: "const arr = useMemo(() => items.map(fn), [items]);",
    },
    // Function call result — unknown type, could be expensive object
    {
      code: "const val = useMemo(() => computeExpensive(a, b), [a, b]);",
    },
    // Block body returning an object
    {
      code: "const val = useMemo(() => { const x = a + b; return { x }; }, [a, b]);",
    },
    // Not useMemo
    {
      code: "const val = useCallback(() => a + b, [a, b]);",
    },
    // No arguments
    {
      code: "const val = useMemo();",
    },
    // Logical OR with identifiers — unknown type, can't prove primitive
    {
      code: "const val = useMemo(() => a || b, [a, b]);",
    },
    // Logical OR with one identifier operand — still unknown
    {
      code: "const val = useMemo(() => flag || false, [flag]);",
    },
    // Ternary with identifier branches — unknown type
    {
      code: "const val = useMemo(() => flag ? a : b, [flag, a, b]);",
    },
  ],
  invalid: [
    {
      // Number arithmetic — always produces a number
      code: "const sum = useMemo(() => a + b, [a, b]);",
      errors: [{ messageId: "noUseMemoForPrimitive" }],
    },
    {
      // String concatenation
      code: "const label = useMemo(() => `Hello ${name}`, [name]);",
      errors: [{ messageId: "noUseMemoForPrimitive" }],
    },
    {
      // Boolean comparison
      code: "const isActive = useMemo(() => count > 0, [count]);",
      errors: [{ messageId: "noUseMemoForPrimitive" }],
    },
    {
      // Literal return
      code: "const val = useMemo(() => 42, []);",
      errors: [{ messageId: "noUseMemoForPrimitive" }],
    },
    {
      // String literal
      code: "const val = useMemo(() => 'hello', []);",
      errors: [{ messageId: "noUseMemoForPrimitive" }],
    },
    {
      // Boolean literal
      code: "const val = useMemo(() => true, []);",
      errors: [{ messageId: "noUseMemoForPrimitive" }],
    },
    {
      // Block body with single return of primitive
      code: "const val = useMemo(() => { return a * b; }, [a, b]);",
      errors: [{ messageId: "noUseMemoForPrimitive" }],
    },
    {
      // Ternary returning literals on both branches
      code: "const val = useMemo(() => isOn ? 1 : 0, [isOn]);",
      errors: [{ messageId: "noUseMemoForPrimitive" }],
    },
    {
      // Unary expression
      code: "const val = useMemo(() => !flag, [flag]);",
      errors: [{ messageId: "noUseMemoForPrimitive" }],
    },
    {
      // Logical OR with both literal operands — provably primitive
      code: "const val = useMemo(() => true || false, []);",
      errors: [{ messageId: "noUseMemoForPrimitive" }],
    },
  ],
});
