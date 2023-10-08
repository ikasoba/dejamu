import type { Config } from "dejamu/mod.ts";
import PreactPlugin from "dejamu/plugins/preact/mod.ts";
import MarkdownPlugin from "dejamu/plugins/md/mod.ts";
import TwindPlugin from "dejamu/plugins/twind/mod.ts";

export default {
  entryPoints: ["pages/**/*.{jsx,tsx,md}"],
  plugins: [
    PreactPlugin(),
    MarkdownPlugin("layouts/"),
    TwindPlugin({
      styles: ["styles/*.css"],
    }),
  ],
} satisfies Config;
