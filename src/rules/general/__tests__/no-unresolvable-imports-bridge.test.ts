import * as path from "node:path";
import { resolveUnresolvableImportSpecifiersSync } from "../../utils/resect-sync-bridge";
import rule from "../no-unresolvable-imports";

jest.mock("../../utils/resect-sync-bridge", () => ({
  resolveUnresolvableImportSpecifiersSync: jest.fn(),
}));

const FIXTURE_FILE = path.join(
  __dirname,
  "fixtures",
  "no-unresolvable-imports",
  "src",
  "nested",
  "view.ts"
);
const mockedResolveUnresolvableImportSpecifiersSync = jest.mocked(
  resolveUnresolvableImportSpecifiersSync
);

describe("no-unresolvable-imports bridge requests", () => {
  beforeEach(() => {
    mockedResolveUnresolvableImportSpecifiersSync.mockReset();
    mockedResolveUnresolvableImportSpecifiersSync.mockReturnValue([]);
  });

  it("does not touch the bridge for import-free programs", () => {
    const { listeners } = createRuleListeners();

    runListener(listeners, "Program:exit", {} as never);

    expect(
      mockedResolveUnresolvableImportSpecifiersSync
    ).not.toHaveBeenCalled();
  });

  it("sends unique specifiers and reports against original nodes", () => {
    mockedResolveUnresolvableImportSpecifiersSync.mockReturnValue([
      {
        diagnostic: "Module was not found",
        specifier: "./missing",
      },
    ]);
    const { listeners, report } = createRuleListeners();
    const importNode = {
      source: { value: "./missing" },
      type: "ImportDeclaration",
    } as never;
    const requireNode = {
      arguments: [{ type: "Literal", value: "./missing" }],
      callee: { name: "require", type: "Identifier" },
      type: "CallExpression",
    } as never;

    runListener(listeners, "ImportDeclaration", importNode);
    runListener(listeners, "CallExpression", requireNode);
    runListener(listeners, "Program:exit", {} as never);

    expect(
      mockedResolveUnresolvableImportSpecifiersSync
    ).toHaveBeenCalledTimes(1);
    expect(
      mockedResolveUnresolvableImportSpecifiersSync
    ).toHaveBeenCalledWith({
      filePath: FIXTURE_FILE,
      specifiers: ["./missing"],
    });
    expect(report).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        data: {
          diagnostic: "Module was not found",
          specifier: "./missing",
          type: "import",
        },
        messageId: "unresolvableImport",
        node: importNode,
      })
    );
    expect(report).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        data: {
          diagnostic: "Module was not found",
          specifier: "./missing",
          type: "require",
        },
        messageId: "unresolvableImport",
        node: requireNode,
      })
    );
  });
});

function createRuleListeners() {
  const report = jest.fn();
  const listeners = rule.create({
    filename: FIXTURE_FILE,
    report,
  } as never);

  return { listeners, report };
}

function runListener(
  listeners: ReturnType<typeof rule.create>,
  selector: string,
  node: never
): void {
  const listener = listeners[selector];
  if (typeof listener !== "function") {
    throw new Error(`Missing ${selector} listener`);
  }

  listener(node);
}
