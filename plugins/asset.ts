import * as path from "../deps/path.ts";

const assetInfo = {
  assetPaths: new Set<string>(),
};

export function getAssets() {
  const res = assetInfo.assetPaths;
  assetInfo.assetPaths = new Set();

  return res;
}

export function asset(src: string) {
  if ("Deno" in window) {
    assetInfo.assetPaths.add(path.resolve(src));
  }

  return src;
}
