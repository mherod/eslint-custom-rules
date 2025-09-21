import { RuleTester } from "@typescript-eslint/rule-tester";
import rule from "../prefer-link-over-router-push";

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

ruleTester.run("prefer-link-over-router-push", rule, {
  valid: [
    // Using Link component - should be allowed
    {
      code: `
        function MyComponent() {
          return <Link href="/about">About</Link>;
        }
      `,
    },
    // Using router.push outside of click handlers - should be allowed
    {
      code: `
        function MyComponent() {
          const router = useRouter();
          
          useEffect(() => {
            if (someCondition) {
              router.push('/dashboard');
            }
          }, []);
          
          return <div>Component</div>;
        }
      `,
    },
    // Using router.push in a non-click handler function
    {
      code: `
        function MyComponent() {
          const router = useRouter();
          
          const handleSubmit = () => {
            router.push('/success');
          };
          
          return <form onSubmit={handleSubmit}>Submit</form>;
        }
      `,
    },
    // Using router operations other than push
    {
      code: `
        function MyComponent() {
          const router = useRouter();
          
          return (
            <button onClick={() => router.back()}>
              Go Back
            </button>
          );
        }
      `,
    },
    // Non-router push methods
    {
      code: `
        function MyComponent() {
          const array = [];
          
          return (
            <button onClick={() => array.push(item)}>
              Add Item
            </button>
          );
        }
      `,
    },
    // Using router.push directly in component (not in click handler)
    {
      code: `
        function MyComponent() {
          const router = useRouter();
          router.push('/immediate');
          return <div>Component</div>;
        }
      `,
    },
  ],
  invalid: [
    // router.push in onClick handler (arrow function) - should error
    {
      code: `
        function MyComponent() {
          const router = useRouter();
          
          return (
            <button onClick={() => router.push('/about')}>
              About
            </button>
          );
        }
      `,
      errors: [
        {
          messageId: "preferLinkOverRouterPushInHandler",
        },
      ],
    },
    // router.push in onClick handler (function expression) - should error
    {
      code: `
        function MyComponent() {
          const router = useRouter();
          
          return (
            <button onClick={function() { router.push('/about'); }}>
              About
            </button>
          );
        }
      `,
      errors: [
        {
          messageId: "preferLinkOverRouterPushInHandler",
        },
      ],
    },
    // Direct router variable usage in click handler - should error
    {
      code: `
        function MyComponent() {
          const router = useRouter();
          
          return (
            <div onClick={() => router.push('/profile')}>
              Profile
            </div>
          );
        }
      `,
      errors: [
        {
          messageId: "preferLinkOverRouterPushInHandler",
        },
      ],
    },
    // useRouter().push() directly in click handler - should error
    {
      code: `
        function MyComponent() {
          return (
            <button onClick={() => useRouter().push('/dashboard')}>
              Dashboard
            </button>
          );
        }
      `,
      errors: [
        {
          messageId: "preferLinkOverRouterPushInHandler",
        },
      ],
    },
    // Multiple router.push calls in same handler - should error on each
    {
      code: `
        function MyComponent() {
          const router = useRouter();
          
          return (
            <button onClick={() => {
              router.push('/first');
              router.push('/second');
            }}>
              Navigate
            </button>
          );
        }
      `,
      errors: [
        {
          messageId: "preferLinkOverRouterPushInHandler",
        },
        {
          messageId: "preferLinkOverRouterPushInHandler",
        },
      ],
    },
    // router.push in onPress handler (React Native style) - should error
    {
      code: `
        function MyComponent() {
          const router = useRouter();
          
          return (
            <TouchableOpacity onPress={() => router.push('/settings')}>
              Settings
            </TouchableOpacity>
          );
        }
      `,
      errors: [
        {
          messageId: "preferLinkOverRouterPushInHandler",
        },
      ],
    },
    // navigation.push (alternative router pattern) in click handler - should error
    {
      code: `
        function MyComponent() {
          const navigation = useNavigation();
          
          return (
            <button onClick={() => navigation.push('/home')}>
              Home
            </button>
          );
        }
      `,
      errors: [
        {
          messageId: "preferLinkOverRouterPushInHandler",
        },
      ],
    },
  ],
});
