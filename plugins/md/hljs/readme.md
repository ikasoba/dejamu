# Highlight.js Plugin

```js
import type { Config } from "dejamu/mod.ts";
import PreactPlugin from "dejamu/plugins/preact/mod.ts";
import MarkdownPlugin from "dejamu/plugins/md/mod.ts";
import HljsPlugin from "dejamu/plugins/md/hljs/mod.ts";

export default {
  entryPoints: ["pages/**/*.md"],
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
  ],
} satisfies Config;
```