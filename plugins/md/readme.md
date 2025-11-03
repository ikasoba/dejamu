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

## `MarkdownBuildContext`

Additional information such as relative paths to the Markdown project root is stored in the `MarkdownBuildContext`.

> [!NOTE]
> Since this is provided via AsyncLocalStorage, be aware that it cannot be retrieved in environments with a different call stack.

```ts
import { MarkdownExtension, useMarkdownBuildContext } from "../MarkdownPlugin.tsx";

export function MdAssetPlugin(): MarkdownExtension {
  return {
    onRender() {
      const mdContext = useMarkdownBuildContext();
      // ex: { sourcePath: "./pages/index.md" }
    }
  };
}
```
