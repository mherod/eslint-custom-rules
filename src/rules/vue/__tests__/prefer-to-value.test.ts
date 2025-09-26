import { RuleTester } from "@typescript-eslint/rule-tester";
import rule from "../prefer-to-value";

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

ruleTester.run("prefer-to-value", rule, {
  valid: [
    // Using toValue is correct
    {
      code: `
        import { toValue } from 'vue';
        const value = toValue(myRef);
      `,
    },
    {
      code: `
        import { toValue, ref } from 'vue';
        const count = ref(0);
        const value = toValue(count);
      `,
    },
    // Not a ref - regular object with value property
    {
      code: `
        const config = { value: 42 };
        const val = config.value;
      `,
    },
    // Global objects with value property should be ignored
    {
      code: `
        const val = console.value;
        const win = window.value;
      `,
    },
    // Already using toValue with complex expressions
    {
      code: `
        import { toValue } from 'vue';
        const value = toValue(props.someRef);
        const value2 = toValue(getSomeRef());
      `,
    },
    // Assignment to a .value property should be ignored
    {
      code: `
        import { ref } from 'vue';
        const isHovered = ref(false);
        isHovered.value = true;
      `,
    },
  ],

  invalid: [
    // Basic ref.value pattern
    {
      code: `
        import { ref } from 'vue';
        const countRef = ref(0);
        const value = countRef.value;
      `,
      errors: [{ messageId: "preferToValue" }],
      output: `
        import { ref, toValue } from 'vue';
        const countRef = ref(0);
        const value = toValue(countRef);
      `,
      options: [{ autoImport: true }],
    },
    // Multiple refs with .value
    {
      code: `
        import { ref } from 'vue';
        const userRef = ref(null);
        const dataRef = ref({});
        const u = userRef.value;
        const d = dataRef.value;
      `,
      errors: [{ messageId: "preferToValue" }, { messageId: "preferToValue" }],
      options: [{ autoImport: false }],
    },
    // Using unref
    {
      code: `
        import { ref, unref } from 'vue';
        const countRef = ref(0);
        const value = unref(countRef);
      `,
      errors: [{ messageId: "preferToValueOverUnref" }],
      output: `
        import { ref, toValue } from 'vue';
        const countRef = ref(0);
        const value = toValue(countRef);
      `,
      options: [{ autoImport: true }],
    },
    // Multiple unref calls
    {
      code: `
        import { unref } from 'vue';
        const val1 = unref(someRef);
        const val2 = unref(anotherRef);
      `,
      errors: [
        { messageId: "preferToValueOverUnref" },
        { messageId: "preferToValueOverUnref" },
      ],
    },
    // isRef conditional pattern
    {
      code: `
        import { isRef } from 'vue';
        const value = isRef(myRef) ? myRef.value : myRef;
      `,
      errors: [{ messageId: "preferToValue" }],
      output: `
        import { isRef, toValue } from 'vue';
        const value = toValue(myRef);
      `,
      options: [{ autoImport: true }],
    },
    // Computed ref with .value
    {
      code: `
        import { computed } from 'vue';
        const computedValue = computed(() => 42);
        const val = computedValue.value;
      `,
      errors: [{ messageId: "preferToValue" }],
    },
    // Common Vue 3 patterns
    {
      code: `
        const isLoading = ref(false);
        const hasError = ref(false);
        const showModal = ref(true);

        if (isLoading.value) {}
        if (hasError.value) {}
        if (showModal.value) {}
      `,
      errors: [
        { messageId: "preferToValue" },
        { messageId: "preferToValue" },
        { messageId: "preferToValue" },
      ],
    },
    // State pattern
    {
      code: `
        const state = ref({ count: 0 });
        const currentState = state.value;
      `,
      errors: [{ messageId: "preferToValue" }],
    },
    // Props ref pattern
    {
      code: `
        const propsRef = ref(props);
        const currentProps = propsRef.value;
      `,
      errors: [{ messageId: "preferToValue" }],
    },
    // Form data pattern
    {
      code: `
        const formData = ref({});
        const data = formData.value;
      `,
      errors: [{ messageId: "preferToValue" }],
    },
    // Mixed patterns in one file
    {
      code: `
        import { ref, unref, isRef } from 'vue';

        const countRef = ref(0);
        const nameRef = ref('');

        const val1 = countRef.value;
        const val2 = unref(nameRef);
        const val3 = isRef(someValue) ? someValue.value : someValue;
      `,
      errors: [
        { messageId: "preferToValue" },
        { messageId: "preferToValueOverUnref" },
        { messageId: "preferToValue" },
      ],
    },
    // No imports yet - should add import
    {
      code: `
        const myRef = getSomeRef();
        const value = myRef.value;
      `,
      errors: [{ messageId: "preferToValue" }],
      output: `
        import { toValue } from 'vue';

        const myRef = getSomeRef();
        const value = toValue(myRef);
      `,
      options: [{ autoImport: true }],
    },
    // From @vue/reactivity
    {
      code: `
        import { ref, unref } from '@vue/reactivity';
        const countRef = ref(0);
        const value = unref(countRef);
      `,
      errors: [{ messageId: "preferToValueOverUnref" }],
      output: `
        import { ref, toValue } from '@vue/reactivity';
        const countRef = ref(0);
        const value = toValue(countRef);
      `,
      options: [{ autoImport: true }],
    },
  ],
});
