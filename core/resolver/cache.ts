import { deno } from "../../deps/esbuild_deno_loader.ts";
import * as denoResolver from "../../deps/deno_module_resolver.ts";

export interface ResolverCache {
  infoCache: deno.InfoCache;
  npmImporterCache: Map<
    string,
    Awaited<ReturnType<typeof denoResolver.resolve>>
  >;
  npmResolveCache: Map<
    string,
    Awaited<ReturnType<typeof denoResolver.resolve>>
  >;
  urlImporterCache: Map<string, deno.ModuleEntry>;
}

export function createResolverCache(): ResolverCache {
  return {
    infoCache: new deno.InfoCache(),
    npmImporterCache: new Map<
      string,
      Awaited<ReturnType<typeof denoResolver.resolve>>
    >(),
    npmResolveCache: new Map<
      string,
      Awaited<ReturnType<typeof denoResolver.resolve>>
    >(),
    urlImporterCache: new Map<string, deno.ModuleEntry>(),
  };
}
