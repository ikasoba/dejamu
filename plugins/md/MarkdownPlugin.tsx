import { FunctionComponent } from "npm:preact/";
import * as path from "../../deps/path.ts";
import * as FrontMatter from "../../deps/front_matter.ts";
import { EmptyLayout } from "./EmptyLayout.tsx";
import { DejamuPlugin } from "../../core/plugins/Plugin.ts";
import { Marked, MarkedExtension } from "../../deps/marked.ts";
import { dynamicImport } from "../../utils/dynamicImport.ts";
import { encodeBase64 } from "https://deno.land/std@0.203.0/encoding/base64.ts";
import { DejamuContext } from "../../core/context.ts";

export type LayoutComponent = FunctionComponent<
  { data: Record<string, any>; children: string; path: string }
>;

const loadMarkdown = async (path: string) => {
  const rawDocument = await DejamuContext.current.features.fs.readTextFile(
    path,
  );
  
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

  const cache = new Map<string, {
    hash: string;
    result: Awaited<ReturnType<typeof loadMarkdown>>
  }>();

  return {
    type: "esbuild",
    plugin: {
      name: "MarkdownPlugin",
      setup(build) {
        build.onResolve(
          { filter: /\.md$/, namespace: "file" },
          async (args) => {
            const hash = encodeBase64(
              await DejamuContext.current.features.fs.getHash(args.path),
            );

            const cached = cache.get(args.path);

            let result;
            if (cached && cached.hash == hash) {
              result = cached.result;
            } else {
              result = await loadMarkdown(args.path);
              
              cache.set(args.path, {
                hash,
                result
              });
            }

            const { data, markdownBody } = result;

            const layoutPath = data?.layout != null
              ? path.relative(
                Deno.cwd(),
                path.resolve(path.join(layouts, `${data.layout}`)),
              )
              : null;

            const Layout: LayoutComponent = layoutPath
              ? (await dynamicImport(layoutPath)).default
              : EmptyLayout;

            return build.resolve(args.path, {
              kind: args.kind,
              importer: args.importer,
              resolveDir: args.resolveDir,
              namespace: "PreactPlugin",
              pluginData: {
                inputs: [
                  hash,
                  Layout,
                ],
                Page: () => {
                  for (const plugin of plugins) {
                    plugin.onRender?.();
                  }

                  return (
                    <Layout data={data} path={args.path}>
                      {markdownBody}
                    </Layout>
                  );
                },
              },
            });
          },
        );
      },
    },
  };
};
