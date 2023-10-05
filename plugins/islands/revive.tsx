import { ComponentType, hydrate } from "npm:preact";
import { deserialize } from "./serialize.ts";
import { unescapeHTML } from "../../utils/escapeHTML.ts";

export function revive(
  islands: Record<string, ComponentType<any>>,
  node: Node,
) {
  type StackContent =
    | {
      type: "start-islands";
      id: string;
      prop: any;
    }
    | {
      type: "node";
      value: Node;
    };

  const stack: StackContent[] = [];
  const childNodes = Array.from(node.childNodes);

  while (childNodes.length) {
    const child = childNodes.shift()!;

    if (child instanceof Comment) {
      if (child.textContent?.startsWith("djm-ph")) {
        const [_, id, _prop] = child.textContent.split(":", 3);
        if (!(id in islands)) {
          continue;
        }

        const prop = deserialize(
          JSON.parse(unescapeHTML(_prop.replaceAll("&amp;", "&"), [":"])),
        );

        stack.push({
          type: "start-islands",
          id,
          prop,
        });

        child.remove();

        continue;
      } else if (child.textContent?.startsWith("/djm-ph")) {
        const [_, id] = child.textContent.split(":", 2);
        if (!(id in islands)) {
          continue;
        }

        const Component = islands[id];
        let prop: object = {};

        const parent = child.parentNode;
        const next = child.nextSibling;

        child.remove();

        const container = document.createDocumentFragment();

        while (1) {
          const v = stack.pop();
          if (v == null) {
            throw new Error("invalid partial hydrate comment.");
          }
          if (v.type == "start-islands") {
            prop = v.prop;

            break;
          }

          container.append(v.value);
        }

        hydrate(<Component {...prop} />, container);

        parent?.insertBefore(container, next);

        continue;
      }
    }

    if (child.childNodes.length) {
      revive(islands, child);
    }

    stack.push({
      type: "node",
      value: child,
    });
  }
}
