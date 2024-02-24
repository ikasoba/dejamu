import * as esbuild from "../deps/esbuild.ts";
import { DejamuContext } from "./buildContext.ts";

export type Awaitable<T> = T | PromiseLike<T>;

export interface DejamuPlugin extends esbuild.Plugin {
  resolveEntryPoints?(): Awaitable<string[]>;
}

export interface DejamuPluginFactory {
  (ctx: DejamuContext): DejamuPlugin;
}
