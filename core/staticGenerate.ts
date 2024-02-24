import { renderToString } from "npm:preact-render-to-string";
import { createHydrateScript } from "../loader/hydrator.ts";
import { Attributes, Fragment, VNode, h, options } from "preact";
import { IslandsInfo } from "./buildContext.ts";
import { DejamuContext } from "./buildContext.ts";
import prepass from "npm:preact-ssr-prepass";

export async function staticGenerateToFile(
  context: DejamuContext,
  path: string,
  node: VNode<any>
) {
  const processed = new Set();
  const prevHook = options.vnode;
  const deps = new Set<IslandsInfo>();

  options.vnode = (vnode) => {
    if (
      typeof vnode.type === "function" &&
      !processed.has(vnode) &&
      context.islands.has(vnode.type)
    ) {
      const info = context.islands.get(vnode.type)!;
      const Component = vnode.type;

      deps.add(info);

      vnode.type = (props) => {
        const node = h(Component, props);
        processed.add(node);

        return h(
          Fragment,
          null,
          h(Fragment, {
            UNSTABLE_comment: `djm:s:h:${info.id}:${JSON.stringify(props)}`,
          } as Attributes),
          node,
          h(Fragment, {
            UNSTABLE_comment: "djm:e:h",
          } as Attributes)
        );
      };
    }

    prevHook?.(vnode);
  };

  await prepass(node);

  let html = renderToString(node);

  options.vnode = prevHook;

  const preloads = renderToString(
    h(
      Fragment,
      null,
      ...[...deps].map((info) =>
        h("link", {
          rel: "modulepreload",
          href: info.source.toString(),
        })
      )
    )
  );

  const hydrateScript = renderToString(
    h("script", {
      type: "module",
      dangerouslySetInnerHTML: {
        __html: createHydrateScript(deps),
      },
    } as Attributes)
  );

  html = html
    .replace("<head>", `<head>${preloads}`)
    .replace("</body>", `${hydrateScript}</body>`);

  html = `<!doctype html>${html}`;

  context.outfiles.push({
    path,
    contents: html,
    deps: [...deps].map((x) => x.source.toString()),
  });
}
