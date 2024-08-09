import {
  Component,
  ComponentType,
  Fragment,
  options as _options,
  VNode,
} from "npm:preact";
import { getIslandsState, Island } from "./registerIslands.ts";
import { serialize } from "./serialize.ts";
import { escapeHTML } from "../../utils/escapeHTML.ts";

const options: (typeof _options) & {
  __b?(node: VNode): void;
  __r?(node: VNode): void;
} = _options;

let islands: Set<Island> = new Set();

let nodeStack: VNode[] = [];

let islandsNestLevel = 0;

export const getIslands = () => {
  const res = islands;
  islands = new Set();

  return res;
};

export const initHooks = () => {
  islandsNestLevel = 0;
  nodeStack = [];
  islands = new Set();
};

const patched = new WeakSet<VNode>();

const oldDiff = options.__b;
const oldDiffed = options.diffed;

options.__b = (vnode) => {
  nodeStack.push(vnode);

  const island = getIslandsState().islands.find((x) =>
    vnode.type == x.component
  );

  if (island && !patched.has(vnode)) {
    islandsNestLevel++;
  }

  if (island && islandsNestLevel == 1 && !patched.has(vnode)) {
    patched.add(vnode);
    islands.add(island);

    const Component = vnode.type as ComponentType<any>;
    vnode.type = ((props: any) => {
      const res = <Component {...props} />;
      patched.add(res);

      return (
        <Fragment>
          <Fragment
            {...{
              UNSTABLE_comment: `djm-ph:${island.id}:${
                escapeHTML(JSON.stringify(serialize(vnode.props)), [":"])
              }`,
              children: [],
            }}
          />
          {res}
          <Fragment
            {...{ UNSTABLE_comment: `/djm-ph:${island.id}`, children: [] }}
          />
        </Fragment>
      );
    }) satisfies ComponentType<any>;
  }

  oldDiff?.(vnode);
};

options.diffed = (vnode) => {
  const p = nodeStack.pop();
  const isIslands = p &&
    getIslandsState().islands.some((x) => p!.type == x.component);

  if (p && isIslands) {
    islandsNestLevel--;
  }

  oldDiffed?.(vnode);
};
