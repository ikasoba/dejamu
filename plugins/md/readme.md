# Markdown Plugin

> [!NOTE]
> This plugin depends on the [Preact plugin](../preact/readme.md).

```ts
import type { Config } from "dejamu/mod.ts";
import PreactPlugin from "dejamu/plugins/preact/mod.ts";
import MarkdownPlugin from "dejamu/plugins/md/mod.ts";

export default {
  entryPoints: ["pages/*.{jsx,tsx,md}"],
  plugins: [
    PreactPlugin(),
    MarkdownPlugin({
      // Specify the layout root directory.
      layouts: "layouts/"
    }),
  ],
} satisfies Config;
```