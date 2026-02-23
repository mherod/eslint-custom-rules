import * as parser from "@typescript-eslint/parser";
import { RuleTester } from "@typescript-eslint/rule-tester";
import rule from "../prefer-search-params-over-state";

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

ruleTester.run("prefer-search-params-over-state", rule, {
  valid: [
    // Generic state unrelated to search — allowed
    {
      name: "non-search useState is allowed",
      code: "const [count, setCount] = useState(0);",
    },
    {
      name: "modal open state is allowed",
      code: "const [isOpen, setIsOpen] = useState(false);",
    },
    {
      name: "user name state is allowed",
      code: `const [userName, setUserName] = useState("");`,
    },
    // Already using search params — allowed
    {
      name: "useSearchParams usage is allowed",
      code: `
        const searchParams = useSearchParams();
        const query = searchParams.get("q") ?? "";
      `,
    },
    // Destructure does not match array pattern — allowed
    {
      name: "object destructure useState is allowed",
      code: `const result = useState("");`,
    },
  ],
  invalid: [
    // Classic search query pattern
    {
      name: "searchQuery state should use search params",
      code: `const [searchQuery, setSearchQuery] = useState("");`,
      errors: [{ messageId: "preferSearchParams" }],
    },
    {
      name: "query state should use search params",
      code: `const [query, setQuery] = useState("");`,
      errors: [{ messageId: "preferSearchParams" }],
    },
    {
      name: "search state should use search params",
      code: `const [search, setSearch] = useState("");`,
      errors: [{ messageId: "preferSearchParams" }],
    },
    {
      name: "searchTerm state should use search params",
      code: `const [searchTerm, setSearchTerm] = useState("");`,
      errors: [{ messageId: "preferSearchParams" }],
    },
    {
      name: "filterQuery state should use search params",
      code: `const [filterQuery, setFilterQuery] = useState("");`,
      errors: [{ messageId: "preferSearchParams" }],
    },
    {
      name: "q state should use search params",
      code: `const [q, setQ] = useState("");`,
      errors: [{ messageId: "preferSearchParams" }],
    },
    // React.useState variant
    {
      name: "React.useState with searchQuery should use search params",
      code: `const [searchQuery, setSearchQuery] = React.useState("");`,
      errors: [{ messageId: "preferSearchParams" }],
    },
    // Non-string initial value — same heuristic applies
    {
      name: "searchQuery with non-empty initial value should use search params",
      code: `const [searchQuery, setSearchQuery] = useState("initial");`,
      errors: [{ messageId: "preferSearchParams" }],
    },
    // Inside a component
    {
      name: "searchQuery inside component should use search params",
      code: `
        function SearchBar() {
          const [searchQuery, setSearchQuery] = useState("");
          return <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />;
        }
      `,
      errors: [{ messageId: "preferSearchParams" }],
    },
  ],
});
