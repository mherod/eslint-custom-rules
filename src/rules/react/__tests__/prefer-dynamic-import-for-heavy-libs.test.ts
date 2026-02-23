import { RuleTester } from "@typescript-eslint/rule-tester";
import rule, { RULE_NAME } from "../prefer-dynamic-import-for-heavy-libs";

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
    // Non-heavy package — fine
    { code: 'import { useState } from "react";' },
    { code: 'import { clsx } from "clsx";' },
    { code: 'import { format } from "date-fns";' },
    // next/dynamic itself — fine
    { code: 'import dynamic from "next/dynamic";' },
    // Type-only import — fine (no runtime cost)
    { code: 'import type { ChartData } from "recharts";' },
    // Type specifier inline — fine
    { code: 'import { type LineChart } from "recharts";' },
    // All type specifiers — fine
    {
      code: 'import { type LineChart, type BarChart } from "recharts";',
    },
    // Relative import — not a package
    { code: 'import MyChart from "./MyChart";' },
  ],
  invalid: [
    {
      code: 'import { LineChart, XAxis } from "recharts";',
      errors: [{ messageId: "preferDynamicImport" }],
    },
    {
      code: 'import Editor from "@monaco-editor/react";',
      errors: [{ messageId: "preferDynamicImport" }],
    },
    {
      code: 'import { MapContainer, TileLayer } from "react-leaflet";',
      errors: [{ messageId: "preferDynamicImport" }],
    },
    {
      code: 'import ReactPlayer from "react-player";',
      errors: [{ messageId: "preferDynamicImport" }],
    },
    {
      code: 'import { BarChart } from "@nivo/bar";',
      errors: [{ messageId: "preferDynamicImport" }],
    },
    {
      code: 'import { Canvas } from "@react-three/fiber";',
      errors: [{ messageId: "preferDynamicImport" }],
    },
    {
      // Mixed value + type specifiers — should still flag because there's a value specifier
      code: 'import { LineChart, type LineChartProps } from "recharts";',
      errors: [{ messageId: "preferDynamicImport" }],
    },
    {
      code: 'import ReactQuill from "react-quill";',
      errors: [{ messageId: "preferDynamicImport" }],
    },
    {
      code: 'import { Document, Page } from "react-pdf";',
      errors: [{ messageId: "preferDynamicImport" }],
    },
  ],
});
