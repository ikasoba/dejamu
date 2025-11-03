---
layout: Documentation.tsx
---

# Dejamu Documentation

## `GlobalThis#isBrowser`

false if the code currently being executed is being executed at pre-rendering time true if it is being executed in a browser.

- Module: [dejamu/mod.ts](https://github.com/ikasoba/dejamu/blob/main/mod.ts)
- Location: [dejamu/plugins/global.d.ts](https://github.com/ikasoba/dejamu/blob/main/plugins/global.d.ts)

## `GlobalThis#pageDirectory`

Relative path from the project root to the parent directory of the current page.

- Module: [dejamu/mod.ts](https://github.com/ikasoba/dejamu/blob/main/mod.ts)
- Location: [dejamu/plugins/global.d.ts](https://github.com/ikasoba/dejamu/blob/main/plugins/global.d.ts)

## `GlobalThis#projectRoot`

Relative path from the current location to the project root.

- Module: [dejamu/mod.ts](https://github.com/ikasoba/dejamu/blob/main/mod.ts)
- Location: [dejamu/plugins/global.d.ts](https://github.com/ikasoba/dejamu/blob/main/plugins/global.d.ts)

## `<Head> ... </Head>`

Append vnodes to head.

- Module: [dejamu/mod.ts](https://github.com/ikasoba/dejamu/blob/main/mod.ts)
- Location: [dejamu/plugins/Head.tsx](https://github.com/ikasoba/dejamu/blob/main/plugins/Head.tsx)

## `interface Config`

Type declraration of dejamu.config.ts.

- Module: [dejamu/mod.ts](https://github.com/ikasoba/dejamu/blob/main/mod.ts)
- Location: [dejamu/core/Config.ts](https://github.com/ikasoba/dejamu/blob/main/core/Config.ts)

## `type DejamuPlugin`

Plugin interface.

- Module: [dejamu/mod.ts](https://github.com/ikasoba/dejamu/blob/main/mod.ts)
- Location: [dejamu/pluginSystem/Plugin.ts](https://github.com/ikasoba/dejamu/blob/main/pluginSystem/Plugin.ts)

## `asset(loc: string): string`

This hook declares dependent assets.

It should be called by components during the build process.

- If it starts with `/`, it is interpreted as a relative path to the project root.

- Otherwise, it attempts to resolve the reference as a module.

This feature instructs the builder to copy dependent assets and caches them when they represent external assets.

- Module: [dejamu/comptime.ts](https://github.com/ikasoba/dejamu/blob/main/comptime.ts)
- Location: [dejamu/plugins/asset.ts](https://github.com/ikasoba/dejamu/blob/main/plugins/asset.ts)

