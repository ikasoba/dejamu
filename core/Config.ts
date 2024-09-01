import { DejamuPlugin } from "../pluginSystem/Plugin.ts";

export interface Config {
  /** glob patterns */
  entryPoints: string[];

  /** esbuild plugins */
  plugins: DejamuPlugin[];
}
