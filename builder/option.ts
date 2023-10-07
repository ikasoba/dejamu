import { BuildOptions, Plugin as EsbuildPlugin } from "../deps/esbuild.ts";
import { glob } from "./glob.ts";
import { Config } from "./Config.ts";
import { denoPlugins } from "../deps/esbuild_deno_loader.ts";
import * as path from "../deps/path.ts";

export const getOption = async (config: Config, plugins: EsbuildPlugin[]) => {
  const esbuildOptions: BuildOptions = {
    entryPoints: (await Promise.all(
      config.entryPoints.map((x) => glob(x)),
    )).flat().map((x) => path.relative(Deno.cwd(), x.path)),
    target: "es2020",
    plugins: [
      ...plugins,
      ...denoPlugins({ configPath: path.resolve("deno.json") }),
    ],
    outdir: ".out/",
    outbase: ".",
    format: "esm",
    bundle: true,
    splitting: true,
    treeShaking: true,
    minify: true,

    platform: "browser",
    jsx: "automatic",
    jsxImportSource: "npm:preact",
    define: {
      "isBrowser": "true",
    },
  };

  return esbuildOptions;
};
