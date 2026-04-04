import { spawnSync } from "node:child_process";

export interface DirectImportBindingRequest {
  importedName: string;
}

export interface DirectImportResolution {
  importedName: string;
  newSpecifier: string;
  pathSegment: string;
  targetPath: string;
}

export interface CanonicalImportResolution {
  nextSpecifier: string;
  strategy: "alias" | "relative" | "shortest" | "workspace";
}

export interface UnresolvableImportDiagnostic {
  column: number;
  diagnostic: string;
  line: number;
  specifier: string;
  type:
    | "export-from"
    | "import"
    | "import-dynamic"
    | "jest-mock"
    | "require"
    | "require-resolve";
}

type SyncBridgeRequest =
  | {
      bindings: DirectImportBindingRequest[];
      filePath: string;
      operation: "resolve-direct-imports";
      specifier: string;
    }
  | {
      filePath: string;
      operation: "canonicalize-import";
      prefer: "alias" | "shortest";
      specifier: string;
    }
  | {
      filePath: string;
      operation: "scan-unresolvable-imports";
      sourceText: string;
    };

const bridgeResultCache = new Map<string, unknown>();

const RESECT_SYNC_BRIDGE_SCRIPT = String.raw`
import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

globalThis.Bun ??= { Glob: class Glob {} };

const [resect, resectNode] = await Promise.all([
  import("@mherod/resect"),
  import("@mherod/resect/node"),
]);

resect.setRuntime(resectNode.nodeRuntime);

const KNOWN_EXTENSIONS = /\.(tsx?|jsx?|mts|cts|mjs|cjs|vue)$/u;
const request = JSON.parse(process.env.RESECT_BRIDGE_REQUEST ?? "{}");

function printResult(value) {
  process.stdout.write(JSON.stringify(value));
}

function getProjectContext(filePath) {
  const tsconfigPath = resect.resolveTsConfig(undefined, path.dirname(filePath));
  if (!tsconfigPath) {
    return null;
  }

  return {
    project: resect.loadProject(tsconfigPath, filePath),
    projectRoot: path.dirname(tsconfigPath),
  };
}

function parseSourceFileFromDisk(filePath) {
  try {
    const sourceText = fs.readFileSync(filePath, "utf8");
    return ts.createSourceFile(
      filePath,
      sourceText,
      ts.ScriptTarget.Latest,
      true,
      filePath.endsWith(".tsx") || filePath.endsWith(".jsx")
        ? ts.ScriptKind.TSX
        : ts.ScriptKind.TS
    );
  } catch {
    return null;
  }
}

function stripKnownExtension(filePath) {
  return filePath.replace(KNOWN_EXTENSIONS, "");
}

function buildAliasSpecifier(targetPath, project) {
  const compilerPaths = project.compilerOptions?.paths ?? {};
  const baseUrl = project.compilerOptions?.baseUrl ?? project.rootDir;

  for (const [aliasPattern, replacements] of Object.entries(compilerPaths)) {
    if (!aliasPattern.includes("*")) {
      continue;
    }

    const aliasPrefix = aliasPattern.split("*")[0] ?? "";

    for (const replacement of replacements) {
      if (!replacement.includes("*")) {
        continue;
      }

      const replacementPrefix = replacement.split("*")[0] ?? "";
      const resolvedPrefix = path.resolve(baseUrl, replacementPrefix);

      if (!targetPath.startsWith(resolvedPrefix)) {
        continue;
      }

      const suffix = targetPath
        .slice(resolvedPrefix.length)
        .replace(/^[/\\]/u, "")
        .replace(KNOWN_EXTENSIONS, "")
        .replace(/\\/gu, "/");

      return aliasPrefix + suffix;
    }
  }

  return null;
}

function resolveExportOwner(modulePath, exportName, project, visited = new Set()) {
  if (visited.has(modulePath)) {
    return null;
  }
  visited.add(modulePath);

  const sourceFile = parseSourceFileFromDisk(modulePath);
  if (!sourceFile) {
    return null;
  }

  const localExports = resect.scanExports(sourceFile);
  if (
    localExports.some(
      (entry) => entry.name === exportName && entry.type !== "default" && !entry.isType
    )
  ) {
    return modulePath;
  }

  const barrelExports = resect.scanBarrelExports(sourceFile, project);
  for (const barrel of barrelExports) {
    for (const entry of barrel.exports) {
      if (entry.type === "named") {
        const exportedName = entry.alias ?? entry.name;
        if (exportedName === exportName) {
          return (
            resolveExportOwner(
              barrel.resolvedPath,
              entry.name ?? exportName,
              project,
              visited
            ) ?? barrel.resolvedPath
          );
        }
      }

      if (entry.type === "all") {
        const nestedOwner = resolveExportOwner(
          barrel.resolvedPath,
          exportName,
          project,
          visited
        );

        if (nestedOwner) {
          return nestedOwner;
        }
      }
    }
  }

  return null;
}

async function resolveDirectImports(payload) {
  const projectContext = getProjectContext(payload.filePath);
  if (!projectContext) {
    return [];
  }

  const resolved = resect.resolveModuleSpecifier(
    payload.specifier,
    payload.filePath,
    projectContext.project
  );

  if (resolved.kind !== "resolved") {
    return [];
  }

  return payload.bindings
    .map((binding) => {
      const ownerPath = resolveExportOwner(
        resolved.path,
        binding.importedName,
        projectContext.project
      );

      if (!ownerPath || ownerPath === resolved.path) {
        return null;
      }

      const aliasSpecifier = buildAliasSpecifier(ownerPath, projectContext.project);
      const newSpecifier =
        aliasSpecifier ??
        resect.calculateNewSpecifier(
          payload.specifier,
          payload.filePath,
          resolved.path,
          ownerPath,
          projectContext.project
        );

      if (!newSpecifier || newSpecifier === payload.specifier) {
        return null;
      }

      return {
        importedName: binding.importedName,
        newSpecifier,
        pathSegment: path.basename(stripKnownExtension(ownerPath)),
        targetPath: ownerPath,
      };
    })
    .filter((entry) => entry !== null);
}

async function canonicalizeImport(payload) {
  const projectContext = getProjectContext(payload.filePath);
  if (!projectContext) {
    return null;
  }

  const resolved = resect.resolveModuleSpecifier(
    payload.specifier,
    payload.filePath,
    projectContext.project
  );

  if (resolved.kind !== "resolved") {
    return null;
  }

  const candidates = [];
  const aliasSpecifier =
    buildAliasSpecifier(resolved.path, projectContext.project) ??
    resect.findAliasForPath(resolved.path, projectContext.project);
  const relativeSpecifier = resect.calculateRelativeSpecifier(
    payload.filePath,
    resolved.path,
    payload.specifier
  );
  const workspace = await resect.discoverWorkspace(projectContext.projectRoot);
  const workspaceSpecifier = workspace
    ? resect.findCrossPackageImport(resolved.path, workspace, false)
    : null;

  if (workspaceSpecifier) {
    candidates.push({ nextSpecifier: workspaceSpecifier, strategy: "workspace" });
  }
  if (aliasSpecifier) {
    candidates.push({ nextSpecifier: aliasSpecifier, strategy: "alias" });
  }
  if (relativeSpecifier) {
    candidates.push({ nextSpecifier: relativeSpecifier, strategy: "relative" });
  }

  const uniqueCandidates = candidates.filter(
    (candidate, index) =>
      candidate.nextSpecifier !== payload.specifier &&
      candidates.findIndex(
        (other) => other.nextSpecifier === candidate.nextSpecifier
      ) === index
  );

  if (uniqueCandidates.length === 0) {
    return null;
  }

  if (payload.prefer === "alias") {
    return (
      uniqueCandidates.find((candidate) => candidate.strategy === "workspace") ??
      uniqueCandidates.find((candidate) => candidate.strategy === "alias") ??
      uniqueCandidates[0] ??
      null
    );
  }

  return (
    uniqueCandidates
      .sort((left, right) => {
        if (left.nextSpecifier.length !== right.nextSpecifier.length) {
          return left.nextSpecifier.length - right.nextSpecifier.length;
        }

        const rank = {
          workspace: 0,
          alias: 1,
          relative: 2,
        };

        return rank[left.strategy] - rank[right.strategy];
      })[0] ?? null
  );
}

function collectUnresolvableImports(payload) {
  const projectContext = getProjectContext(payload.filePath);
  if (!projectContext) {
    return [];
  }

  const sourceFile = ts.createSourceFile(
    payload.filePath,
    payload.sourceText,
    ts.ScriptTarget.Latest,
    true,
    payload.filePath.endsWith(".tsx") || payload.filePath.endsWith(".jsx")
      ? ts.ScriptKind.TSX
      : ts.ScriptKind.TS
  );

  const diagnostics = [];

  function pushDiagnostic(specifier, node, type) {
    const resolved = resect.resolveModuleSpecifier(
      specifier,
      payload.filePath,
      projectContext.project
    );

    if (resolved.kind === "resolved") {
      return;
    }

    const location = sourceFile.getLineAndCharacterOfPosition(
      node.getStart(sourceFile)
    );

    diagnostics.push({
      column: location.character + 1,
      diagnostic: resolved.diagnostic,
      line: location.line + 1,
      specifier,
      type,
    });
  }

  function visit(node) {
    if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier)) {
      pushDiagnostic(node.moduleSpecifier.text, node, "import");
    } else if (
      ts.isExportDeclaration(node) &&
      node.moduleSpecifier &&
      ts.isStringLiteral(node.moduleSpecifier)
    ) {
      pushDiagnostic(node.moduleSpecifier.text, node, "export-from");
    } else if (ts.isCallExpression(node)) {
      const firstArgument = node.arguments[0];
      if (firstArgument && ts.isStringLiteral(firstArgument)) {
        if (node.expression.kind === ts.SyntaxKind.ImportKeyword) {
          pushDiagnostic(firstArgument.text, node, "import-dynamic");
        } else if (ts.isIdentifier(node.expression) && node.expression.text === "require") {
          pushDiagnostic(firstArgument.text, node, "require");
        } else if (
          ts.isPropertyAccessExpression(node.expression) &&
          ts.isIdentifier(node.expression.expression) &&
          node.expression.expression.text === "require" &&
          node.expression.name.text === "resolve"
        ) {
          pushDiagnostic(firstArgument.text, node, "require-resolve");
        } else if (
          ts.isPropertyAccessExpression(node.expression) &&
          ts.isIdentifier(node.expression.expression) &&
          ts.isIdentifier(node.expression.name)
        ) {
          const objectName = node.expression.expression.text;
          const methodName = node.expression.name.text;
          if (
            (objectName === "jest" || objectName === "vi" || objectName === "vitest") &&
            (methodName === "mock" || methodName === "doMock" || methodName === "unmock")
          ) {
            pushDiagnostic(firstArgument.text, node, "jest-mock");
          }
        }
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return diagnostics;
}

try {
  let result = null;

  if (request.operation === "resolve-direct-imports") {
    result = await resolveDirectImports(request);
  } else if (request.operation === "canonicalize-import") {
    result = await canonicalizeImport(request);
  } else if (request.operation === "scan-unresolvable-imports") {
    result = collectUnresolvableImports(request);
  } else {
    result = null;
  }

  printResult({
    ok: true,
    result,
  });
} catch (error) {
  printResult({
    ok: false,
    error: error instanceof Error ? error.message : String(error),
  });
  process.exitCode = 1;
}
`;

