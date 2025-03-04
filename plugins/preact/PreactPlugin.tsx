import "./islands/hooks.tsx";

import { FunctionComponent } from "npm:preact/";
import * as path from "../../deps/path.ts";
import { initializeConstantsForBuildTime } from "../constants.ts";

import { getIslands } from "./islands/hooks.tsx";
import { DejamuPlugin } from "../../core/plugins/Plugin.ts";
import { copyAssets, initAssets } from "../asset.ts";
import { DejamuContext } from "../../core/context.ts";
import { renderToStringAsync } from "../../deps/preact-render-to-string.ts";
import { collectIslands, Island, replaceIsland } from "./islands/islands.ts";
import { template } from "../render.tsx";
import { OnLoadResult } from "../../deps/esbuild.ts";
import { PreBuildScript } from "../../core/PreBuildScript.ts";
import { defaultHooks, dynamicImport } from "../../utils/dynamicImport.ts";
import { encodeBase64 } from "https://deno.land/std@0.203.0/encoding/base64.ts";
import { CacheStorageDriver } from "../../utils/CacheSystem.ts";

async function render(
  modulePath: string,
  islands: Omit<Island, "component">[],
  body: string,
  htmlFilePath: string,
  jsFilePath: string,
  replacer?: Promise<(html: string) => string>,
): Promise<OnLoadResult> {
  const script: PreBuildScript = { head: [], body: [], footer: [] };

  if (islands.length) {
    script.hasIslands = true;
    
    const { reviveArg } = collectIslands(islands);

    script.head.push(
      'import { revive } from "dejamu/plugins/preact/islands/revive.tsx"',
    );

    script.head.push(
      'import { adaptRouter } from "dejamu/plugins/preact/router/Router.ts"',
    );

    script.footer.push(
      "adaptRouter();" +
        `const reviveArg = ${reviveArg};` +
        'window.addEventListener("load", function doRevive() {' +
        '  console.time("dejamu pre hydrate");' +
        `  revive(reviveArg, document.body);` +
        '  console.timeEnd("dejamu pre hydrate");' +
        '  window.removeEventListener("load", doRevive);' +
        "});",
    );
  }

  body = await DejamuContext.current.dispatchRender(body, script, modulePath);

  const jsFile = [
    script.head.join(";"),
    script.body.join(";"),
    script.footer.join(";"),
  ]
    .filter((x) => x.length)
    .join(";");

  if (jsFile.length == 0) {
    const html = await template(
      body,
      {
        pageDirectory: globalThis.pageDirectory,
        projectRoot: globalThis.projectRoot,
      },
      undefined,
    );

    if (replacer) {
      replacer.then(async (fn) => {
        await DejamuContext.current.features.fs.writeTextFile(htmlFilePath, fn(html));
      });
    } else {
      await DejamuContext.current.features.fs.writeTextFile(htmlFilePath, html);
    }

    return {
      loader: "empty",
      contents: "",
    };
  } else {
    const html = await template(
      body,
      {
        pageDirectory: globalThis.pageDirectory,
        projectRoot: globalThis.projectRoot,
      },
      jsFilePath,
    );

    if (replacer) {
      replacer.then(async (fn) => {
        await DejamuContext.current.features.fs.writeTextFile(htmlFilePath, fn(html));
      });
    } else {
      await DejamuContext.current.features.fs.writeTextFile(htmlFilePath, html);
    }

    return {
      loader: "tsx",
      contents: jsFile,
    };
  }
}

interface CachedResult {
  inputs: unknown[];
  result: OnLoadResult;
}

