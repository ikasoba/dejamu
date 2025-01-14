import { ComponentType } from "npm:preact";
import * as fs from "../../../deps/fs.ts";
import * as path from "../../../deps/path.ts";
import { createIdGenerator } from "../../../utils/id.ts";

const id = createIdGenerator();

export interface Island {
  id: string;
  modulePath: string;
  exportName: string;
  component: ComponentType;
}

export interface IslandsState {
  islands: Island[];
  loadedModules: Set<string>;
}

let current: IslandsState;

export const getIslandsState = () => current;

export const initIslandsState = () => {
  current = {
    islands: [],
    loadedModules: new Set(),
  };
};

initIslandsState();

export const filterIslandsFiles = (paths: string[]) => {
  return paths.filter((x) => /\.islands\.[jt]sx$/.test(x));
};

export async function registerIslands(root: string) {
  for await (const item of fs.expandGlob("**/*.islands.{jsx,tsx}", { root })) {
    await registerIsland(item.path);
  }
}

export async function registerIsland(islandPath: string) {
  const modulePath = path.toFileUrl(islandPath).toString();
  if (current.loadedModules.has(modulePath)) return;

  current.loadedModules.add(modulePath);

  const module = await import(modulePath);

  for (const [k, v] of Object.entries(module)) {
    if (typeof v != "function") continue;

    current.islands.push({
      id: id(),
      modulePath: modulePath,
      exportName: k,
      component: v as any,
    });
  }
}

export function replaceIsland(islandPath: string, module: object) {
  const modulePath = path.toFileUrl(islandPath).toString();
  current.loadedModules.add(modulePath);
  
  for (const [k, v] of Object.entries(module)) {
    if (typeof v != "function") continue;

    current.islands.push({
      id: id(),
      modulePath: modulePath,
      exportName: k,
      component: v as any,
    });
  }
}

export const collectIslands = (islands: Omit<Island, "component">[]) => {
  const reviveArgData: [string, string][] = [];

  for (const island of islands) {
    reviveArgData.push([island.id, `import(${JSON.stringify(island.modulePath)}).then(x => x.${island.exportName})`]);
  }

  const reviveArg =
    "{" +
    reviveArgData.map(([k, expr]) => `${JSON.stringify(k)}: ${expr}`).join(",") +
    "}";

  return {
    reviveArg,
  };
};
