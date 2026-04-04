import type { MoveResult, RenameResult, WorkspaceInfo } from "@mherod/resect";
import {
  loadResectProjectForFile,
  loadResectWorkspaceForFile,
} from "./resect-integration";
import { toPascalCaseWithSchemaSuffix } from "./rules/utils/zod-utils";

export interface ResectRefactorOptions {
  dryRun?: boolean;
  verbose?: boolean;
}

export interface MoveFileRefactorOptions extends ResectRefactorOptions {
  sourcePath: string;
  targetPath: string;
}

export interface RenameSymbolRefactorOptions extends ResectRefactorOptions {
  filePath: string;
  newName: string;
  oldName: string;
}

export interface RenameZodSchemaRefactorOptions
  extends Omit<RenameSymbolRefactorOptions, "newName"> {
  newName?: string;
}

function getOptionFlag(value: boolean | undefined): boolean {
  return value ?? false;
}

async function requireProjectContext(
  filePath: string
): Promise<import("./resect-integration").ResectProjectContext> {
  const projectContext = await loadResectProjectForFile(filePath);
  if (!projectContext) {
    throw new Error(
      "Resect is unavailable or no tsconfig.json could be resolved for this file."
    );
  }
  return projectContext;
}

async function requireWorkspaceContext(
  filePath: string
): Promise<WorkspaceInfo | undefined> {
  const workspaceContext = await loadResectWorkspaceForFile(filePath);
  return workspaceContext?.workspace ?? undefined;
}

export async function renameSymbolWithResect(
  options: RenameSymbolRefactorOptions
): Promise<RenameResult> {
  const projectContext = await requireProjectContext(options.filePath);

  return projectContext.api.module.renameSymbol(
    options.filePath,
    options.oldName,
    options.newName,
    projectContext.project,
    getOptionFlag(options.dryRun),
    getOptionFlag(options.verbose)
  );
}

export function renameZodSchemaWithResect(
  options: RenameZodSchemaRefactorOptions
): Promise<RenameResult> {
  const nextName =
    options.newName ?? toPascalCaseWithSchemaSuffix(options.oldName);

  if (!nextName) {
    throw new Error(
      `Could not derive a valid PascalCase schema name from "${options.oldName}".`
    );
  }

  return renameSymbolWithResect({
    ...options,
    newName: nextName,
  });
}

export async function moveFileWithResect(
  options: MoveFileRefactorOptions
): Promise<MoveResult> {
  const projectContext = await requireProjectContext(options.sourcePath);
  const workspace = await requireWorkspaceContext(options.sourcePath);

  return projectContext.api.module.moveModule(
    options.sourcePath,
    options.targetPath,
    projectContext.project,
    getOptionFlag(options.dryRun),
    getOptionFlag(options.verbose),
    workspace
  );
}
