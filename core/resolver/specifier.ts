
import { Plugin as EsbuildPlugin } from "../../deps/esbuild.ts";
import {
  esbuildResolutionToURL,
} from "../../deps/esbuild_deno_loader.ts";
import * as denoResolver from "../../deps/deno_module_resolver.ts";
import { ResolverCache } from "./cache.ts";

export function specifierResolver(cache: ResolverCache): EsbuildPlugin {
  return {
    name: "specifier-resolver",
    setup(build) {
      build.onLoad({ filter: /^/ }, async (args) => {
        if (args.pluginData?.loader) {
          return {
            loader: args.pluginData.loader,
            contents: await Deno.readFile(args.path),
          };
        }
      });

      build.onResolve({ filter: /^/ }, async (args) => {
        if (args.namespace == "file") {
          return {
            path: args.path,
            pluginData: args.pluginData,
          };
        } else {
          const specifier = esbuildResolutionToURL(args);
          const entry = await cache.infoCache.get(specifier.href);

          if (!("kind" in entry)) return;

          if (entry.kind == "npm") {
            const resolved = cache.npmResolveCache.get(specifier.href) ??
              await denoResolver.resolve(
                specifier.href,
                args.importer,
              );

            cache.npmImporterCache.set(resolved.url.pathname, resolved);
            cache.npmResolveCache.set(specifier.href, resolved);

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
            cache.urlImporterCache.set((entry.emit ?? entry.local)!, entry);

            return {
              path: (entry.emit ?? entry.local)!,
              namespace: "file",
              pluginData: {
                loader: entry.mediaType == "TypeScript"
                  ? "ts"
                  : entry.mediaType == "TSX"
                  ? "tsx"
                  : entry.mediaType == "JavaScript"
                  ? "js"
                  : entry.mediaType == "JSX"
                  ? "jsx"
                  : undefined,
              },
            };
          }
        }
      });
    },
  };
}
