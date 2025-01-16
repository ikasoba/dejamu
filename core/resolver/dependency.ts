import { Plugin as EsbuildPlugin } from "../../deps/esbuild.ts";
import * as denoResolver from "../../deps/deno_module_resolver.ts";
import { ResolverCache } from "./cache.ts";

export function dependencyResolver(cache: ResolverCache): EsbuildPlugin {
  return {
    name: "dependency-resolver",
    setup(build) {
      build.onResolve(
        { filter: /^\.+\/|^\//, namespace: "file" },
        (args) => {
          const importer = cache.urlImporterCache.get(args.importer);

          if (!importer || !("kind" in importer)) return;

          if (importer.kind == "esm") {
            const url = new URL(args.path, importer.specifier);

            return build.resolve(url.href.slice(url.protocol.length), {
              kind: args.kind,
              importer: args.importer,
              resolveDir: args.resolveDir,
              namespace: url.protocol.slice(0, -1),
            });
          }
        },
      );

      build.onResolve({ filter: /^/, namespace: "file" }, async (args) => {
        if (/^\.|^\/|^[a-z]+\:/.test(args.path)) return;

        const importer = cache.npmImporterCache.get(args.importer);

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

          const resolved = cache.npmResolveCache.get(
            path + "\n" + importer.context?.module.specifier,
          ) ??
            (await denoResolver.resolve(path, args.importer));

          cache.npmResolveCache.set(
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
  };
}
