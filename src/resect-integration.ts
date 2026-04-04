import path from "node:path";

type ResectModule = typeof import("@mherod/resect");
type ResectNodeModule = typeof import("@mherod/resect/node");

export interface ResectApi {
  module: ResectModule;
  nodeRuntime: ResectNodeModule["nodeRuntime"];
}

export interface ResectProjectContext {
  api: ResectApi;
  project: import("@mherod/resect").ProjectConfig;
  projectRoot: string;
  tsconfigPath: string;
}

export interface ResectWorkspaceContext extends ResectProjectContext {
  workspace: import("@mherod/resect").WorkspaceInfo | null;
}

let resectApiPromise: Promise<ResectApi | null> | null = null;
const projectContextCache = new Map<
  string,
  Promise<ResectProjectContext | null>
>();
const workspaceContextCache = new Map<
  string,
  Promise<ResectWorkspaceContext | null>
>();

function ensureBunShim(): void {
  if (!("Bun" in globalThis)) {
    (
      globalThis as typeof globalThis & {
        Bun: { Glob: new (...args: never[]) => unknown };
      }
    ).Bun = {
      Glob: class Glob {},
    };
  }
}

export function loadResectApi(): Promise<ResectApi | null> {
  if (!resectApiPromise) {
    resectApiPromise = (async (): Promise<ResectApi | null> => {
      try {
        ensureBunShim();

        const [resectModule, resectNodeModule] = await Promise.all([
          import("@mherod/resect"),
          import("@mherod/resect/node"),
        ]);

        resectModule.setRuntime(resectNodeModule.nodeRuntime);

        return {
          module: resectModule,
          nodeRuntime: resectNodeModule.nodeRuntime,
        };
      } catch {
        return null;
      }
    })();
  }

  return resectApiPromise;
}

export function loadResectProjectForFile(
  filePath: string
): Promise<ResectProjectContext | null> {
  const normalizedFilePath = path.resolve(filePath);

  const cachedContext = projectContextCache.get(normalizedFilePath);
  if (cachedContext) {
    return cachedContext;
  }

  const contextPromise = (async (): Promise<ResectProjectContext | null> => {
    const api = await loadResectApi();
    if (!api) {
      return null;
    }

    const tsconfigPath = api.module.resolveTsConfig(
      undefined,
      path.dirname(normalizedFilePath)
    );

    if (!tsconfigPath) {
      return null;
    }

    const project = api.module.loadProject(tsconfigPath, normalizedFilePath);

    return {
      api,
      project,
      projectRoot: path.dirname(tsconfigPath),
      tsconfigPath,
    };
  })();

  projectContextCache.set(normalizedFilePath, contextPromise);
  return contextPromise;
}

export function loadResectWorkspaceForFile(
  filePath: string
): Promise<ResectWorkspaceContext | null> {
  const normalizedFilePath = path.resolve(filePath);

  const cachedContext = workspaceContextCache.get(normalizedFilePath);
  if (cachedContext) {
    return cachedContext;
  }

  const contextPromise = (async (): Promise<ResectWorkspaceContext | null> => {
    const projectContext = await loadResectProjectForFile(normalizedFilePath);
    if (!projectContext) {
      return null;
    }

    const workspace = await projectContext.api.module.discoverWorkspace(
      projectContext.projectRoot
    );

    return {
      ...projectContext,
      workspace,
    };
  })();

  workspaceContextCache.set(normalizedFilePath, contextPromise);
  return contextPromise;
}
