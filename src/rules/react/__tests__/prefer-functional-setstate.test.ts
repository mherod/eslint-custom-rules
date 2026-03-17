import { RuleTester } from "@typescript-eslint/rule-tester";
import rule from "../prefer-functional-setstate";

const ruleTester = new RuleTester({
  languageOptions: {
    parserOptions: {
      ecmaVersion: 2021,
      sourceType: "module",
    },
  },
});

ruleTester.run("prefer-functional-setstate", rule, {
  valid: [
    // Already functional form — fine
    `
      const [count, setCount] = useState(0);
      setCount(prev => prev + 1);
    `,
    `
      const [items, setItems] = useState([]);
      setItems(prev => [...prev, newItem]);
    `,
    // Setting a completely new value unrelated to state
    `
      const [count, setCount] = useState(0);
      setCount(42);
    `,
    `
      const [name, setName] = useState('');
      setName(event.target.value);
    `,
    // useState not destructured as array — not tracked
    `
      const state = useState(0);
      state[1](state[0] + 1);
    `,
    // Setter called with spread — skip
    `
      const [count, setCount] = useState(0);
      setCount(...args);
    `,
    // Non-useState function — setter not registered
    `
      const [val, setVal] = useCustomHook(0);
      setVal(val + 1);
    `,
    // Function expression form — already functional
    `
      const [count, setCount] = useState(0);
      setCount(function(prev) { return prev + 1; });
    `,
    // React.useState — destructured correctly
    `
      const [count, setCount] = React.useState(0);
      setCount(prev => prev + 1);
    `,
    // No argument
    `
      const [count, setCount] = useState(0);
      setCount();
    `,
  ],
  invalid: [
    // Direct reference to state var in setter
    {
      code: `
        const [count, setCount] = useState(0);
        setCount(count + 1);
      `,
      errors: [
        {
          messageId: "preferFunctionalSetState",
          data: { stateVar: "count", setter: "setCount" },
        },
      ],
      output: `
        const [count, setCount] = useState(0);
        setCount(curr => curr + 1);
      `,
    },
    // State var in arithmetic expression
    {
      code: `
        const [total, setTotal] = useState(0);
        setTotal(total + amount);
      `,
      errors: [
        {
          messageId: "preferFunctionalSetState",
          data: { stateVar: "total", setter: "setTotal" },
        },
      ],
      output: `
        const [total, setTotal] = useState(0);
        setTotal(curr => curr + amount);
      `,
    },
    // State var in spread
    {
      code: `
        const [items, setItems] = useState([]);
        setItems([...items, newItem]);
      `,
      errors: [
        {
          messageId: "preferFunctionalSetState",
          data: { stateVar: "items", setter: "setItems" },
        },
      ],
      output: `
        const [items, setItems] = useState([]);
        setItems(curr => [...curr, newItem]);
      `,
    },
    // State var in object spread — object literal needs parens in arrow body
    {
      code: `
        const [user, setUser] = useState({});
        setUser({ ...user, name: 'Alice' });
      `,
      errors: [
        {
          messageId: "preferFunctionalSetState",
          data: { stateVar: "user", setter: "setUser" },
        },
      ],
      output: `
        const [user, setUser] = useState({});
        setUser(curr => ({ ...curr, name: 'Alice' }));
      `,
    },
    // State var in conditional
    {
      code: `
        const [flag, setFlag] = useState(false);
        setFlag(!flag);
      `,
      errors: [
        {
          messageId: "preferFunctionalSetState",
          data: { stateVar: "flag", setter: "setFlag" },
        },
      ],
      output: `
        const [flag, setFlag] = useState(false);
        setFlag(curr => !curr);
      `,
    },
    // React.useState — non-functional setter referencing state
    {
      code: `
        const [count, setCount] = React.useState(0);
        setCount(count + 1);
      `,
      errors: [
        {
          messageId: "preferFunctionalSetState",
          data: { stateVar: "count", setter: "setCount" },
        },
      ],
      output: `
        const [count, setCount] = React.useState(0);
        setCount(curr => curr + 1);
      `,
    },
    // State var inside template literal
    {
      code: `
        const [label, setLabel] = useState('');
        setLabel(\`prefix-\${label}\`);
      `,
      errors: [
        {
          messageId: "preferFunctionalSetState",
          data: { stateVar: "label", setter: "setLabel" },
        },
      ],
      output: `
        const [label, setLabel] = useState('');
        setLabel(curr => \`prefix-\${curr}\`);
      `,
    },
  ],
});
