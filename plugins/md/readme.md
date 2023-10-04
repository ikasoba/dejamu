# Markdown Plugin

```ts
import type { Config } from "dejamu/mod.ts";
import MarkdownPlugin from "dejamu/plugins/md/mod.ts";

export default {
  entryPoints: ["pages/*.{jsx,tsx,md}"],
  plugins: [
    MarkdownPlugin(
      // Specify the layout root directory.
      "layouts/"
    ),
  ],
} satisfies Config;
```