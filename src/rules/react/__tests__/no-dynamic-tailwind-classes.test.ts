import { RuleTester } from "@typescript-eslint/rule-tester";
import rule from "../no-dynamic-tailwind-classes";

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

ruleTester.run("no-dynamic-tailwind-classes", rule, {
  valid: [
    // Static class names are fine
    {
      code: `<div className="bg-red-500 text-white p-4" />`,
    },
    {
      code: `<div className="hover:bg-blue-600 focus:ring-2" />`,
    },
    // Complete conditional classes (when allowed)
    {
      code: `<div className={isActive ? 'bg-blue-500' : 'bg-gray-500'} />`,
    },
    {
      code: `<div className={isDark && 'bg-gray-900'} />`,
    },
    // Using utility functions with static classes
    {
      code: `<div className={cn('bg-red-500', 'text-white')} />`,
    },
    {
      code: `<div className={clsx('p-4', { 'bg-blue-500': isActive })} />`,
    },
    // Template literals without dynamic class construction
    {
      code: "<div className={`flex items-center gap-4`} />",
    },
    // Arrays of complete classes
    {
      code: `<div className={['bg-red-500', 'text-white'].join(' ')} />`,
    },
    // Object notation (common with clsx/cn)
    {
      code: `
        <div className={clsx({
          'bg-red-500': isError,
          'bg-green-500': isSuccess,
          'bg-blue-500': isInfo
        })} />
      `,
    },
    // Static template literal
    {
      code: `
        const baseStyles = 'flex items-center';
        <div className={baseStyles} />
      `,
    },
    // Conditional with complete classes
    {
      code: `<div className={status === 'error' ? 'text-red-500' : 'text-gray-500'} />`,
    },
    // With custom allowed patterns
    {
      code: "<div className={`bg-${theme}-500`} />",
      options: [{ allowedDynamicClasses: ["bg-\\$\\{theme\\}-500"] }],
    },
  ],

  invalid: [
    // Template literal with color variable
    {
      code: "<div className={`bg-${color}-500`} />",
      errors: [{ messageId: "dynamicUtilityClass" }],
    },
    // Template literal with size variable
    {
      code: "<div className={`p-${spacing}`} />",
      errors: [{ messageId: "templateLiteralClass" }],
    },
    // String concatenation for classes
    {
      code: `<div className={'bg-' + color + '-500'} />`,
      errors: [{ messageId: "dynamicClassConstruction" }],
    },
    // Dynamic prefix
    {
      code: "<div className={`${prefix}-red-500`} />",
      errors: [{ messageId: "templateLiteralClass" }],
    },
    // Dynamic suffix
    {
      code: "<div className={`text-red-${intensity}`} />",
      errors: [{ messageId: "dynamicUtilityClass" }],
    },
    // Ternary constructing partial classes
    {
      code: `<div className={isActive ? 'bg-blue' : 'bg-red' + '-500'} />`,
      errors: [{ messageId: "dynamicClassConstruction" }],
    },
    // Array join with partial classes
    {
      code: `<div className={['bg-', color, '-500'].join('')} />`,
      errors: [{ messageId: "arrayJoinClass" }],
    },
    // In utility functions
    {
      code: `<div className={cn(\`bg-\${variant}-500\`, 'p-4')} />`,
      errors: [{ messageId: "dynamicUtilityClass" }],
    },
    {
      code: `<div className={clsx('p-4', \`text-\${size}\`)} />`,
      errors: [{ messageId: "templateLiteralClass" }],
    },
    // Complex dynamic patterns
    {
      code: "<div className={`hover:bg-${color}-600 focus:ring-${color}-500`} />",
      errors: [{ messageId: "dynamicUtilityClass" }],
    },
    // Dynamic responsive utilities
    {
      code: "<div className={`md:p-${spacing} lg:p-${spacing * 2}`} />",
      errors: [{ messageId: "templateLiteralClass" }],
    },
    // Dynamic with logical operators creating partial classes
    {
      code: `<div className={isLarge && 'text-' + size} />`,
      errors: [{ messageId: "dynamicClassConstruction" }],
    },
    // Responsive prefix concatenations
    {
      code: `<div className={'md:' + 'hidden'} />`,
      errors: [{ messageId: "dynamicClassConstruction" }],
    },
    {
      code: `<div className={'sm:' + 'p-4'} />`,
      errors: [{ messageId: "dynamicClassConstruction" }],
    },
    {
      code: `<div className={'hover:' + 'bg-blue-500'} />`,
      errors: [{ messageId: "dynamicClassConstruction" }],
    },
    {
      code: `<div className={'dark:' + theme} />`,
      errors: [{ messageId: "dynamicClassConstruction" }],
    },
    {
      code: `<div className={'lg:' + 'grid-cols-' + columns} />`,
      errors: [{ messageId: "dynamicClassConstruction" }],
    },
    // Reverse pattern - variable first
    {
      code: `<div className={breakpoint + ':hidden'} />`,
      errors: [{ messageId: "dynamicClassConstruction" }],
    },
    {
      code: `<div className={variant + '-500'} />`,
      errors: [{ messageId: "dynamicClassConstruction" }],
    },
    // Common mistake patterns
    {
      code: `
        const getColorClass = (status) => \`bg-\${status}-500\`;
        <div className={getColorClass(userStatus)} />
      `,
      errors: [{ messageId: "dynamicUtilityClass" }],
    },
    // Dynamic border colors
    {
      code: "<div className={`border-${borderColor}-300`} />",
      errors: [{ messageId: "dynamicUtilityClass" }],
    },
    // Dynamic text sizes
    {
      code: "<div className={`text-${fontSize}`} />",
      errors: [{ messageId: "templateLiteralClass" }],
    },
    // Dynamic widths/heights
    {
      code: "<div className={`w-${width} h-${height}`} />",
      errors: [{ messageId: "templateLiteralClass" }],
    },
    // Dynamic margins with calculations
    {
      code: "<div className={`mt-${index * 4}`} />",
      errors: [{ messageId: "templateLiteralClass" }],
    },
    // Gradients with dynamic colors
    {
      code: "<div className={`bg-gradient-to-r from-${startColor}-500 to-${endColor}-500`} />",
      errors: [{ messageId: "dynamicUtilityClass" }],
    },
    // Disallow all conditionals when configured
    {
      code: `<div className={isActive ? 'bg-blue-500' : 'bg-gray-500'} />`,
      options: [{ allowConditionalClasses: false }],
      errors: [{ messageId: "ternaryClassConstruction" }],
    },
    {
      code: `<div className={isActive && 'bg-blue-500'} />`,
      options: [{ allowConditionalClasses: false }],
      errors: [{ messageId: "logicalClassConstruction" }],
    },
    // Dynamic dark mode classes
    {
      code: "<div className={`dark:bg-${darkColor}-900`} />",
      errors: [{ messageId: "dynamicUtilityClass" }],
    },
    // Dynamic group hover
    {
      code: "<div className={`group-hover:text-${hoverColor}-600`} />",
      errors: [{ messageId: "dynamicUtilityClass" }],
    },
    // String with template literal syntax (edge case)
    {
      code: `<div className="bg-\${color}-500" />`,
      errors: [{ messageId: "dynamicClassConstruction" }],
    },
    // Dynamic animation classes
    {
      code: "<div className={`animate-${animation}`} />",
      errors: [{ messageId: "templateLiteralClass" }],
    },
    // Dynamic opacity
    {
      code: "<div className={`opacity-${opacity}`} />",
      errors: [{ messageId: "templateLiteralClass" }],
    },
    // Dynamic z-index
    {
      code: "<div className={`z-${layer * 10}`} />",
      errors: [{ messageId: "templateLiteralClass" }],
    },
  ],
});
