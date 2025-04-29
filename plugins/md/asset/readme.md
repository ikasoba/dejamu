# Markdown Asset Plugin

Marks the image in the markdown as an asset.

```js
import type { Config } from "dejamu/mod.ts";
import PreactPlugin from "dejamu/plugins/preact/mod.ts";
import MarkdownPlugin from "dejamu/plugins/md/mod.ts";
import MdAssetPlugin from "dejamu/plugins/md/asset/mod.ts";

export default {
  entryPoints: ["pages/**/*.md"],
  plugins: [
    PreactPlugin(),
    MarkdownPlugin({
      layouts: "layouts/",
      plugins: [
        MdAssetPlugin()
      ],
    }),
  ],
} satisfies Config;
```
