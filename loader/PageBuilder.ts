import { renderToString } from "npm:preact-render-to-string";
import prepass from "npm:preact-ssr-prepass";
import { ComponentType, VNode, h, options, Fragment, Attributes } from "preact";
import { BuildContext, Loader, Plugin, PluginBuild } from "../deps/esbuild.ts";
import * as path from "../deps/path.ts";
import * as fs from "../deps/fs.ts";
import { DejamuContext } from "../core/buildContext.ts";
import { render } from "./render.ts";
import { DejamuPlugin } from "../core/plugin.ts";
import { DejamuOptions } from "../core/mod.ts";

export type PageComponent = (props: {}) => VNode<any>;

export function PageBuilder(ctx: DejamuContext): DejamuPlugin {
  return {
    name: "dejamu-page",
    resolveEntryPoints() {
      return Array.fromAsync(
        fs.expandGlob("(t|j)s?(x)", {
          root: ctx.options.pagesRoot,
        }),
        (x) => x.path
      );
    },
    async setup(build) {
      const PageTemplate = await import(path.resolve("./_site.tsx"));

      build.onResolve({ filter: /\.[tj]sx?/ }, (args) => {
        if (args.kind != "entry-point") return;

        return {
          path: args.path.replace(/\.[tj]sx?$/, ".html"),
          namespace: "dejamu-page-builder",
          pluginData: args.path,
        };
      });

      build.onLoad(
        { filter: /\.[tj]sx?$/, namespace: "dejamu-page-builder" },
        async (args) => {
          const { default: Page }: { default: ComponentType } = await import(
            args.pluginData
          );

          const html = await render(
            ctx,
            build,
            h(PageTemplate, null, h(Page, null))
          );

          return {
            loader: "empty",
          };
        }
      );
    },
  };
}
