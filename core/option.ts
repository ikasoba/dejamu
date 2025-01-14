import { BuildOptions, Plugin as EsbuildPlugin } from "../deps/esbuild.ts";
import { glob } from "../utils/glob.ts";
import { Config } from "./Config.ts";
import {
  deno,
  denoResolverPlugin,
  esbuildResolutionToURL,
} from "../deps/esbuild_deno_loader.ts";
import * as path from "../deps/path.ts";
import * as denoResolver from "jsr:@miyauci/deno-module-resolver@1.0.0-beta.2";

const infoCache = new deno.InfoCache();

const npmImporterCache = new Map<
  string,
  Awaited<ReturnType<typeof denoResolver.resolve>>
>();

const npmResolveCache = new Map<
  string,
  Awaited<ReturnType<typeof denoResolver.resolve>>
>();

const urlImporterCache = new Map<string, deno.ModuleEntry>();

export const getOption = async (config: Config, plugins: EsbuildPlugin[]) => {
  const esbuildOptions: BuildOptions = {
    entryPoints: (await Promise.all(config.entryPoints.map((x) => glob(x))))
      .flat()
      .map((x) => path.relative(Deno.cwd(), x)),
    target: "es2020",

    plugins: [
      ...plugins,
      {
        name: "dependency-resolver",
        setup(build) {
          build.onResolve({ filter: /^\.+\/|^\//, namespace: "file" }, async (args) => {
            const importer = urlImporterCache.get(args.importer);

            if (!importer || !("kind" in importer)) return;

            if (importer.kind == "esm") {
              const url = new URL(args.path, importer.specifier);
              
              return build.resolve(url.href.slice(url.protocol.length), {
                kind: args.kind,
                importer: args.importer,
                resolveDir: args.resolveDir,
                namespace: url.protocol.slice(0, -1)
              });
            }
          });

          build.onResolve({ filter: /^/, namespace: "file" }, async (args) => {
            if (/^\.|^\/|^[a-z]+\:/.test(args.path)) return;

            const importer = npmImporterCache.get(args.importer);

            const packages = importer?.context?.source.npmPackages;

            if (packages) {
              const pkg = Object.values(packages).find((x) => x.name);
              if (!pkg) {
                return;
              }

              const path = args.path.replace(
                /^[^/]+(?=\/|$)/,
                `npm:/${pkg.name}@${pkg.version}`,
              );

              const resolved = npmResolveCache.get(
                path + "\n" + importer.context?.module.specifier,
              ) ??
                (await denoResolver.resolve(path, args.importer));

              npmResolveCache.set(
                path + "\n" + importer.context?.module.specifier,
                resolved,
              );

              return {
                path: resolved.url.pathname,
              };
            }

            return;
          });
        },
      },
      denoResolverPlugin({ configPath: path.resolve("deno.json") }),
      {
        name: "specifier-resolver",
        setup(build) {
          build.onResolve({ filter: /^/ }, async (args) => {
            if (args.namespace == "file") {
              return {
                path: args.path,
              };
            } else {
              const specifier = esbuildResolutionToURL(args);
              const entry = await infoCache.get(specifier.href);

              if (!("kind" in entry)) return;

              if (entry.kind == "npm") {
                const resolved = npmResolveCache.get(specifier.href) ??
                  await denoResolver.resolve(
                    specifier.href,
                    args.importer,
                  );

                npmImporterCache.set(resolved.url.pathname, resolved);
                npmResolveCache.set(specifier.href, resolved);

                return {
                  path: resolved.url.pathname,
                };
              } else if (entry.kind == "esm" && specifier.protocol == "jsr:") {
                const url = new URL(entry.specifier);

                return build.resolve(url.href.slice(url.protocol.length), {
                  kind: args.kind,
                  importer: args.importer,
                  resolveDir: args.resolveDir,
                  namespace: url.protocol.slice(0, -1),
                });
              } else if (entry.kind == "esm") {
                urlImporterCache.set((entry.emit ?? entry.local)!, entry);

                return {
                  path: (entry.emit ?? entry.local)!,
                };
              }
            }
          });
        },
      },
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
