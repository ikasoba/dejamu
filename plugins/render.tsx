import { VNode } from "npm:preact";
import { getHeadChildren, resetHeadChildren } from "./Head.tsx";
import { render } from "npm:preact-render-to-string";
import prepass from "npm:preact-ssr-prepass";
import * as path from "../deps/path.ts";

export async function renderToFile(
  node: VNode,
  htmlFilePath: string,
  jsFilePath?: string,
) {
  await prepass(node);

  resetHeadChildren();

  const renderedNode = render(node);

  const html = `<!doctype html>${
    render(
      <html>
        <head>
          <meta charSet="utf-8" />
          {jsFilePath && (
            <script
              src={jsFilePath}
              defer
              type="module"
            />
          )}
          {...getHeadChildren()}
        </head>
        <body dangerouslySetInnerHTML={{ __html: renderedNode }} />
      </html>,
    )
  }`;

  await Deno.mkdir(path.dirname(htmlFilePath), { recursive: true });
  await Deno.writeTextFile(htmlFilePath, html);
}
