import "../islands/hooks.tsx";

import { Plugin } from "../../deps/esbuild.ts";
import { FunctionComponent } from "npm:preact/";
import { renderToString } from "npm:preact-render-to-string/";
import * as path from "../../deps/path.ts";
import * as FrontMatter from "../../deps/front_matter.ts";
import { EmptyLayout } from "./EmptyLayout.tsx";
import { initializeConstantsForBuildTime } from "../constants.ts";
import { getIslands, initHooks } from "../islands/hooks.tsx";
import { Island } from "../islands/registerIslands.ts";
import { collectIslands } from "../collectIslands.ts";
import * as PluginSystem from "../../pluginSystem/PluginSystem.ts";
import { DejamuPlugin } from "../../pluginSystem/Plugin.ts";
import { copyAssets, initAssets } from "../asset.ts";
import { Marked, MarkedExtension } from "../../deps/marked.ts";
import { getHeadChildren } from "../Head.tsx";
import { DejamuContext } from "../../builder/context.ts";
import { collectPromises } from "../../hooks/useAsync.ts";
import { resetMemoContext, resetMemos } from "../../utils/onceMemo.ts";

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

export interface MarkdownExtension extends MarkedExtension {
  onRender?(): void;
}

export interface MarkdownPluginConfig {
  layouts?: string;
  plugins?: MarkdownExtension[];
}

export let marked: Marked;

export const MarkdownPlugin = (
  { layouts = "layouts/", plugins = [] }: MarkdownPluginConfig,
): DejamuPlugin => {
  marked = new Marked();

  marked.use(...plugins);

  return {
    type: "esbuild",
    plugin: {
      name: "MarkdownPlugin",
      async setup(build) {
        build.onResolve({ filter: /\.md$/ }, async (args) => {
          const { data, markdownBody } = await loadMarkdown(args.path);

          const layoutPath = data?.layout != null
            ? path.toFileUrl(
              path.resolve(path.join(layouts, `${data.layout}`)),
            ).toString()
            : null;

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
            initHooks();

            const Layout: LayoutComponent = layoutPath
              ? (await import(layoutPath)).default
              : EmptyLayout;

            const node = (
              <Layout data={data}>
                {markdownBody}
              </Layout>
            );

            resetMemoContext();
            renderToString(
              node,
            );
            await Promise.all(collectPromises());

            resetMemoContext();
            const body = renderToString(
              node,
            );

            for (const plugin of plugins) {
              plugin.onRender?.();
            }

            const islands = [...getIslands()];

            await copyAssets();

            return {
              namespace: "MarkdownPlugin",
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
          { filter: /.*/, namespace: "MarkdownPlugin" },
          (args) => {
            return args.pluginData;
          },
        );
      },
    },
  };
};
