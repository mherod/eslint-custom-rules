import { parse } from "@typescript-eslint/parser";
import type { TSESTree } from "@typescript-eslint/utils";
import { getFileFacts } from "../file-facts";

function sourceCodeFor(text: string): {
  ast: TSESTree.Program;
  getAllComments: () => TSESTree.Comment[];
  lines: string[];
} {
  const ast = parse(text, {
    comment: true,
    loc: true,
    range: true,
  }) as unknown as TSESTree.Program;
  return {
    ast,
    getAllComments: () => [],
    lines: text.split("\n"),
  };
}

describe("getFileFacts", () => {
  it("detects directive prologue facts once per file", () => {
    const sourceCode = sourceCodeFor('"use client";\nexport const a = 1;');
    const facts = getFileFacts("/app/components/Widget.tsx", sourceCode);

    expect(facts.hasUseClient).toBe(true);
    expect(facts.hasUseServer).toBe(false);
    expect(facts.isClientFile).toBe(true);
    expect(facts.isServerFile).toBe(false);
  });

  it("returns the same cached facts object for one program", () => {
    const sourceCode = sourceCodeFor("export const a = 1;");
    const first = getFileFacts("/app/page.tsx", sourceCode);
    const second = getFileFacts("/app/page.tsx", sourceCode);
    expect(second).toBe(first);
  });

  const plain = "export const a = 1;";

  // Table-driven role facts covering prior route/middleware regressions
  // (#7 directive scanning, #15 rate-limit targeting, #24 API heuristics,
  // #39 route-handler classification).
  const roleCases: [
    string,
    Partial<
      Pick<
        ReturnType<typeof getFileFacts>,
        | "isRouteHandler"
        | "isAppRouterApiRoute"
        | "isPagesRouterApiRoute"
        | "isMiddleware"
        | "isActionFile"
        | "isDataFile"
        | "isProtectedRoute"
      >
    >,
  ][] = [
    [
      "/project/app/api/users/route.ts",
      {
        isRouteHandler: true,
        isAppRouterApiRoute: true,
        isPagesRouterApiRoute: false,
      },
    ],
    [
      // Route Handlers live anywhere in app/, not only app/api
      "/project/app/feed/route.ts",
      { isRouteHandler: true, isAppRouterApiRoute: false },
    ],
    [
      "/project/pages/api/users.ts",
      { isRouteHandler: false, isPagesRouterApiRoute: true },
    ],
    ["/project/middleware.ts", { isMiddleware: true }],
    ["/project/src/middleware.ts", { isMiddleware: true }],
    ["/project/app/middleware-helpers.ts", { isMiddleware: false }],
    ["/project/lib/actions/save-user.ts", { isActionFile: true }],
    ["/project/lib/data/users.ts", { isDataFile: true, isActionFile: false }],
    ["/project/app/admin/page.tsx", { isProtectedRoute: true }],
    ["/project/app/blog/page.tsx", { isProtectedRoute: false }],
  ];

  it.each(roleCases)("classifies %s", (filename, expected) => {
    const facts = getFileFacts(filename, sourceCodeFor(plain));
    for (const [key, value] of Object.entries(expected)) {
      expect({ key, value: facts[key as keyof typeof facts] }).toEqual({
        key,
        value,
      });
    }
  });
});
