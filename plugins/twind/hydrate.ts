import { cssom, setup, tw, TwindConfig } from "@twind/core";
import { options } from "npm:preact";

let isSetupped = false;
let isHookAdapted = false;
let prevKey;

export function hydrate(config: TwindConfig) {
  const style = document.getElementById("__DJM_TWIND__") as HTMLStyleElement;
  prevKey ??= style.getAttribute("x-key");

  if (prevKey != style.getAttribute("x-key")) {
    prevKey = style.getAttribute("x-key");

    isSetupped = false;
  }

  if (!isSetupped) {
    const om = cssom(style);
    setup(config, om);

    isSetupped = true;
  }

  if (!isHookAdapted) {
    const oldVnode = options.vnode;
    options.vnode = (node) => {
      if (
        typeof node.type == "string" && "className" in node.props &&
        typeof node.props.className == "string"
      ) {
        node.props.className = tw(node.props.className);
      } else if (
        typeof node.type == "string" && "class" in node.props &&
        typeof node.props.class == "string"
      ) {
        node.props.class = tw(node.props.class);
      }

      oldVnode?.(node);
    };

    isHookAdapted = true;
  }
}
