import { TextDecoder, TextEncoder } from "node:util";
import { Worker } from "node:worker_threads";

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

export interface UnresolvableSpecifierDiagnostic {
  diagnostic: string;
  specifier: string;
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
      operation: "resolve-specifiers";
      specifiers: string[];
    };

type BridgeResponse<TResult> =
  | { ok: true; result: TResult }
  | { error: string; ok: false };

interface BridgeWorkerState {
  control: Int32Array;
  requestBuffer: Uint8Array;
  responseBuffer: Uint8Array;
  worker: Worker;
}

interface WorkerBridgeResult<TResult> {
  handled: boolean;
  result: TResult | null;
}

const bridgeResultCache = new Map<string, unknown>();

const STATE_IDLE = 0;
const STATE_REQUEST = 1;
const STATE_RESPONSE = 2;
const BRIDGE_STATE_INDEX = 0;
const BRIDGE_REQUEST_LENGTH_INDEX = 1;
const BRIDGE_RESPONSE_LENGTH_INDEX = 2;
const BRIDGE_CONTROL_SLOTS = 4;
const BRIDGE_CONTROL_BYTE_LENGTH =
  Int32Array.BYTES_PER_ELEMENT * BRIDGE_CONTROL_SLOTS;
const BRIDGE_REQUEST_BYTE_LENGTH = 1024 * 1024 * 16;
const BRIDGE_RESPONSE_BYTE_LENGTH = 1024 * 1024 * 16;
const BRIDGE_REQUEST_OFFSET = BRIDGE_CONTROL_BYTE_LENGTH;
const BRIDGE_RESPONSE_OFFSET =
  BRIDGE_REQUEST_OFFSET + BRIDGE_REQUEST_BYTE_LENGTH;
const BRIDGE_SHARED_BUFFER_BYTE_LENGTH =
  BRIDGE_CONTROL_BYTE_LENGTH +
  BRIDGE_REQUEST_BYTE_LENGTH +
  BRIDGE_RESPONSE_BYTE_LENGTH;
const BRIDGE_WORKER_TIMEOUT_MS = 60_000;

let bridgeWorkerState: BridgeWorkerState | null = null;
let bridgeWorkerDisabled = false;

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

const RESECT_BRIDGE_CORE_SCRIPT = String.raw`
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");

globalThis.Bun ??= { Glob: class Glob {} };

const KNOWN_EXTENSIONS = /\.(tsx?|jsx?|mts|cts|mjs|cjs|vue)$/u;
let resectApiPromise = null;
const projectDiscoveryCache = new Map();
const projectContextCache = new Map();
const workspaceCache = new Map();

async function loadResectApi() {
  if (!resectApiPromise) {
    resectApiPromise = Promise.all([
      import("@mherod/resect"),
      import("@mherod/resect/node"),
    ]).then(([resect, resectNode]) => {
      resect.setRuntime(resectNode.nodeRuntime);
      return resect;
    });
  }

  return resectApiPromise;
}

async function getProjectContext(filePath) {
  const resect = await loadResectApi();
  const normalizedFilePath = path.resolve(filePath);
  const tsconfigPath = resect.resolveTsConfig(
    undefined,
    path.dirname(normalizedFilePath)
  );

  if (!tsconfigPath) {
    return null;
  }

  const projectDir = path.dirname(tsconfigPath);
  let discovery = projectDiscoveryCache.get(projectDir);
  if (!discovery && typeof resect.discoverProject === "function") {
    discovery = resect.discoverProject(projectDir);
    projectDiscoveryCache.set(projectDir, discovery);
  }

  const owningConfig =
    discovery && typeof resect.findOwningConfig === "function"
      ? resect.findOwningConfig(normalizedFilePath, discovery)
      : undefined;
  const effectiveTsconfigPath = owningConfig?.path ?? tsconfigPath;

  let project = projectContextCache.get(effectiveTsconfigPath);
  if (!project) {
    project = resect.loadProject(
      effectiveTsconfigPath,
      owningConfig ? undefined : normalizedFilePath
    );
    projectContextCache.set(effectiveTsconfigPath, project);
  }

  return {
    project,
    projectRoot: path.dirname(effectiveTsconfigPath),
    resect,
  };
}

async function getWorkspace(projectContext) {
  const cachedWorkspace = workspaceCache.get(projectContext.projectRoot);
  if (cachedWorkspace !== undefined) {
    return cachedWorkspace;
  }

  const workspace = await projectContext.resect.discoverWorkspace(
    projectContext.projectRoot
  );
  workspaceCache.set(projectContext.projectRoot, workspace);
  return workspace;
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

function resolveExportOwner(
  modulePath,
  exportName,
  project,
  resect,
  visited = new Set()
) {
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
              resect,
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
          resect,
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
  const projectContext = await getProjectContext(payload.filePath);
  if (!projectContext) {
    return [];
  }

  const { project, resect } = projectContext;
  const resolved = resect.resolveModuleSpecifier(
    payload.specifier,
    payload.filePath,
    project
  );

  if (resolved.kind !== "resolved") {
    return [];
  }

  return payload.bindings
    .map((binding) => {
      const ownerPath = resolveExportOwner(
        resolved.path,
        binding.importedName,
        project,
        resect
      );

      if (!ownerPath || ownerPath === resolved.path) {
        return null;
      }

      const aliasSpecifier = buildAliasSpecifier(ownerPath, project);
      const newSpecifier =
        aliasSpecifier ??
        resect.calculateNewSpecifier(
          payload.specifier,
          payload.filePath,
          resolved.path,
          ownerPath,
          project
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
  const projectContext = await getProjectContext(payload.filePath);
  if (!projectContext) {
    return null;
  }

  const { project, resect } = projectContext;
  const resolved = resect.resolveModuleSpecifier(
    payload.specifier,
    payload.filePath,
    project
  );

  if (resolved.kind !== "resolved") {
    return null;
  }

  const candidates = [];
  const aliasSpecifier =
    buildAliasSpecifier(resolved.path, project) ??
    resect.findAliasForPath(resolved.path, project);
  const relativeSpecifier = resect.calculateRelativeSpecifier(
    payload.filePath,
    resolved.path,
    payload.specifier
  );
  const workspace = await getWorkspace(projectContext);
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

async function resolveSpecifiers(payload) {
  const projectContext = await getProjectContext(payload.filePath);
  if (!projectContext) {
    return [];
  }

  const { project, resect } = projectContext;
  const diagnostics = [];

  for (const specifier of payload.specifiers) {
    const resolved = resect.resolveModuleSpecifier(
      specifier,
      payload.filePath,
      project
    );

    if (resolved.kind !== "resolved") {
      diagnostics.push({
        diagnostic: resolved.diagnostic,
        specifier,
      });
    }
  }

  return diagnostics;
}

async function handleBridgeRequest(request) {
  if (request.operation === "resolve-direct-imports") {
    return resolveDirectImports(request);
  }

  if (request.operation === "canonicalize-import") {
    return canonicalizeImport(request);
  }

  if (request.operation === "resolve-specifiers") {
    return resolveSpecifiers(request);
  }

  return null;
}
`;

