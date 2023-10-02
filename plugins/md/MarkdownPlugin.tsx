import { Plugin } from "../../deps/esbuild.ts";
import { ComponentChildren, FunctionComponent } from "npm:preact/";
import { render } from "npm:preact-render-to-string/";
import * as path from "../../deps/path.ts";
import { getHeadChildren, resetHeadChildren } from "../Head.tsx";
import * as FrontMatter from "../../deps/front_matter.ts";
import { EmptyLayout } from "./EmptyLayout.tsx";
import { Markdown } from "./Markdown.tsx";
import { getAssets } from "../asset.ts";

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
        globalThis.isBrowser = false;

        const { data, markdownBody } = await loadMarkdown(args.path);

        const layoutPath = data?.layout != null
          ? path.toFileUrl(
            path.resolve(path.join(layoutDirectory, `${data.layout}`)),
          ).toString()
          : null;

        const Layout: LayoutComponent = layoutPath
          ? (await import(layoutPath)).default
          : EmptyLayout;

        const jsFilePath = path.basename(args.path, path.extname(args.path)) +
          ".js";

        const htmlFilePath = path.join(
          build.initialOptions.outdir ?? "./",
          path.basename(args.path, path.extname(args.path)) + ".html",
        );

        resetHeadChildren();
        const renderedPage = render(
          <Layout data={data}>
            {markdownBody}
          </Layout>,
        );

        const html = `<!doctype html>${
          render(
            <html>
              <head>
                <meta charSet="utf-8" />
                <script
                  src={jsFilePath}
                  defer
                  type="module"
                />
                {...getHeadChildren()}
              </head>
              <body dangerouslySetInnerHTML={{ __html: renderedPage }} />
            </html>,
          )
        }`;

        await Deno.mkdir(path.dirname(htmlFilePath), { recursive: true });
        await Deno.writeTextFile(htmlFilePath, html);

        await build.esbuild.build({
          ...build.initialOptions,
          entryPoints: [...getAssets()],
        });

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
