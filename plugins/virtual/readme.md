# Virtual Plugin

Virtual Plugin is a plug-in for giving virtual input.

This is useful when using a CMS, for example.

## dejamu.config.ts
```ts
import type { Config } from "dejamu/mod.ts";
import VirtualPlugin from "dejamu/plugins/virtual/mod.ts";
import articles from "./articles.ts";

export default {
  plugins: [
    VirtualPlugin(articles),
  ],
} satisfies Config;

```

## articles.ts
```ts
import { VirtualFile } from "dejamu/plugins/virtual/mod.ts";

export default [
  {
      path: "./pages/index.md",
      getHashable() {
        return this.getContent();
      },
      getContent() {
        return new TextEncoder().encode("**Hello, world!**");
      }
  }
] satisfies VirtualFile[];
```
