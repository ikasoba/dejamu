import { Plugin } from "../../deps/esbuild.ts";
import { FunctionComponent } from "npm:preact/";
import { render } from "npm:preact-render-to-string/";
import * as path from "../../deps/path.ts";
import { getHeadChildren, resetHeadChildren } from "../Head.tsx";
import { esbuild } from "https://deno.land/x/esbuild_deno_loader@0.8.1/deps.ts";
import { renderToFile } from "../render.tsx";

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

        jsFilePath = path.relative(path.dirname(htmlFilePath), jsFilePath);

        await renderToFile(
          <Page />,
          htmlFilePath,
          jsFilePath,
        );

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
