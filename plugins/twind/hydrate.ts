import { cssom, setup, tw, TwindConfig } from "@twind/core";
import { options } from "npm:preact";

export function hydrate(config: TwindConfig) {
  const style = document.getElementById("__DJM_TWIND__") as HTMLStyleElement;

  setup(config, cssom(style));

  const oldVnode = options.vnode;
  options.vnode = (node) => {
    if (
      typeof node.type == "string" && "className" in node.props &&
      typeof node.props.className == "string"
    ) {
      node.props.className = tw(node.props.className);
    }

    oldVnode?.(node);
  };
}