const RESECT_SYNC_BRIDGE_WORKER_SCRIPT = `
const { workerData } = require("node:worker_threads");
${RESECT_BRIDGE_CORE_SCRIPT}

const STATE_IDLE = ${STATE_IDLE};
const STATE_REQUEST = ${STATE_REQUEST};
const STATE_RESPONSE = ${STATE_RESPONSE};
const BRIDGE_STATE_INDEX = ${BRIDGE_STATE_INDEX};
const BRIDGE_REQUEST_LENGTH_INDEX = ${BRIDGE_REQUEST_LENGTH_INDEX};
const BRIDGE_RESPONSE_LENGTH_INDEX = ${BRIDGE_RESPONSE_LENGTH_INDEX};
const control = new Int32Array(
  workerData.sharedBuffer,
  0,
  ${BRIDGE_CONTROL_SLOTS}
);
const requestBuffer = new Uint8Array(
  workerData.sharedBuffer,
  ${BRIDGE_REQUEST_OFFSET},
  workerData.requestByteLength
);
const responseBuffer = new Uint8Array(
  workerData.sharedBuffer,
  ${BRIDGE_RESPONSE_OFFSET},
  workerData.responseByteLength
);
const workerTextEncoder = new TextEncoder();
const workerTextDecoder = new TextDecoder();

function writeWorkerResponse(value) {
  let encoded = workerTextEncoder.encode(JSON.stringify(value));
  if (encoded.byteLength > responseBuffer.byteLength) {
    encoded = workerTextEncoder.encode(
      JSON.stringify({
        ok: false,
        error: "Bridge response exceeded shared buffer size",
      })
    );
  }

  responseBuffer.fill(0);
  responseBuffer.set(encoded);
  Atomics.store(
    control,
    BRIDGE_RESPONSE_LENGTH_INDEX,
    encoded.byteLength
  );
  Atomics.store(control, BRIDGE_STATE_INDEX, STATE_RESPONSE);
  Atomics.notify(control, BRIDGE_STATE_INDEX);
}

async function handleCurrentRequest() {
  const requestLength = Atomics.load(control, BRIDGE_REQUEST_LENGTH_INDEX);
  const requestText = workerTextDecoder.decode(
    requestBuffer.subarray(0, requestLength)
  );

  try {
    const request = JSON.parse(requestText);
    const result = await handleBridgeRequest(request);
    writeWorkerResponse({
      ok: true,
      result,
    });
  } catch (error) {
    writeWorkerResponse({
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

async function runWorkerLoop() {
  while (true) {
    Atomics.wait(control, BRIDGE_STATE_INDEX, STATE_IDLE);
    if (Atomics.load(control, BRIDGE_STATE_INDEX) !== STATE_REQUEST) {
      continue;
    }

    await handleCurrentRequest();
  }
}

runWorkerLoop().catch((error) => {
  writeWorkerResponse({
    ok: false,
    error: error instanceof Error ? error.message : String(error),
  });
});
`;

function getCacheKey(request: SyncBridgeRequest): string {
  return JSON.stringify(request);
}

