import * as path from "../../deps/path.ts";
import { DejamuPlugin } from "../../core/plugins/Plugin.ts";
import { DejamuContext } from "../../core/context.ts";
import { CacheStorageDriver } from "../../core/features/CacheSystem.ts";
import { OnLoadResult } from "../../deps/esbuild.ts";
import { PreBuildScript } from "../../core/PreBuildScript.ts";
import { encodeBase64 } from "https://deno.land/std@0.203.0/encoding/base64.ts";
import { initializeConstantsForBuildTime } from "../constants.ts";
import { FunctionComponent } from "npm:preact";
import { dynamicImport } from "../../utils/dynamicImport.ts";
import { renderToStringAsync } from "../../deps/preact-render-to-string.ts";

async function render(
  _modulePath: string,
  body: string,
  xmlFilePath: string,
) {
  const script: PreBuildScript = {
    head: ['<?xml version="1.0" encoding="utf-8"?>'],
    body: [body],
    footer: [],
  };

  // body = await DejamuContext.current.dispatchRender(body, script, modulePath);

  await DejamuContext.current.features.fs.writeTextFile(
    xmlFilePath,
    [...script.head, ...script.body, ...script.footer].join("\n"),
  );

  return {
    loader: "empty",
    contents: "",
  };
}

interface CachedResult {
  inputs: unknown[];
  result: OnLoadResult;
}

export const XmlPlugin = (): DejamuPlugin => {
  let cache: CacheStorageDriver;

  return {
    type: "esbuild",
    plugin: {
      name: "XmlPlugin",
      async setup(build) {
        const queue: (() => Promise<void> | void)[] = [];
        cache = await DejamuContext.current.features.cache.open(
          "plugins/xml",
        );

        build.onResolve({ filter: /^/ }, async (args) => {
          if (
            args.kind != "entry-point"
          ) return;

          if (
            !(args.path.match(/\.xml\.[jt]sx$/) ||
              (args.namespace == "XmlPlugin" &&
                typeof args.pluginData?.Page == "function"))
          ) return;

          const xmlFilePath = path.join(
            build.initialOptions.outdir ?? "./",
            path.relative(Deno.cwd(), path.dirname(args.path)).split(path.SEP)
              .slice(1).join(path.SEP),
            path.basename(args.path, ".xml" + path.extname(args.path)) + ".xml",
          ).replaceAll("\\", "/");

          const pageDirectory = path.join(
            path.relative(Deno.cwd(), path.dirname(args.path)).split(path.SEP)
              .slice(1).join(path.SEP),
          ).replaceAll("\\", "/");

          return await DejamuContext.current.tasks.run(async () => {
            const cachedRaw = await cache.get(args.path);
            const cached = cachedRaw && JSON.parse(cachedRaw) as CachedResult;

            const inputs = Array.isArray(args.pluginData?.inputs)
              ? args.pluginData.inputs
              : [
                encodeBase64(
                  await DejamuContext.current.features.fs.getHash(args.path),
                ),
              ];

            if (
              cached && cached.inputs.length == inputs.length &&
              cached.inputs.every((x, i) => x == inputs[i])
            ) {
              return {
                namespace: "XmlPlugin",
                path: args.path,
                pluginData: cached.result,
              };
            }

            initializeConstantsForBuildTime(pageDirectory);

            const { default: Page }: { default: FunctionComponent } =
              typeof args.pluginData?.Page == "function"
                ? { default: await args.pluginData.Page }
                : await dynamicImport(
                  path.toFileUrl(path.resolve(args.path)).toString(),
                );

            const node = <Page />;

            const body = await renderToStringAsync(node);

            const result = await render(
              args.path,
              body,
              xmlFilePath,
            );

            cache.set(
              args.path,
              JSON.stringify({
                inputs,
                result,
              }),
            );

            return {
              namespace: "XmlPlugin",
              path: args.path,
              pluginData: result,
            };
          });
        });

        build.onLoad(
          { filter: /^/, namespace: "XmlPlugin" },
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