export const PreactPlugin = (): DejamuPlugin => {
  defaultHooks.onResolved = (path, mod) => {
    if (/\.islands\.[tj]sx?$/.test(path)) {
      replaceIsland(path, mod);
    }
  };

  let cache: CacheStorageDriver;

  defaultHooks.onReloaded = () => {
    cache?.clear();
  }

  return {
    type: "esbuild",
    plugin: {
      name: "PreactPlugin",
      async setup(build) {
        const queue: (() => Promise<void> | void)[] = [];
        cache = await DejamuContext.current.features.cache.open("plugins/preact")

        build.onResolve({ filter: /^/ }, async (args) => {
          if (
            args.kind != "entry-point"
          ) return;

          if (
            !(args.path.match(/\.[jt]sx$/) ||
              typeof args.pluginData?.Page == "function")
          ) return;

          let jsFilePath = path.join(
            build.initialOptions.outdir ?? "./",
            path.relative(Deno.cwd(), path.dirname(args.path)),
            path.basename(args.path, path.extname(args.path)),
          ) +
            ".js";

          const rawJsFilePath = jsFilePath;

          const htmlFilePath = path.join(
            build.initialOptions.outdir ?? "./",
            path.relative(Deno.cwd(), path.dirname(args.path)).split(path.SEP)
              .slice(1).join(path.SEP),
            path.basename(args.path, path.extname(args.path)) + ".html",
          );

          const pageDirectory = path.join(
            path.relative(Deno.cwd(), path.dirname(args.path)).split(path.SEP)
              .slice(1).join(path.SEP),
          );

          jsFilePath = path.relative(path.dirname(htmlFilePath), jsFilePath);

          return await DejamuContext.current.tasks.run(async () => {
            const cachedRaw = await cache.get(args.path);
            const cached = cachedRaw && JSON.parse(cachedRaw) as CachedResult;

            const inputs = Array.isArray(args.pluginData?.inputs)
              ? args.pluginData.inputs
              : [encodeBase64(await DejamuContext.current.features.fs.getHash(args.path))];

            if (
              cached && cached.inputs.length == inputs.length && cached.inputs.every((x, i) => x == inputs[i])
            ) {
              return {
                namespace: "PreactPlugin",
                path: args.path,
                pluginData: cached.result,
              };
            }

            await initAssets(build.initialOptions.outdir!);
            initializeConstantsForBuildTime(pageDirectory);

            const { default: Page }: { default: FunctionComponent} =
              typeof args.pluginData?.Page == "function"
                ? { default: await args.pluginData.Page }
                : await dynamicImport(
                  path.toFileUrl(path.resolve(args.path)).toString(),
                );

            const node = <Page />;

            const body = await renderToStringAsync(node);

            const islands = [...getIslands()];

            await copyAssets();

            const replacer = new Promise<(html: string) => string>(
              (resolve) => {
                queue.push(async () => {
                  const res = await build.esbuild.build({
                    entryPoints: [rawJsFilePath],
                    write: false,
                    bundle: true,
                    metafile: true,
                  });

                  const resolveFilePath = (filePath: string) => {
                    return path.relative(path.dirname(htmlFilePath), filePath).replaceAll("\\", "/");
                  };

                  const preloads = await renderToStringAsync(
                    <script
                      id="__DJM_PRELOADS__"
                      type="application/json"
                      dangerouslySetInnerHTML={{
                        __html: JSON.stringify(
                          res.metafile.inputs[rawJsFilePath].imports.filter((
                            x,
                          ) => x.kind == "import-statement").map((x) =>
                            resolveFilePath(x.path)
                          ),
                        ),
                      }}
                    >
                    </script>,
                  );

                  resolve((html) =>
                    html.replace("</head>", preloads + "</head>")
                  );
                });
              },
            );
            
            const result = await render(
              args.path,
              islands,
              body,
              htmlFilePath,
              jsFilePath,
              replacer
            );

            cache.set(args.path, JSON.stringify({
              inputs,
              result,
            }));

            return {
              namespace: "PreactPlugin",
              path: args.path,
              pluginData: result,
            };
          });
        });

        build.onLoad(
          { filter: /^/, namespace: "PreactPlugin" },
          (args) => {
            return args.pluginData;
          },
        );

        build.onEnd(async () => {
          for (const f of queue.splice(0)) {
            await f();
          }
        });
      },
    },
  };
};
