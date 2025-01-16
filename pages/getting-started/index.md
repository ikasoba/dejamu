---
layout: DejamuPage.tsx
---

# 🤔 What is Dejamu?

Dejamu is a Preact framework for building static web pages.

## ✨ Features

- ___Islands:___

  Partially hydrate components that run on the client side.

- ___Friendly:___

  Get started today with minimal configuration.

- ___Plugins:___

  [Plugins](../plugins/) can be used to build sites in a variety of formats.

# 🛠 How to use

## Initialize the site

Extract the minimum template to the current directory.

```sh
deno run -rA https://raw.githubusercontent.com/ikasoba/dejamu/main/scripts/init.ts
```

## Build the site

```sh
deno task build
```

## Start the local server

You can also set up a local server capable of hot reloading to facilitate development.

```sh
deno task serve
```

## Let's write

<div style="margin: 1rem 0; font-size: 0.75rem" class="horizontal">

```tsx
import { Head } from "dejamu/mod.ts";
import { LayoutComponent } from "dejamu/plugins/md/MarkdownPlugin.tsx";
import { Markdown } from "dejamu/plugins/md/Markdown.tsx";

export default (function Layout({ children }) {
  return (
    <Head>
      <title>Hoge's Blog</title>
    </Head>

    <main>
      <Markdown>
        { children }
      </Markdown>
    </main>
  );
}) satisfies LayoutComponent;
```

```
---
layout: Article.tsx
---

# How to Enjoy Breakfast

...
```

</div>
