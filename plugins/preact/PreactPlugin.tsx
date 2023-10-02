import { Plugin } from "../../deps/esbuild.ts";
import { FunctionComponent } from "npm:preact/";
import { render } from "npm:preact-render-to-string/";
import * as path from "../../deps/path.ts";
import { getHeadChildren, resetHeadChildren } from "../Head.tsx";
import { getAssets } from "../asset.ts";
import { esbuild } from "https://deno.land/x/esbuild_deno_loader@0.8.1/deps.ts";

export const PreactPlugin = (): Plugin => {
  return {
    name: "PreactPlugin",
    setup(build) {
      build.onResolve({ filter: /\.[jt]sx$/ }, async (args) => {
        globalThis.isBrowser = false;

        if (
          args.kind != "entry-point" ||
          args.namespace == "PreactPlugin-stdin" ||
          args.path == "PreactPlugin-stdin"
        ) return;

        const { default: Page }: { default: FunctionComponent } = await import(
          path.toFileUrl(path.resolve(args.path)).toString()
        );

        const jsFilePath = path.basename(args.path, path.extname(args.path)) +
          ".js";

        const htmlFilePath = path.join(
          build.initialOptions.outdir ?? "./",
          path.basename(args.path, path.extname(args.path)) + ".html",
        );

        resetHeadChildren();
        const renderedPage = render(<Page />);

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
          namespace: "PreactPlugin",
          path: args.path,
        };
      });

      build.onLoad({ filter: /.*/, namespace: "PreactPlugin" }, (args) => {
        return {
          contents: `
            import {hydrate} from "npm:preact/";
            import Page from ${
            JSON.stringify(
              path.toFileUrl(path.resolve(args.path)).toString(),
            )
          };

            hydrate(<Page/>, document.body);
          `,
          loader: "tsx",
        };
      });
    },
  };
};
