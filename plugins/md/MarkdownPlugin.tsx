import { Plugin } from "../../deps/esbuild.ts";
import { ComponentChildren, FunctionComponent } from "npm:preact/";
import { render } from "npm:preact-render-to-string/";
import * as path from "../../deps/path.ts";
import { getHeadChildren, resetHeadChildren } from "../Head.tsx";
import * as FrontMatter from "../../deps/front_matter.ts";
import { EmptyLayout } from "./EmptyLayout.tsx";
import { Markdown } from "./Markdown.tsx";
import { renderToFile } from "../render.tsx";
import { initializeConstantsForBuildTime } from "../constants.ts";

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

        await renderToFile(
          <Layout data={data}>
            {markdownBody}
          </Layout>,
          {
            pageDirectory: globalThis.pageDirectory,
            projectRoot: globalThis.projectRoot,
          },
          htmlFilePath,
          jsFilePath,
        );

        return {
          namespace: "MarkdownPlugin",
          path: args.path,
        };
      });

      build.onLoad(
        { filter: /.*/, namespace: "MarkdownPlugin" },
        async (args) => {
          const { data, markdownBody } = await loadMarkdown(args.path);

          const layoutPath = data?.layout != null
            ? path.toFileUrl(
              path.resolve(path.join(layoutDirectory, `${data.layout}`)),
            )
              .toString()
            : null;

          return {
            contents: `
              import {hydrate} from "npm:preact/";
              import Layout from ${
              JSON.stringify(layoutPath ?? "dejamu/plugins/md/EmptyLayout.tsx")
            };

              hydrate(<Layout data={${JSON.stringify(data)}}>{${
              JSON.stringify(markdownBody)
            }}</Layout>, document.body);
        `,
            loader: "tsx",
          };
        },
      );
    },
  };
};
