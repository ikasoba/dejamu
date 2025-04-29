import { build } from "../deps/esbuild.ts";
import { fromFileUrl, toFileUrl, relative, resolve } from "../deps/path.ts";
import {
  denoResolverPlugin,
} from "../deps/esbuild_deno_loader.ts";
import { encodeBase64 } from "https://deno.land/std@0.203.0/encoding/base64.ts";
import { DejamuContext } from "../core/context.ts";

export const ModuleReloader = new EventTarget();

export const reloadHandlerName = "$__Dejamu_ModuleReloadingHandler__$";

const moduleCache = new Map<string, { hash: string; promise: Promise<any>; }>();

export async function dynamicReload(path: string) {  
  path = path.startsWith("file:")
    ? fromFileUrl(path)
    : resolve(path);

  const hash = encodeBase64(
    await DejamuContext.current.features.fs.getHash(path),
  );

  const cached = moduleCache.get(path);
  
  if (cached && cached.hash == hash) return cached.promise;
  
  moduleCache.delete(path);

  return await dynamicImport(path, hash);
}

export interface DynamicImportHooks {
  onResolved?(path: string, module: object): Promise<void> | void;
  onReloaded?(path: string, module: object): Promise<void> | void;
}

export const defaultHooks: DynamicImportHooks = {};

export async function dynamicImport(
  path: string,
  hash?: string,
  onHashUpdated?: (newHash: string) => void
) {
  path = path.startsWith("file:")
    ? fromFileUrl(path)
    : resolve(path);

  hash ??= encodeBase64(
    await DejamuContext.current.features.fs.getHash(path),
  );

  const cached = moduleCache.get(path);

  if (cached && cached.hash == hash) {
    await defaultHooks?.onResolved?.(path, await cached.promise);
    
    return cached.promise;
  }
  
  await onHashUpdated?.(hash);

  const { promise, resolve: done } = Promise.withResolvers<any>();

  moduleCache.set(path, {
    hash, promise
  });
  
  const transformed = await transform(path, hash);
  
  const res = await import(
    transformed
  );

  done(res);

  ModuleReloader.dispatchEvent(new Event(resolve(path)));

  await defaultHooks?.onResolved?.(path, res);
  
  await defaultHooks?.onReloaded?.(path, res);

  return res;
}

const transformCache = new Map<string, { hash: string, promise: Promise<string>; deps: Promise<string[]>; }>();

export async function transform(
  path: string,
  hash?: string,
) {
  path = path.startsWith("file:")
    ? path
    : toFileUrl(path).toString();

  hash ??= encodeBase64(
    await DejamuContext.current.features.fs.getHash(path),
  );

  const cached = transformCache.get(path);

  if (cached && cached.hash == hash) {    
    return cached.promise;
  }

  const result = Promise.withResolvers<string>();
  const depsResult = Promise.withResolvers<string[]>();

  transformCache.set(path, {
    hash,
    promise: result.promise,
    deps: depsResult.promise
  })

  const deps: string[] = [];

  const opts = {
    configPath: resolve("deno.json"),
  };

  const { outputFiles } = await build({
    entryPoints: [path],
    bundle: true,
    write: false,
    jsx: "automatic",
    jsxImportSource: "npm:preact",
    format: "esm",
    treeShaking: true,
    minify: true,
    sourcemap: "inline",
    plugins: [
      denoResolverPlugin(opts),
      {
        name: "resolver",
        setup(build) {
          build.onResolve({ filter: /^/ }, async (args) => {
            if (
              args.namespace == "file" &&
              !relative(Deno.cwd(), args.path).startsWith("../")
            ) {
              if (args.kind == "entry-point") return { path: args.path };

              const path = args.namespace + ":" + args.path;

              deps.push(path);

              const mod = await dynamicImport(path);

              const fullPath = resolve(args.path);

              const reloadHandler = `async () => { const mod = await dynamicImport(${JSON.stringify(path)}); ${Object.keys(mod).map(name => `_${name} = mod.${name}`).join(";")} }`;

              const proxy =
                `import { dynamicImport, ModuleReloader } from ${
                  JSON.stringify(import.meta.url)
                }; const mod = await dynamicImport(${JSON.stringify(path)});` +
                Object.keys(mod).map((name) =>
                  `let _${name} = mod.${name}; export { _${name} as ${name} };`
                ).join(";") + `; export const ${reloadHandlerName} = ${reloadHandler}; ModuleReloader.addEventListener(${JSON.stringify(fullPath)}, ${reloadHandlerName})`;

              return {
                external: true,
                path: `data:application/javascript,${
                  encodeURIComponent(proxy)
                }`,
              };
            } else {
              return {
                external: true,
                path: args.namespace + ":" + args.path,
              };
            }
          });
        },
      }
    ],
  });

  depsResult.resolve(deps);

  const transformed = `data:application/javascript;base64,${encodeBase64(outputFiles[0].contents)}`;
  
  result.resolve(transformed);

  return transformed;
}
