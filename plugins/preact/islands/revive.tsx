import { ComponentType, hydrate } from "npm:preact";
import { deserialize } from "./serialize.ts";
import { unescapeHTML } from "../../../utils/escapeHTML.ts";

interface HydrationInfo {
  id: string;
  prop: any;
  component?: Function;
  isHydrated: boolean;
  endpoint: Comment;
}

const HydrationInfo = new WeakMap<Comment, HydrationInfo>();

export function revive(
  islands: Record<string, Promise<ComponentType<any>>>,
  node: Node,
  deferredTasks: Promise<(() => void) | undefined>[] = [],
  isRoot = true,
) {
  type StackContent =
    | {
      type: "start-islands";
      info: HydrationInfo;
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

        let info = HydrationInfo.get(child);
        if (!info) {
          HydrationInfo.set(
            child,
            info = {
              id,
              prop,
              isHydrated: false,
              endpoint: child,
            },
          );
        }

        stack.push({
          type: "start-islands",
          info,
        });

        continue;
      } else if (child.textContent?.startsWith("/djm-ph")) {
        const [_, id] = child.textContent.split(":", 2);
        if (!(id in islands)) {
          continue;
        }

        const componentPromise = islands[id];
        let info: HydrationInfo;

        const parent = child.parentNode;

        const children: Node[] = [];

        while (1) {
          const v = stack.pop();

          if (v == null) {
            throw new Error("invalid partial hydrate comment.");
          }

          if (v.type == "start-islands") {
            info = v.info;

            break;
          }

          children.push(v.value);
        }

        deferredTasks.push(componentPromise.then((Component) => {
          if (info.isHydrated && info.component == Component) return;

          info.isHydrated = true;
          info.component = Component;

          const preactNode = <Component {...info.prop} />;

          return () => {
            console.time("dejamu hydrate");
            const container = document.createDocumentFragment();

            container.append(...children);

            hydrate(preactNode, container);

            console.timeEnd("dejamu hydrate");

            parent?.insertBefore(container, child);
          };
        }));

        continue;
      }
    }

    if (child.childNodes.length) {
      revive(islands, child, deferredTasks, false);
    }

    stack.push({
      type: "node",
      value: child,
    });
  }

  if (isRoot) {
    let current = Promise.resolve();

    for (const promise of deferredTasks) {
      promise.then((fn) => {
        if (fn) current = current.then(fn)
      });
    }
  }
}
