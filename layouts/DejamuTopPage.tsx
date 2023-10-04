import { Head } from "dejamu/mod.ts";
import { Markdown } from "dejamu/plugins/md/Markdown.tsx";
import { LayoutComponent } from "dejamu/plugins/md/MarkdownPlugin.tsx";
import Counter from "../components/Counter.tsx";

export default (function DejamuTopPage({ children }) {
  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <link rel="stylesheet" href="styles/index.css" />
        <title>Dejamu🛌</title>
      </Head>
      <Markdown>
        {children}
      </Markdown>
      <hr />
      <footer>
        <a href="https://github.com/ikasoba/dejamu">
          Github Repository
        </a>
        <Counter />
      </footer>
    </>
  );
}) satisfies LayoutComponent;