function getCacheKey(request: SyncBridgeRequest): string {
  return JSON.stringify(request);
}

function runBridgeRequest<TResult>(request: SyncBridgeRequest): TResult | null {
  const cacheKey = getCacheKey(request);
  const cachedResult = bridgeResultCache.get(cacheKey);
  if (cachedResult !== undefined) {
    return cachedResult as TResult | null;
  }

  const result = spawnSync(
    process.execPath,
    ["--input-type=module", "-e", RESECT_SYNC_BRIDGE_SCRIPT],
    {
      encoding: "utf8",
      env: {
        ...process.env,
        RESECT_BRIDGE_REQUEST: cacheKey,
      },
      maxBuffer: 1024 * 1024 * 8,
    }
  );

  if (result.status !== 0 || !result.stdout) {
    bridgeResultCache.set(cacheKey, null);
    return null;
  }

  try {
    const parsed = JSON.parse(result.stdout) as
      | { ok: true; result: TResult }
      | { error: string; ok: false };

    if (!parsed.ok) {
      bridgeResultCache.set(cacheKey, null);
      return null;
    }

    bridgeResultCache.set(cacheKey, parsed.result);
    return parsed.result;
  } catch {
    bridgeResultCache.set(cacheKey, null);
    return null;
  }
}

export function resolveDirectImportsSync(request: {
  bindings: DirectImportBindingRequest[];
  filePath: string;
  specifier: string;
}): DirectImportResolution[] | null {
  return runBridgeRequest<DirectImportResolution[]>({
    ...request,
    operation: "resolve-direct-imports",
  });
}

export function canonicalizeImportSync(request: {
  filePath: string;
  prefer: "alias" | "shortest";
  specifier: string;
}): CanonicalImportResolution | null {
  return runBridgeRequest<CanonicalImportResolution>({
    ...request,
    operation: "canonicalize-import",
  });
}

export function scanUnresolvableImportsSync(request: {
  filePath: string;
  sourceText: string;
}): UnresolvableImportDiagnostic[] | null {
  return runBridgeRequest<UnresolvableImportDiagnostic[]>({
    ...request,
    operation: "scan-unresolvable-imports",
  });
}
