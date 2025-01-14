import { DejamuContext } from "../core/context.ts";
import * as path from "../deps/path.ts";
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

    const assetDest = source;
    const assetPath = path.join(projectRoot, assetDest);
    assetPair.set(source, assetPath);

    queuedBatches.push(async () => {
      const { fs } = DejamuContext.current.features;
      await fs.writeFile(path.join(outdir, assetDest), await fs.readFile(`.${source}`));
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
        /^npm:/.test(source) ? source : import.meta.resolve(source)
      );

      if (url.protocol == "npm:") {
        url = new URL(`https://cdn.jsdelivr.net/npm/${url.pathname}`);
      }

      const file = await cache(url);

      const { fs } = DejamuContext.current.features;

      await fs.writeFile(path.join(outdir, assetDest), await fs.readFile(file.path));
    });

    return assetPath;
  }
};
