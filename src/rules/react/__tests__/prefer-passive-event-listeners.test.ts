import { RuleTester } from "@typescript-eslint/rule-tester";
import rule from "../prefer-passive-event-listeners";

const ruleTester = new RuleTester({
  languageOptions: {
    parserOptions: {
      ecmaVersion: 2021,
      sourceType: "module",
    },
  },
});

ruleTester.run("prefer-passive-event-listeners", rule, {
  valid: [
    // Already has { passive: true }
    `el.addEventListener('touchstart', handler, { passive: true });`,
    `el.addEventListener('touchmove', fn, { passive: true });`,
    `el.addEventListener('wheel', onWheel, { passive: true });`,
    `el.addEventListener('scroll', onScroll, { passive: true });`,
    // Handler that calls preventDefault() — cannot be passive
    `el.addEventListener('touchstart', (e) => { e.preventDefault(); });`,
    `el.addEventListener('wheel', function(e) { e.preventDefault(); });`,
    // Non-passive-eligible event types — not flagged
    `el.addEventListener('click', handler);`,
    `el.addEventListener('keydown', handler);`,
    `el.addEventListener('mousemove', handler);`,
    `el.addEventListener('resize', handler);`,
    // Fewer than 2 arguments — not flagged
    `el.addEventListener('touchstart');`,
    // Named function reference with passive: true — valid
    `el.addEventListener('touchstart', handleTouch, { passive: true });`,
    // Other passive options present (passive: false is not passive: true, so still flagged is expected)
    // but passive: true with other options is valid
    `el.addEventListener('touchmove', handler, { passive: true, capture: false });`,
  ],
  invalid: [
    // Missing options entirely
    {
      code: `el.addEventListener('touchstart', (e) => { console.log(e); });`,
      errors: [
        {
          messageId: "preferPassiveListener",
          data: { eventType: "touchstart" },
        },
      ],
      output: `el.addEventListener('touchstart', (e) => { console.log(e); }, { passive: true });`,
    },
    {
      code: `el.addEventListener('touchmove', handler, {});`,
      errors: [
        {
          messageId: "preferPassiveListener",
          data: { eventType: "touchmove" },
        },
      ],
      output: `el.addEventListener('touchmove', handler, { passive: true });`,
    },
    {
      code: `el.addEventListener('touchend', handler);`,
      errors: [
        { messageId: "preferPassiveListener", data: { eventType: "touchend" } },
      ],
      output: `el.addEventListener('touchend', handler, { passive: true });`,
    },
    {
      code: `el.addEventListener('touchcancel', handler);`,
      errors: [
        {
          messageId: "preferPassiveListener",
          data: { eventType: "touchcancel" },
        },
      ],
      output: `el.addEventListener('touchcancel', handler, { passive: true });`,
    },
    {
      code: `el.addEventListener('wheel', (e) => { doSomething(e); });`,
      errors: [
        { messageId: "preferPassiveListener", data: { eventType: "wheel" } },
      ],
      output: `el.addEventListener('wheel', (e) => { doSomething(e); }, { passive: true });`,
    },
    {
      code: `el.addEventListener('mousewheel', handler);`,
      errors: [
        {
          messageId: "preferPassiveListener",
          data: { eventType: "mousewheel" },
        },
      ],
      output: `el.addEventListener('mousewheel', handler, { passive: true });`,
    },
    {
      code: `el.addEventListener('scroll', handler);`,
      errors: [
        { messageId: "preferPassiveListener", data: { eventType: "scroll" } },
      ],
      output: `el.addEventListener('scroll', handler, { passive: true });`,
    },
    // Options object present but passive not set
    {
      code: `el.addEventListener('touchstart', handler, { capture: true });`,
      errors: [
        {
          messageId: "preferPassiveListener",
          data: { eventType: "touchstart" },
        },
      ],
      output: `el.addEventListener('touchstart', handler, { capture: true, passive: true });`,
    },
    // passive: false explicitly set — still flagged (not passive: true)
    {
      code: `el.addEventListener('wheel', handler, { passive: false });`,
      errors: [
        { messageId: "preferPassiveListener", data: { eventType: "wheel" } },
      ],
      output: `el.addEventListener('wheel', handler, { passive: false, passive: true });`,
    },
    // Named function references — rule flags these since it cannot verify no preventDefault()
    {
      code: `el.addEventListener('touchstart', handleTouch);`,
      errors: [
        {
          messageId: "preferPassiveListener",
          data: { eventType: "touchstart" },
        },
      ],
      output: `el.addEventListener('touchstart', handleTouch, { passive: true });`,
    },
    {
      code: `el.addEventListener('wheel', this.onWheel);`,
      errors: [
        { messageId: "preferPassiveListener", data: { eventType: "wheel" } },
      ],
      output: `el.addEventListener('wheel', this.onWheel, { passive: true });`,
    },
  ],
});
