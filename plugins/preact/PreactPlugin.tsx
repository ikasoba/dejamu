import { Plugin } from "../../deps/esbuild.ts";
import { FunctionComponent, options } from "npm:preact/";
import { render, renderToString } from "npm:preact-render-to-string/";
import * as path from "../../deps/path.ts";
import { getHeadChildren, resetHeadChildren } from "../Head.tsx";
import { esbuild } from "https://deno.land/x/esbuild_deno_loader@0.8.1/deps.ts";
import { template } from "../render.tsx";
import { initializeConstantsForBuildTime } from "../constants.ts";

import "../islands/hooks.tsx";
import { getIslands } from "../islands/hooks.tsx";
import { Island } from "../islands/registerIslands.ts";
import { putTextFile } from "../../utils/putTextFile.ts";
import { collectIslands } from "../collectIslands.ts";

export const PreactPlugin = (): Plugin => {
  return {
    name: "PreactPlugin",
    setup(build) {
      build.onResolve({ filter: /\.[jt]sx$/ }, async (args) => {
        if (
          args.kind != "entry-point" ||
          args.namespace == "PreactPlugin-stdin" ||
          args.path == "PreactPlugin-stdin"
        ) return;

        const { default: Page }: { default: FunctionComponent } = await import(
          path.toFileUrl(path.resolve(args.path)).toString()
        );

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

        initializeConstantsForBuildTime(pageDirectory);

        jsFilePath = path.relative(path.dirname(htmlFilePath), jsFilePath);

        const body = renderToString(<Page />);

        const islands = [...getIslands()];

        if (islands.length == 0) {
          const html = template(
            body,
            {
              pageDirectory: globalThis.pageDirectory,
              projectRoot: globalThis.projectRoot,
            },
            undefined,
          );

          await putTextFile(htmlFilePath, html);

          return {
            namespace: "PreactPlugin",
            path: args.path,
            pluginData: null,
          };
        } else {
          const html = template(
            body,
            {
              pageDirectory: globalThis.pageDirectory,
              projectRoot: globalThis.projectRoot,
            },
            jsFilePath,
          );

          await putTextFile(htmlFilePath, html);

          return {
            namespace: "PreactPlugin",
            path: args.path,
            pluginData: islands,
          };
        }
      });

      build.onLoad({ filter: /.*/, namespace: "PreactPlugin" }, (args) => {
        const islands: Island[] | null = args.pluginData;

        if (islands == null) {
          return {
            loader: "empty",
            contents: "",
          };
        }

        const { head: islandsHead, reviveArg } = collectIslands(islands);

        return {
          contents: `
            import {revive} from "dejamu/mod.ts";
            ${islandsHead}

            window.addEventListener("load", () => {
              console.log("start partial hydrate");
              revive(${reviveArg}, document.body);
            });
          `,
          loader: "tsx",
        };
      });
    },
  };
};
