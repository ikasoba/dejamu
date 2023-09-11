import * as fs from "../deps/fs.ts";

const asyncIterableIteratorToArray = async <T>(
  iter: AsyncIterableIterator<T>,
) => {
  const res = [];
  for await (const item of iter) res.push(item);

  return res;
};

export const glob = (pattern: string) =>
  asyncIterableIteratorToArray(fs.expandGlob(pattern));
