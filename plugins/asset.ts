import * as path from "../deps/path.ts";
import * as semver from "../deps/semver.ts";
import { createDirectoryIfNotExists } from "../utils/createDirectoryIfNotExists.ts";
import {
  asyncIterableIteratorToArray,
  asyncIterableToArray,
} from "../utils/glob.ts";
import { createIdGenerator } from "../utils/id.ts";
import { Awaitable } from "../utils/types.ts";
import { cache } from "https://deno.land/x/cache/mod.ts";

let assetPair: Map<string, string>;
let genId: () => string;
let outdir: string;
let queuedBatches: (() => Awaitable<void>)[];

export const initAssets = async (_outdir: string) => {
  assetPair = new Map();
  genId = createIdGenerator();
  outdir = _outdir;
  queuedBatches = [];

  await createDirectoryIfNotExists(path.join(_outdir, "./__assets__/"));
};

export const copyAssets = async () => {
  while (queuedBatches.length) {
    const fn = queuedBatches.pop()!;
    await fn();
  }
};

export const asset = (source: string) => {
  if (source.startsWith("/")) {
    source = path.normalize(source);

    if (assetPair.has(source)) return assetPair.get(source)!;

    const extname = path.extname(source);
    const assetDest = `__assets__/${genId()}${extname}`;
    const assetPath = path.join(projectRoot, assetDest);
    assetPair.set(source, assetPath);

    queuedBatches.push(async () => {
      await Deno.copyFile(`.${source}`, path.join(outdir, assetDest));
    });

    return assetPath;
  } else {
    const extname = path.extname(source);
    const assetDest = `__assets__/${genId()}${extname}`;
    const assetPath = path.join(projectRoot, assetDest);

    if (assetPair.has(source)) return assetPair.get(source)!;
    assetPair.set(source, assetPath);

    queuedBatches.push(async () => {
      let url = new URL(
        /^npm:/.test(source) ? source : await import.meta.resolve(source),
      );

      let fileData: Uint8Array;

      if (url.protocol == "npm:") {
        url = new URL(`https://cdn.jsdelivr.net/${url.pathname}`);
      }

      const file = await cache(url);

      await Deno.copyFile(
        path.join(outdir, assetDest),
        file.path,
      );
    });

    return assetPath;
  }
};
