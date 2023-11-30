import { useEffect, useState } from "npm:preact/hooks";
import { onceMemo } from "../utils/onceMemo.ts";

let promises: Promise<void>[] = [];
const promiseResults = new Map<Promise<any>, any>();

export const collectPromises = () => {
  const res = promises;
  promises = [];

  return res;
};

export function usePromise<T>(fn: () => Promise<T>): T | undefined {
  if (!isBrowser) {
    const promise = onceMemo(() => {
      const res = fn();
      promises.push(
        res.then((x) => {
          promiseResults.set(res, x);
        })
      );
      return res;
    });

    return promiseResults.get(promise);
  } else {
    const [res, setRes] = useState<T>();
    useEffect(() => {
      const res = fn();
      res.then((x) => {
        setRes(x);
      });
    }, []);

    return res;
  }
}
