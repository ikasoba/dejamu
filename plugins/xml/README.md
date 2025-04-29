# Xml Plugin

## dejamu.config.ts
```ts
import type { Config } from "dejamu/mod.ts";
import XmlPlugin from "dejamu/plugins/xml/mod.ts";

export default {
  plugins: [
    XmlPlugin(),
  ],
} satisfies Config;

```

## example.xml.tsx
```tsx
import { xml } from "dejamu/plugins/xml/mod.ts";

export default function ExampleXml() {
  const Feed = xml("feed");
  const Entry = xml("entry");

  return (
    <Feed xmlns="http://www.w3.org/2005/Atom">
      <Entry>
        <title>example</title>
      </Entry>
    </Feed>
  )
}
```
