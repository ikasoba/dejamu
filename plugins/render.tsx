import { ComponentType, VNode } from "npm:preact";
import { getHeadChildren, resetHeadChildren } from "./Head.tsx";
import { render } from "npm:preact-render-to-string";
import prepass from "npm:preact-ssr-prepass";
import * as path from "../deps/path.ts";

export function template(
  body: string,
  globalData: Record<string, any>,
  jsFilePath?: string,
): string {
  const html = `<!doctype html>${
    render(
      <html>
        <head>
          <meta charSet="utf-8" />
          {jsFilePath && (
            <script
              src={jsFilePath}
              type="module"
              async
            />
          )}
          <script
            dangerouslySetInnerHTML={{
              __html: Object.entries(globalData)
                .map(([k, v]) => `var ${k} = ${JSON.stringify(v)}`)
                .join(";"),
            }}
          >
          </script>
          {...getHeadChildren()}
        </head>
        <body dangerouslySetInnerHTML={{ __html: body }} />
      </html>,
    )
  }`;

  return html;
}