function clearBridgeWorker(state: BridgeWorkerState): void {
  if (bridgeWorkerState === state) {
    bridgeWorkerState = null;
  }
}

function disableBridgeWorker(state: BridgeWorkerState): void {
  bridgeWorkerDisabled = true;
  clearBridgeWorker(state);
  state.worker.terminate();
}

function getBridgeWorker(): BridgeWorkerState | null {
  if (bridgeWorkerDisabled) {
    return null;
  }

  if (bridgeWorkerState) {
    return bridgeWorkerState;
  }

  try {
    const sharedBuffer = new SharedArrayBuffer(
      BRIDGE_SHARED_BUFFER_BYTE_LENGTH
    );
    const control = new Int32Array(sharedBuffer, 0, BRIDGE_CONTROL_SLOTS);
    const requestBuffer = new Uint8Array(
      sharedBuffer,
      BRIDGE_REQUEST_OFFSET,
      BRIDGE_REQUEST_BYTE_LENGTH
    );
    const responseBuffer = new Uint8Array(
      sharedBuffer,
      BRIDGE_RESPONSE_OFFSET,
      BRIDGE_RESPONSE_BYTE_LENGTH
    );
    const worker = new Worker(RESECT_SYNC_BRIDGE_WORKER_SCRIPT, {
      eval: true,
      workerData: {
        requestByteLength: BRIDGE_REQUEST_BYTE_LENGTH,
        responseByteLength: BRIDGE_RESPONSE_BYTE_LENGTH,
        sharedBuffer,
      },
    });

    const state = {
      control,
      requestBuffer,
      responseBuffer,
      worker,
    };

    worker.unref();
    worker.once("error", () => {
      bridgeWorkerDisabled = true;
      clearBridgeWorker(state);
    });
    worker.once("exit", () => {
      clearBridgeWorker(state);
    });

    bridgeWorkerState = state;
    return state;
  } catch {
    bridgeWorkerDisabled = true;
    return null;
  }
}

function runBridgeWorkerRequest<TResult>(
  cacheKey: string
): WorkerBridgeResult<TResult> {
  const state = getBridgeWorker();
  if (
    !state ||
    Atomics.load(state.control, BRIDGE_STATE_INDEX) !== STATE_IDLE
  ) {
    return {
      handled: false,
      result: null,
    };
  }

  const encodedRequest = textEncoder.encode(cacheKey);
  if (encodedRequest.byteLength > state.requestBuffer.byteLength) {
    return {
      handled: false,
      result: null,
    };
  }

  state.requestBuffer.fill(0);
  state.requestBuffer.set(encodedRequest);
  Atomics.store(
    state.control,
    BRIDGE_REQUEST_LENGTH_INDEX,
    encodedRequest.byteLength
  );
  Atomics.store(state.control, BRIDGE_STATE_INDEX, STATE_REQUEST);
  Atomics.notify(state.control, BRIDGE_STATE_INDEX);

  const waitResult = Atomics.wait(
    state.control,
    BRIDGE_STATE_INDEX,
    STATE_REQUEST,
    BRIDGE_WORKER_TIMEOUT_MS
  );

  if (waitResult === "timed-out") {
    disableBridgeWorker(state);
    return {
      handled: false,
      result: null,
    };
  }

  if (Atomics.load(state.control, BRIDGE_STATE_INDEX) !== STATE_RESPONSE) {
    disableBridgeWorker(state);
    return {
      handled: false,
      result: null,
    };
  }

  const responseLength = Atomics.load(
    state.control,
    BRIDGE_RESPONSE_LENGTH_INDEX
  );
  const responseText = textDecoder.decode(
    state.responseBuffer.subarray(0, responseLength)
  );
  Atomics.store(state.control, BRIDGE_STATE_INDEX, STATE_IDLE);
  Atomics.notify(state.control, BRIDGE_STATE_INDEX);

  try {
    const parsed = JSON.parse(responseText) as BridgeResponse<TResult>;
    return {
      handled: true,
      result: parsed.ok ? parsed.result : null,
    };
  } catch {
    disableBridgeWorker(state);
    return {
      handled: false,
      result: null,
    };
  }
}

function runBridgeRequest<TResult>(request: SyncBridgeRequest): TResult | null {
  const cacheKey = getCacheKey(request);
  const cachedResult = bridgeResultCache.get(cacheKey);
  if (cachedResult !== undefined) {
    return cachedResult as TResult | null;
  }

  const workerResult = runBridgeWorkerRequest<TResult>(cacheKey);
  if (workerResult.handled) {
    bridgeResultCache.set(cacheKey, workerResult.result);
    return workerResult.result;
  }

  // Avoid a cold Node child process per bridge miss. If the persistent worker
  // cannot serve a request, keep the rule conservative for this request.
  bridgeResultCache.set(cacheKey, null);
  return null;
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

export function resolveSpecifiersSync(request: {
  filePath: string;
  specifiers: string[];
}): UnresolvableSpecifierDiagnostic[] | null {
  return runBridgeRequest<UnresolvableSpecifierDiagnostic[]>({
    ...request,
    operation: "resolve-specifiers",
  });
}
