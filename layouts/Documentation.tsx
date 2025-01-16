import { Head } from "dejamu/mod.ts";
import { Markdown } from "dejamu/plugins/md/Markdown.tsx";
import { LayoutComponent } from "dejamu/plugins/md/MarkdownPlugin.tsx";
import Counter from "../components/Counter.islands.tsx";
import { SiteHeader } from "../components/SiteHeader.tsx";

export default (function Documentation({ children }) {
  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <title>Dejamu🛌 Documention</title>
      </Head>
      <SiteHeader />
      <Markdown>
        {children}
      </Markdown>
      <footer className="footer">
        <a href="https://github.com/ikasoba/dejamu">
          Github Repository
        </a>
        <Counter />
      </footer>
    </>
  );
}) satisfies LayoutComponent;
