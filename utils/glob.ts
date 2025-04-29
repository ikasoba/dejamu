import { DejamuContext } from "../core/context.ts";
import { globToRegExp, normalizeGlob, relative } from "../deps/path.ts";

export const asyncIterableIteratorToArray = async <T>(
  iter: AsyncIterableIterator<T>,
) => {
  const res = [];
  for await (const item of iter) res.push(item);

  return res;
};

export const asyncIterableToArray = async <T>(
  iter: AsyncIterable<T>,
) => {
  const res = [];
  for await (const item of iter) res.push(item);

  return res;
};

export const glob = (pattern: string | RegExp) =>
  asyncIterableIteratorToArray(globFrom(pattern, DejamuContext.current.features.fs.getEntries(Deno.cwd())));

export async function* globFrom(pattern: string | RegExp, iter: AsyncIterableIterator<string>) {
  const regexp = typeof pattern == "string" ? globToRegExp(normalizeGlob(pattern)) : pattern;

  for await (const path of iter) {
    if (new RegExp(regexp).test(relative(Deno.cwd(), path))) {
      yield path;
    }
  }
}
