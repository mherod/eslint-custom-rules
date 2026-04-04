import {
  moveFileWithResect,
  renameSymbolWithResect,
  renameZodSchemaWithResect,
} from "../refactors";
import {
  loadResectProjectForFile,
  loadResectWorkspaceForFile,
} from "../resect-integration";

jest.mock("../resect-integration", () => ({
  loadResectProjectForFile: jest.fn(),
  loadResectWorkspaceForFile: jest.fn(),
}));

const mockedLoadResectProjectForFile = jest.mocked(loadResectProjectForFile);
const mockedLoadResectWorkspaceForFile = jest.mocked(
  loadResectWorkspaceForFile
);

describe("refactors", () => {
  const renameSymbol = jest.fn();
  const moveModule = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    mockedLoadResectProjectForFile.mockResolvedValue({
      api: {
        module: {
          moveModule,
          renameSymbol,
        },
        nodeRuntime: {} as never,
      },
      project: { tsconfigPath: "/repo/tsconfig.json" } as never,
      projectRoot: "/repo",
      tsconfigPath: "/repo/tsconfig.json",
    });

    mockedLoadResectWorkspaceForFile.mockResolvedValue({
      api: {
        module: {
          moveModule,
          renameSymbol,
        },
        nodeRuntime: {} as never,
      },
      project: { tsconfigPath: "/repo/tsconfig.json" } as never,
      projectRoot: "/repo",
      tsconfigPath: "/repo/tsconfig.json",
      workspace: { root: "/repo" } as never,
    });
  });

  it("renames exported symbols with resect", async () => {
    renameSymbol.mockResolvedValue({ success: true });

    await renameSymbolWithResect({
      filePath: "/repo/src/schema.ts",
      newName: "UserFormSchema",
      oldName: "userForm",
    });

    expect(renameSymbol).toHaveBeenCalledWith(
      "/repo/src/schema.ts",
      "userForm",
      "UserFormSchema",
      expect.anything(),
      false,
      false
    );
  });

  it("derives canonical zod schema names before delegating", async () => {
    renameSymbol.mockResolvedValue({ success: true });

    await renameZodSchemaWithResect({
      filePath: "/repo/src/schema.ts",
      oldName: "user_form_schema",
    });

    expect(renameSymbol).toHaveBeenCalledWith(
      "/repo/src/schema.ts",
      "user_form_schema",
      "UserFormSchema",
      expect.anything(),
      false,
      false
    );
  });

  it("passes workspace context to resect moves", async () => {
    moveModule.mockResolvedValue({ success: true });

    await moveFileWithResect({
      sourcePath: "/repo/src/old-file.ts",
      targetPath: "/repo/src/new-file.ts",
      verbose: true,
    });

    expect(moveModule).toHaveBeenCalledWith(
      "/repo/src/old-file.ts",
      "/repo/src/new-file.ts",
      expect.anything(),
      false,
      true,
      expect.objectContaining({ root: "/repo" })
    );
  });
});
