import renderToString from "npm:preact-render-to-string";
import hljs from "npm:highlight.js";
import { MarkdownExtension } from "../MarkdownPlugin.tsx";
import { appendHead } from "../../Head.tsx";
import { asset } from "../../asset.ts";

export function HljsPlugin(
  { theme = "github-dark-dimmed" }: { theme?: string },
): MarkdownExtension {
  return {
    onRender() {
      appendHead(
        <link
          rel="stylesheet"
          href={asset(`npm:highlight.js/styles/${theme}.css`)}
        />,
      );
    },
    renderer: {
      code(code, infostring, escaped) {
        const res = infostring
          ? hljs.highlight(code, { language: infostring })
          : hljs.highlightAuto(code);

        return `<pre class="hljs"><code>${res.value}</code></pre>`;
      },
    },
  };
}
