import { Plugin } from "../deps/esbuild.ts";

export interface Config {
  /** glob patterns */
  entryPoints: string[];

  /** esbuild plugins */
  plugins: Plugin[];
}
