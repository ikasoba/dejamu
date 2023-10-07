# Twind Plugin

## dejamu.config.ts
```ts
import type { Config } from "dejamu/mod.ts";
import TwindPlugin from "dejamu/plugins/twind/mod.ts";

export default {
  plugins: [
    TwindPlugin("twind.config.ts"),
  ],
} satisfies Config;

```
## deno.json
```
{
  "imports": {
    "@twind/": "npm:/@twind/"
  }
}
```