import { BuildOptions, context } from "../deps/esbuild.ts";
import { glob } from "./glob.ts";
import { Config } from "./Config.ts";
import { denoPlugins } from "../deps/esbuild_deno_loader.ts";
import * as path from "../deps/path.ts";

export const getContext = async (config: Config) => {
  const esbuildOptions: BuildOptions = {
    entryPoints: (await Promise.all(
      config.entryPoints.map((x) => glob(x)),
    )).flat().map((x) => path.relative(Deno.cwd(), x.path)),
    target: "es2020",
    plugins: [
      ...(config.plugins ?? []),
      ...denoPlugins({ configPath: path.resolve("deno.json") }),
    ],
    outdir: ".out/",
    format: "esm",
    bundle: true,
    splitting: true,
    treeShaking: true,
    platform: "browser",
    jsx: "automatic",
    jsxImportSource: "npm:preact",
    define: {
      "isBrowser": "true",
    },
  };

  return await context(esbuildOptions);
};
