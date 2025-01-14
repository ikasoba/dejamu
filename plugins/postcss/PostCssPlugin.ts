import postcss from "npm:postcss@^8";
import * as path from "../../deps/path.ts";
import { DejamuPlugin } from "../../core/plugins/Plugin.ts";
import { DejamuContext } from "../../core/context.ts";

export const PostCssPlugin = (
  extensions: string[],
  plugins: postcss.AcceptedPlugin[] = []
): DejamuPlugin => {
  const processor = postcss(plugins);

  return {
    type: "esbuild",
    plugin: {
      name: "PostCssPlugin",
      setup(build) {
        build.onResolve({ filter: /^/ }, (args) => {
          if (extensions.includes(path.extname(args.path))) {
            return {
              namespace: "PostCssPlugin",
              path: args.path,
            };
          }
        });

        build.onLoad(
          { filter: /^/, namespace: "PostCssPlugin" },
          async (args) => {
            const rawStyle = await DejamuContext.current.features.fs.readTextFile(args.path);

            const res = await processor.process(rawStyle);

            return {
              contents: res.css,
              loader: "copy",
            };
          }
        );
      },
    },
  };
};
