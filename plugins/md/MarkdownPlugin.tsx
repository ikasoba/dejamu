import { Plugin } from "../../deps/esbuild.ts";
import { ComponentChildren, FunctionComponent } from "npm:preact/";
import { render } from "npm:preact-render-to-string/";
import * as path from "../../deps/path.ts";
import { getHeadChildren, resetHeadChildren } from "../Head.tsx";
import * as FrontMatter from "../../deps/front_matter.ts";
import { EmptyLayout } from "./EmptyLayout.tsx";
import { Markdown } from "./Markdown.tsx";
import { template } from "../render.tsx";
import { initializeConstantsForBuildTime } from "../constants.ts";
import { getIslands } from "../islands/hooks.tsx";
import { putTextFile } from "../../utils/putTextFile.ts";
import { Island } from "../islands/registerIslands.ts";
import { collectIslands } from "../collectIslands.ts";

export type LayoutComponent = FunctionComponent<
  { data: Record<string, any>; children: string }
>;

const loadMarkdown = async (path: string) => {
  const rawDocument = await Deno.readTextFile(path);
  let data: Record<string, any>;
  let markdownBody: string;

  if (FrontMatter.test(rawDocument)) {
    const res = FrontMatter.extract(rawDocument);

    markdownBody = res.body;
    data = res.attrs;
  } else {
    markdownBody = rawDocument;
    data = {};
  }

  return { data, markdownBody };
};

export const MarkdownPlugin = (layoutDirectory: string): Plugin => {
  return {
    name: "MarkdownPlugin",
    setup(build) {
      build.onResolve({ filter: /\.md$/ }, async (args) => {
        const { data, markdownBody } = await loadMarkdown(args.path);

        const layoutPath = data?.layout != null
          ? path.toFileUrl(
            path.resolve(path.join(layoutDirectory, `${data.layout}`)),
          ).toString()
          : null;

        const Layout: LayoutComponent = layoutPath
          ? (await import(layoutPath)).default
          : EmptyLayout;

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

        const body = render(
          <Layout data={data}>
            {markdownBody}
          </Layout>,
        );

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

      build.onLoad(
        { filter: /.*/, namespace: "MarkdownPlugin" },
        async (args) => {
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

            window.addEventListener("DOMContentLoaded", () => {
              revive(${reviveArg}, document.body);
            });
        `,
            loader: "tsx",
          };
        },
      );
    },
  };
};
