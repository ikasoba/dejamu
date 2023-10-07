import { Plugin as EsbuildPlugin } from "../deps/esbuild.ts";
import { DejamuPluginBase } from "./DejamuPluginBase.ts";

export type DejamuPlugin =
  | {
    type: "esbuild";
    plugin: EsbuildPlugin;
  }
  | {
    type: "dejamu";
    plugin: DejamuPluginBase;
  };
