# Highlight.js Plugin

```js
import type { Config } from "dejamu/mod.ts";
import MarkdownPlugin from "dejamu/plugins/md/mod.ts";
import HljsPlugin from "dejamu/plugins/md/hljs/mod.ts";

export default {
  entryPoints: ["pages/**/*.md"],
  plugins: [
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