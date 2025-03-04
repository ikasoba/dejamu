import { BuildOptions, Plugin as EsbuildPlugin } from "../deps/esbuild.ts";
import { glob } from "../utils/glob.ts";
import { Config } from "./Config.ts";
import {
  denoResolverPlugin,
} from "../deps/esbuild_deno_loader.ts";
import * as path from "../deps/path.ts";
import { createResolverCache } from "./resolver/cache.ts";
import { dependencyResolver } from "./resolver/dependency.ts";
import { specifierResolver } from "./resolver/specifier.ts";

const resolverCache = createResolverCache();

export const getOption = async (config: Config, plugins: EsbuildPlugin[]) => {
  const esbuildOptions: BuildOptions = {
    entryPoints: (await Promise.all(config.entryPoints.map((x) => glob(x))))
      .flat()
      .map((x) => path.relative(Deno.cwd(), x)),
    target: "es2020",

    plugins: [
      ...plugins,
      dependencyResolver(resolverCache),
      denoResolverPlugin({ configPath: path.resolve("deno.json") }),
      specifierResolver(resolverCache)
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
      isBrowser: "true",
    },
  };

  return esbuildOptions;
};
