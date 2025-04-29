import hljs from "npm:highlight.js@11.10.0";
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
          media="print"
          {...{ onload: "this.media='all'" }}
        />,
      );
    },
    renderer: {
      code(code) {
        const res = code.lang
          ? hljs.highlight(code.text, { language: code.lang })
          : hljs.highlightAuto(code.text);

        return `<pre class="hljs"><code>${res.value}</code></pre>`;
      },
    },
  };
}
