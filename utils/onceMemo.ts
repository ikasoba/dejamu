import { useMemo } from "npm:preact/hooks";
import { VNode, options } from "npm:preact/";

let memos = new Map<number, any>();
let ctx = {
  id: 0,
};

export const resetMemoContext = () => {
  ctx = {
    id: 0,
  };
};

export const resetMemos = () => {
  memos = new Map();
};

export const onceMemo = <T>(fn: () => T): T => {
  if (!isBrowser) {
    const id = ctx.id++;
    const memo = memos.get(id);
    if (memo) return memo;

    const res = fn();
    memos.set(id, res);

    return res;
  } else {
    return useMemo(fn, []);
  }
};
