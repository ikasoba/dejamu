import { DejamuPlugin } from "../core/plugins/Plugin.ts";

export interface Config {
  /** glob patterns */
  entryPoints: string[];

  /** esbuild plugins */
  plugins: DejamuPlugin[];
}
