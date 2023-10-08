# Twind Plugin

## dejamu.config.ts
```ts
import type { Config } from "dejamu/mod.ts";
import TwindPlugin from "dejamu/plugins/twind/mod.ts";

export default {
  plugins: [
    TwindPlugin(),
  ],
} satisfies Config;

```
## deno.json
```json
{
  "imports": {
    "@twind/": "npm:/@twind/"
  }
}
```

## twind.config.ts
```ts
import { defineConfig } from "@twind/core";
import presetTailwind from "@twind/preset-tailwind";
import presetExt from "@twind/preset-ext";

export default defineConfig({
  presets: [
    presetTailwind(),
    presetExt(),
  ],
});
```
