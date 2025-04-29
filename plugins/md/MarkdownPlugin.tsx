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

interface MarkdownDocument {
  data: Record<string, any>;
  markdownBody: string;
}

const loadMarkdown = async (path: string): Promise<MarkdownDocument> => {
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

interface CachedDocument {
  hash: string;
  result: MarkdownDocument;
}

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
        const cache = await DejamuContext.current.features.cache.open(
          "dejamu/plugins/md",
        );

        build.onResolve(
          { filter: /\.md$/, namespace: "file" },
          async (args) => {
            const sourcePath = path.resolve(args.resolveDir, args.path);

            const hash = encodeBase64(
              await DejamuContext.current.features.fs.getHash(sourcePath),
            );

            const rawCached = await cache.get("body:" + args.path);
            const cached = rawCached && JSON.parse(rawCached) as CachedDocument;

            let result;
            if (cached && cached.hash == hash) {
              result = cached.result;
            } else {
              result = await loadMarkdown(args.path);

              await cache.set(
                args.path,
                JSON.stringify({
                  hash,
                  result,
                }),
              );
            }

            const { data, markdownBody } = result;

            const htmlFilePath = path.join(
              "./",
              path.relative(Deno.cwd(), path.dirname(args.path)).split(path.SEP)
                .slice(1).join(path.SEP),
              path.basename(args.path, path.extname(args.path)) + ".html",
            ).replaceAll("\\", "/");

            DejamuContext.current.features.pages.set(args.path, {
              title: data.title,
              description: data.description,
              timestamp: data.timestamp ? new Date(data.timestamp) : undefined,
              outputPath: htmlFilePath,
              sourcePath: args.path,
            });

            const layoutPath = data?.layout != null
              ? path.relative(
                Deno.cwd(),
                path.resolve(path.join(layouts, `${data.layout}`)),
              )
              : null;

            const layoutHash = await cache.get("layout_hash:" + layoutPath);

            const onLayoutHashUpdated = async (hash: string) => {
              await cache.set("layout_hash:" + layoutPath, hash);
            };

            const Layout: LayoutComponent = layoutPath
              ? (await dynamicImport(
                layoutPath,
                undefined,
                onLayoutHashUpdated,
              )).default
              : EmptyLayout;

            return build.resolve(args.path, {
              kind: args.kind,
              importer: args.importer,
              resolveDir: args.resolveDir,
              namespace: "PreactPlugin",
              pluginData: {
                inputs: [
                  hash,
                  layoutHash,
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
