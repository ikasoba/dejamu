# Preact Plugin

```ts
import type { Config } from "dejamu/mod.ts";
import PreactPlugin from "dejamu/plugins/preact/mod.ts";

export default {
  entryPoints: ["pages/*.{jsx,tsx,md}"],
  plugins: [
    PreactPlugin()
  ],
} satisfies Config;
```