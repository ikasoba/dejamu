import { getHeadChildren } from "./Head.tsx";
import { renderToStringAsync } from "../deps/preact-render-to-string.ts";

export async function template(
  body: string,
  globalData: Record<string, any>,
  jsFilePath: string | undefined,
) {
  const html = `<!doctype html>${await renderToStringAsync(
    <html>
      <head>
        <meta charSet="utf-8" />
        <script
          dangerouslySetInnerHTML={{
            __html: Object.entries(globalData)
              .map(([k, v]) => `var ${k} = ${JSON.stringify(v)}`)
              .join(";"),
          }}
        >
        </script>
        {jsFilePath && (
          <script
            src={jsFilePath}
            type="module"
            async
          />
        )}
        {...getHeadChildren()}
      </head>
      <body dangerouslySetInnerHTML={{ __html: body }} />
    </html>,
  )}`;

  return html;
}
