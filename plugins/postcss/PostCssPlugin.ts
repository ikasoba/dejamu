import { Plugin } from "../../deps/esbuild.ts";
import postcss from "https://esm.sh/postcss@8.4.31";
import * as path from "../../deps/path.ts";
import { DejamuPlugin } from "../../pluginSystem/Plugin.ts";

export const PostCssPlugin = (
  extensions: string[],
  plugins: postcss.AcceptedPlugin[] = [],
): DejamuPlugin => {
  const processor = postcss(plugins);

  return {
    type: "esbuild",
    plugin: {
      name: "PostCssPlugin",
      setup(build) {
        build.onResolve(
          { filter: /.*/ },
          (args) => {
            if (
              extensions.includes(path.extname(args.path))
            ) {
              return {
                namespace: "PostCssPlugin",
                path: args.path,
              };
            }
          },
        );

        build.onLoad(
          { filter: /.*/, namespace: "PostCssPlugin" },
          async (args) => {
            const rawStyle = await Deno.readTextFile(args.path);

            const res = await processor.process(rawStyle);

            return {
              contents: res.css,
              loader: "copy",
            };
          },
        );
      },
    },
  };
};
