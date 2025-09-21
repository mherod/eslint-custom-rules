import { RuleTester } from "@typescript-eslint/rule-tester";
import rule from "../prefer-use-swr-over-fetch";

const ruleTester = new RuleTester({
  languageOptions: {
    parser: require("@typescript-eslint/parser"),
    parserOptions: {
      ecmaVersion: 2020,
      sourceType: "module",
      ecmaFeatures: {
        jsx: true,
      },
    },
  },
});

ruleTester.run("prefer-use-swr-over-fetch", rule, {
  valid: [
    // Server component (no "use client" directive) - should not trigger
    {
      code: `
        function ServerComponent() {
          const data = await fetch('/api/data');
          return <div>{data}</div>;
        }
      `,
    },
    // useSWR usage (good pattern) - should not trigger
    {
      code: `
        "use client";
        
        function ClientComponent() {
          const { data, error } = useSWR('/api/data', fetcher);
          return <div>{data}</div>;
        }
      `,
    },
    // Mutation fetch (POST/PUT/DELETE) - should not trigger
    {
      code: `
        "use client";
        
        function ClientComponent() {
          const handleSubmit = async () => {
            await fetch('/api/data', {
              method: 'POST',
              body: JSON.stringify(data)
            });
          };
          return <button onClick={handleSubmit}>Submit</button>;
        }
      `,
    },
    // Custom hook already using useSWR - should not trigger
    {
      code: `
        "use client";
        
        function useApiData() {
          return useSWR('/api/data', fetcher);
        }
      `,
    },
    // File without "use client" directive - should not trigger
    {
      code: `
        function MyComponent() {
          const data = fetch('/api/data');
          return <div>{data}</div>;
        }
      `,
    },
    // Non-component function in client file - should not trigger
    {
      code: `
        "use client";
        
        function utilityFunction() {
          return fetch('/external-api');
        }
        
        function Component() {
          return <div>Hello</div>;
        }
      `,
    },
  ],
  invalid: [
    // Simple GET fetch in client component - should suggest useSWR
    {
      code: `
        "use client";
        
        function UserProfile() {
          useEffect(() => {
            fetch('/api/user').then(res => res.json()).then(setUser);
          }, []);
          return <div>Profile</div>;
        }
      `,
      errors: [
        {
          messageId: "preferUseSWROverFetch",
        },
      ],
    },
    // fetch with explicit GET method - should suggest useSWR
    {
      code: `
        "use client";
        
        function DataComponent() {
          const loadData = async () => {
            const response = await fetch('/api/data', { method: 'GET' });
            const data = await response.json();
            setData(data);
          };
          return <div>Data</div>;
        }
      `,
      errors: [
        {
          messageId: "preferUseSWROverFetch",
        },
      ],
    },
    // fetch in custom hook - should suggest useSWR
    {
      code: `
        "use client";
        
        function useUserData() {
          const [data, setData] = useState(null);
          
          useEffect(() => {
            fetch('/api/user').then(res => res.json()).then(setData);
          }, []);
          
          return data;
        }
      `,
      errors: [
        {
          messageId: "preferUseSWROverFetch",
        },
      ],
    },
    // Complex fetch with JSON headers - should suggest useSWR
    {
      code: `
        "use client";
        
        function TikTokVideo() {
          const enhancedFetcher = useCallback(async (url) => {
            const response = await fetch(url, {
              headers: {
                Accept: "application/json",
                "Cache-Control": "no-cache",
              },
              mode: "cors",
            });
            return response.json();
          }, []);
          
          return <div>Video</div>;
        }
      `,
      errors: [
        {
          messageId: "preferUseSWROverFetch",
        },
      ],
    },
    // fetch with dynamic URL - should suggest useSWR
    {
      code: `
        "use client";
        
        function ProductDetail({ id }) {
          useEffect(() => {
            fetch(\`/api/products/\${id}\`)
              .then(res => res.json())
              .then(setProduct);
          }, [id]);
          
          return <div>Product</div>;
        }
      `,
      errors: [
        {
          messageId: "preferUseSWROverFetch",
        },
      ],
    },
    // fetch in arrow function component - should suggest useSWR
    {
      code: `
        "use client";
        
        const UsersList = () => {
          useEffect(() => {
            fetch('/api/users').then(res => res.json()).then(setUsers);
          }, []);
          
          return <div>Users</div>;
        };
      `,
      errors: [
        {
          messageId: "preferUseSWROverFetch",
        },
      ],
    },
    // fetch without explicit method (defaults to GET) - should suggest useSWR
    {
      code: `
        "use client";
        
        function Dashboard() {
          const loadStats = async () => {
            const res = await fetch('/api/stats', {
              headers: { 'Authorization': 'Bearer token' }
            });
            const stats = await res.json();
            setStats(stats);
          };
          
          return <div>Dashboard</div>;
        }
      `,
      errors: [
        {
          messageId: "preferUseSWROverFetch",
        },
      ],
    },
    // Medium confidence case - should get suggestion
    {
      code: `
        "use client";
        
        function ApiClient() {
          const fetchData = async (endpoint) => {
            const data = await fetch(endpoint);
            return data.json();
          };
          
          return <div>Client</div>;
        }
      `,
      errors: [
        {
          messageId: "suggestUseSWRPattern",
        },
      ],
    },
  ],
});
