import { RuleTester } from "@typescript-eslint/rule-tester";
import rule, { RULE_NAME } from "../no-lazy-state-init";

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
    // Already lazy — arrow function
    { code: "const [s, setS] = useState(() => expensiveFn());" },
    // Already lazy — function expression
    { code: "const [s, setS] = useState(function() { return compute(); });" },
    // Literal — cheap, no need to wrap
    { code: "const [s, setS] = useState(0);" },
    { code: "const [s, setS] = useState('');" },
    { code: "const [s, setS] = useState(null);" },
    { code: "const [s, setS] = useState(true);" },
    // Identifier — variable reference, not a call
    { code: "const [s, setS] = useState(initialValue);" },
    // No argument
    { code: "const [s, setS] = useState();" },
    // Not useState
    { code: "const result = someOtherHook(expensiveFn());" },
    // Object literal — not a call expression
    { code: "const [s, setS] = useState({ key: 'value' });" },
    // Array literal
    { code: "const [s, setS] = useState([1, 2, 3]);" },
  ],
  invalid: [
    {
      // Direct function call
      code: "const [s, setS] = useState(expensiveFn());",
      errors: [{ messageId: "useLazyStateInit" }],
      output: "const [s, setS] = useState(() => expensiveFn());",
    },
    {
      // Call with arguments
      code: "const [s, setS] = useState(computeInitialState(props.id));",
      errors: [{ messageId: "useLazyStateInit" }],
      output:
        "const [s, setS] = useState(() => computeInitialState(props.id));",
    },
    {
      // new expression
      code: "const [s, setS] = useState(new Map());",
      errors: [{ messageId: "useLazyStateInit" }],
      output: "const [s, setS] = useState(() => new Map());",
    },
    {
      // new expression with args
      code: "const [s, setS] = useState(new Set(initialItems));",
      errors: [{ messageId: "useLazyStateInit" }],
      output: "const [s, setS] = useState(() => new Set(initialItems));",
    },
    {
      // Method call
      code: "const [s, setS] = useState(JSON.parse(raw));",
      errors: [{ messageId: "useLazyStateInit" }],
      output: "const [s, setS] = useState(() => JSON.parse(raw));",
    },
    {
      // localStorage.getItem — common expensive init
      code: "const [s, setS] = useState(localStorage.getItem('key'));",
      errors: [{ messageId: "useLazyStateInit" }],
      output: "const [s, setS] = useState(() => localStorage.getItem('key'));",
    },
  ],
});
