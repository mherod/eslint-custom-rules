import { RuleTester } from "@typescript-eslint/rule-tester";
import rule from "../prefer-react-destructured-imports";

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

ruleTester.run("prefer-react-destructured-imports", rule, {
  valid: [
    // Already using destructured imports - should be allowed
    {
      code: `
        import { useState, useEffect } from 'react';
        
        function MyComponent() {
          const [count, setCount] = useState(0);
          
          useEffect(() => {
            console.log(count);
          }, [count]);
          
          return <div>{count}</div>;
        }
      `,
    },
    // Mixed default and destructured imports with destructured usage - should be allowed
    {
      code: `
        import React, { useState } from 'react';
        
        function MyComponent() {
          const [count, setCount] = useState(0);
          return <div>{count}</div>;
        }
      `,
    },
    // No React import at all - should be allowed
    {
      code: `
        function MyComponent() {
          return <div>Hello</div>;
        }
      `,
    },
    // Using React namespace for members that are already destructured - should be allowed
    {
      code: `
        import React, { useState, createElement } from 'react';
        
        function MyComponent() {
          const [count, setCount] = useState(0);
          return React.createElement('div', null, count);
        }
      `,
    },
    // React namespace usage without react import (might be global)
    {
      code: `
        function MyComponent() {
          return React.createElement('div', null, 'Hello');
        }
      `,
    },
  ],
  invalid: [
    // React.useState - should error and suggest fix
    {
      code: `
        import React from 'react';
        
        function MyComponent() {
          const [count, setCount] = React.useState(0);
          return <div>{count}</div>;
        }
      `,
      errors: [
        {
          messageId: "preferDestructuredImport",
          data: { memberName: "useState" },
        },
      ],
      output: `
        import React, { useState } from 'react';
        
        function MyComponent() {
          const [count, setCount] = useState(0);
          return <div>{count}</div>;
        }
      `,
    },
    // React.useEffect - should error and suggest fix
    {
      code: `
        import React from 'react';
        
        function MyComponent() {
          React.useEffect(() => {
            console.log('mounted');
          }, []);
          return <div>Hello</div>;
        }
      `,
      errors: [
        {
          messageId: "preferDestructuredImport",
          data: { memberName: "useEffect" },
        },
      ],
      output: `
        import React, { useEffect } from 'react';
        
        function MyComponent() {
          useEffect(() => {
            console.log('mounted');
          }, []);
          return <div>Hello</div>;
        }
      `,
    },
    // Multiple React.* usages - should error on each (multiple autofix passes)
    {
      code: `
        import React from 'react';
        
        function MyComponent() {
          const [count, setCount] = React.useState(0);
          const ref = React.useRef(null);
          
          React.useEffect(() => {
            console.log(count);
          }, [count]);
          
          return <div ref={ref}>{count}</div>;
        }
      `,
      errors: [
        {
          messageId: "preferDestructuredImport",
          data: { memberName: "useState" },
        },
        {
          messageId: "preferDestructuredImport",
          data: { memberName: "useRef" },
        },
        {
          messageId: "preferDestructuredImport",
          data: { memberName: "useEffect" },
        },
      ],
      output: [
        `
        import React, { useState } from 'react';
        
        function MyComponent() {
          const [count, setCount] = useState(0);
          const ref = React.useRef(null);
          
          React.useEffect(() => {
            console.log(count);
          }, [count]);
          
          return <div ref={ref}>{count}</div>;
        }
      `,
        `
        import React, { useState, useRef } from 'react';
        
        function MyComponent() {
          const [count, setCount] = useState(0);
          const ref = useRef(null);
          
          React.useEffect(() => {
            console.log(count);
          }, [count]);
          
          return <div ref={ref}>{count}</div>;
        }
      `,
        `
        import React, { useState, useRef, useEffect } from 'react';
        
        function MyComponent() {
          const [count, setCount] = useState(0);
          const ref = useRef(null);
          
          useEffect(() => {
            console.log(count);
          }, [count]);
          
          return <div ref={ref}>{count}</div>;
        }
      `,
      ],
    },
    // Adding to existing destructured imports
    {
      code: `
        import React, { useState } from 'react';
        
        function MyComponent() {
          const [count, setCount] = useState(0);
          
          React.useEffect(() => {
            console.log(count);
          }, [count]);
          
          return <div>{count}</div>;
        }
      `,
      errors: [
        {
          messageId: "preferDestructuredImport",
          data: { memberName: "useEffect" },
        },
      ],
      output: `
        import React, { useState, useEffect } from 'react';
        
        function MyComponent() {
          const [count, setCount] = useState(0);
          
          useEffect(() => {
            console.log(count);
          }, [count]);
          
          return <div>{count}</div>;
        }
      `,
    },
    // Only destructured imports, no default React import
    {
      code: `
        import { useState } from 'react';
        
        function MyComponent() {
          const [count, setCount] = useState(0);
          
          React.useEffect(() => {
            console.log(count);
          }, [count]);
          
          return <div>{count}</div>;
        }
      `,
      errors: [
        {
          messageId: "preferDestructuredImport",
          data: { memberName: "useEffect" },
        },
      ],
      output: `
        import { useState, useEffect } from 'react';
        
        function MyComponent() {
          const [count, setCount] = useState(0);
          
          useEffect(() => {
            console.log(count);
          }, [count]);
          
          return <div>{count}</div>;
        }
      `,
    },
    // Less common React member - should suggest but with different message
    {
      code: `
        import React from 'react';
        
        function MyComponent() {
          return React.createElement('div', null, 'Hello');
        }
      `,
      errors: [
        {
          messageId: "preferDestructuredImport",
          data: { memberName: "createElement" },
        },
      ],
      output: `
        import React, { createElement } from 'react';
        
        function MyComponent() {
          return createElement('div', null, 'Hello');
        }
      `,
    },
    // React.memo usage
    {
      code: `
        import React from 'react';
        
        const MyComponent = React.memo(() => {
          return <div>Hello</div>;
        });
      `,
      errors: [
        {
          messageId: "preferDestructuredImport",
          data: { memberName: "memo" },
        },
      ],
      output: `
        import React, { memo } from 'react';
        
        const MyComponent = memo(() => {
          return <div>Hello</div>;
        });
      `,
    },
    // React.forwardRef usage
    {
      code: `
        import React from 'react';
        
        const MyComponent = React.forwardRef((props, ref) => {
          return <div ref={ref}>Hello</div>;
        });
      `,
      errors: [
        {
          messageId: "preferDestructuredImport",
          data: { memberName: "forwardRef" },
        },
      ],
      output: `
        import React, { forwardRef } from 'react';
        
        const MyComponent = forwardRef((props, ref) => {
          return <div ref={ref}>Hello</div>;
        });
      `,
    },
  ],
});
