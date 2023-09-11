import "dejamu/plugins/global.d.ts";

import type { Config } from "dejamu/mod.ts";
import PreactPlugin from "dejamu/plugins/preact/mod.ts";
import MarkdownPlugin from "dejamu/plugins/md/mod.ts";

export default {
  entryPoints: ["pages/*.{jsx,tsx,md}"],
  plugins: [
    PreactPlugin(),
    MarkdownPlugin("layouts/"),
  ],
} satisfies Config;
