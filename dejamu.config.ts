import type { Config } from "dejamu/mod.ts";
import PreactPlugin from "dejamu/plugins/preact/mod.ts";
import MarkdownPlugin from "dejamu/plugins/md/mod.ts";
import TwindPlugin from "dejamu/plugins/twind/mod.ts";
import HljsPlugin from "dejamu/plugins/md/hljs/mod.ts";

export default {
  entryPoints: ["pages/**/*.{jsx,tsx,md}"],
  plugins: [
    PreactPlugin(),
    MarkdownPlugin({
      layouts: "layouts/",
      plugins: [
        HljsPlugin({
          theme: "github-dark-dimmed",
        }),
      ],
    }),
    TwindPlugin({
      styles: ["styles/*.css"],
    }),
  ],
} satisfies Config;
