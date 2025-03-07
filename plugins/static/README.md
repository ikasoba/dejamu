# Static Plugin

Static resource serving plugin.

## dejamu.config.ts
```ts
import type { Config } from "dejamu/mod.ts";
import StaticPlugin from "dejamu/plugins/static/mod.ts";

export default {
  plugins: [
    StaticPlugin({
      inputs: [
        {
          staticRoot: "./static/",
          dest: "/"
        }
      ]
    })
  ],
} satisfies Config;
```

## static/robots.txt
```plain
User-agent: *
Disallow: /secret.html
```
