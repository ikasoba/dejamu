import * as esbuild from "../deps/esbuild.ts";
import { denoPlugins } from "../deps/esbuild_deno_loader.ts";
import * as path from "../deps/path.ts";
import { DejamuPluginFactory } from "./plugin.ts";
import { DejamuContext } from "./buildContext.ts";
import { createContext } from "./buildContext.ts";

export interface DejamuOptions {
  root: string;
  pagesRoot: string;
  plugins: DejamuPluginFactory[];
}

export async function resolveEntryPoints(context: DejamuContext) {
  const entryPoints = [];

  for (const plugin of context.plugins) {
    if (plugin.resolveEntryPoints)
      entryPoints.push(...(await plugin.resolveEntryPoints()));
  }

  return entryPoints;
}

export async function build(options: DejamuOptions, entryPoints: string[]) {
  const context = createContext(options);

  const result = await esbuild.build({
    entryPoints: entryPoints,
    write: false,
    plugins: [...context.plugins, ...denoPlugins({ configPath: "deno.json" })],
    outbase: options.root,
  });

  return context;
}
