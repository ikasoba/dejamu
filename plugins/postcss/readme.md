# PostCSS Plugin

```ts
import type { Config } from "dejamu/mod.ts";
import PostCssPlugin from "dejamu/plugins/postcss/mod.ts";
import cssnano from "npm:cssnano";

export default {
  entryPoints: ["pages/*.{jsx,tsx,md}", "styles/*.css"],
  plugins: [
    PostCssPlugin(
      // Specify file extensions to build.
      [".css"],
      // Specify plug-ins for PostCSS.
      [
        cssnano({ preset: "default" })
      ]
    )
  ],
} satisfies Config;
```