import "../islands/hooks.tsx";

import { FunctionComponent } from "npm:preact/";
import { renderToString } from "npm:preact-render-to-string/";
import * as path from "../../deps/path.ts";
import { initializeConstantsForBuildTime } from "../constants.ts";

import { getIslands } from "../islands/hooks.tsx";
import * as PluginSystem from "../../pluginSystem/PluginSystem.ts";
import { DejamuPlugin } from "../../pluginSystem/Plugin.ts";
import { copyAssets, initAssets } from "../asset.ts";
import { getHeadChildren } from "../Head.tsx";
import { DejamuContext } from "../../builder/context.ts";
import { collectPromises } from "../../hooks/useAsync.ts";
import { resetMemoContext, resetMemos } from "../../utils/onceMemo.ts";

export const PreactPlugin = (): DejamuPlugin => {
  return {
    type: "esbuild",
    plugin: {
      name: "PreactPlugin",
      async setup(build) {
        build.onResolve({ filter: /\.[jt]sx$/ }, async (args) => {
          if (
            args.kind != "entry-point" ||
            args.namespace == "PreactPlugin-stdin" ||
            args.path == "PreactPlugin-stdin"
          ) return;

          let jsFilePath = path.join(
            build.initialOptions.outdir ?? "./",
            path.relative(Deno.cwd(), path.dirname(args.path)),
            path.basename(args.path, path.extname(args.path)),
          ) +
            ".js";

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
            await initAssets(build.initialOptions.outdir!);
            initializeConstantsForBuildTime(pageDirectory);
            resetMemos();

            const { default: Page }: { default: FunctionComponent } =
              await import(
                path.toFileUrl(path.resolve(args.path)).toString()
              );

            const node = <Page />;

            resetMemoContext();
            renderToString(
              node,
            );
            await Promise.all(collectPromises());

            resetMemoContext();
            const body = renderToString(node);

            const islands = [...getIslands()];

            await copyAssets();

            return {
              namespace: "PreactPlugin",
              path: args.path,
              pluginData: await PluginSystem.build(
                islands,
                body,
                htmlFilePath,
                jsFilePath,
              ),
            };
          });
        });

        build.onLoad(
          { filter: /.*/, namespace: "PreactPlugin" },
          (args) => {
            return args.pluginData;
          },
        );
      },
    },
  };
};
