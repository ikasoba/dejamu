import { FunctionComponent } from "npm:preact/";
import * as path from "../../deps/path.ts";
import * as FrontMatter from "../../deps/front_matter.ts";
import { EmptyLayout } from "./EmptyLayout.tsx";
import { DejamuPlugin } from "../../pluginSystem/Plugin.ts";
import { Marked, MarkedExtension } from "../../deps/marked.ts";

export type LayoutComponent = FunctionComponent<
  { data: Record<string, any>; children: string; path: string }
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
      setup(build) {
        build.onResolve({ filter: /\.md$/ }, async (args) => {
          if (args.namespace != "file") return;

          const { data, markdownBody } = await loadMarkdown(args.path);

          const layoutPath = data?.layout != null
            ? path.toFileUrl(
              path.resolve(path.join(layouts, `${data.layout}`)),
            ).toString()
            : null;

          return build.resolve(args.path, {
            kind: args.kind,
            importer: args.importer,
            resolveDir: args.resolveDir,
            namespace: "PreactPlugin",
            pluginData: {
              PageGetter: async () => {
                const Layout: LayoutComponent = layoutPath
                  ? (await import(layoutPath + "?" + Date.now())).default
                  : EmptyLayout;

                for (const plugin of plugins) {
                  plugin.onRender?.();
                }

                return () => (
                  <Layout data={data} path={args.path}>
                    {markdownBody}
                  </Layout>
                );
              },
            },
          });
        });
      },
    },
  };
};
