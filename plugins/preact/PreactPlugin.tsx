import "./islands/hooks.tsx";

import { FunctionComponent } from "npm:preact/";
import * as path from "../../deps/path.ts";
import { initializeConstantsForBuildTime } from "../constants.ts";

import { getIslands } from "./islands/hooks.tsx";
import { DejamuPlugin } from "../../pluginSystem/Plugin.ts";
import { copyAssets, initAssets } from "../asset.ts";
import { DejamuContext } from "../../core/context.ts";
import { renderToStringAsync } from "../../deps/preact-render-to-string.ts";
import {
  collectIslands,
  initIslandsState,
  Island,
  registerIslands,
} from "./islands/islands.ts";
import { template } from "../render.tsx";
import { putTextFile } from "../../utils/putTextFile.ts";
import { OnLoadResult } from "../../deps/esbuild.ts";
import { PreBuildScript } from "../../core/PreBuildScript.ts";

async function render(
  islands: Island[],
  body: string,
  htmlFilePath: string,
  jsFilePath: string,
): Promise<OnLoadResult> {
  const script: PreBuildScript = { head: [], body: [], footer: [] };

  if (islands.length) {
    const { head: islandsHead, reviveArg } = collectIslands(islands);

    script.head.push('import {revive} from "dejamu/mod.ts"');
    script.head.push(islandsHead);
    script.footer.push(
      'window.addEventListener("load", () => {' +
        '  console.log("start partial hydrate");' +
        `  revive(${reviveArg}, document.body);` +
        "})",
    );
  }

  body = await DejamuContext.current.dispatchRender(body, script);

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

    await putTextFile(htmlFilePath, html);

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

    await putTextFile(htmlFilePath, html);

    return {
      loader: "tsx",
      contents: jsFile,
    };
  }
}

export const PreactPlugin = (): DejamuPlugin => {
  return {
    type: "esbuild",
    plugin: {
      name: "PreactPlugin",
      setup(build) {
        build.onStart(() => {
          initIslandsState();
          registerIslands(".");
        });

        build.onResolve({ filter: /.*/ }, async (args) => {
          if (
            args.kind != "entry-point"
          ) return;

          if (
            !(args.path.match(/\.[jt]sx$/) ||
              typeof args.pluginData?.PageGetter == "function")
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

            const { default: Page }: { default: FunctionComponent } =
              typeof args.pluginData?.PageGetter == "function"
                ? { default: await args.pluginData.PageGetter() }
                : await import(
                  path.toFileUrl(path.resolve(args.path)).toString() + "?" +
                    Date.now()
                );

            const node = <Page />;

            const body = await renderToStringAsync(node);

            const islands = [...getIslands()];

            await copyAssets();

            return {
              namespace: "PreactPlugin",
              path: args.path,
              pluginData: await render(
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
