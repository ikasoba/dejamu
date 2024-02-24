import { ComponentType, VNode } from "preact";
import { DejamuPlugin } from "./plugin.ts";
import { DejamuOptions } from "./mod.ts";
import { staticGenerateToFile } from "./staticGenerate.ts";
import * as esbuild from "../deps/esbuild.ts";
import { denoPlugins } from "../deps/esbuild_deno_loader.ts";

export interface OutFile {
  path: string;
  contents: string | Uint8Array;
  deps: string[];
}

export interface IslandsInfo {
  id: number;
  source: URL;
  module: any;
  Component: ComponentType;
}

export interface DejamuContext {
  options: DejamuOptions;
  islands: Map<ComponentType, IslandsInfo>;
  plugins: DejamuPlugin[];
  outfiles: OutFile[];
}

export function createContext(options: DejamuOptions) {
  const context: DejamuContext = {
    options,
    islands: new Map(),
    plugins: [],
    outfiles: [],
  };

  for (const factory of options.plugins) {
    context.plugins.push(factory(context));
  }

  return context;
}
