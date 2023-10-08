import * as path from "../deps/path.ts";
import { createDirectoryIfNotExists } from "../utils/createDirectoryIfNotExists.ts";
import { createIdGenerator } from "../utils/id.ts";
import { Awaitable } from "../utils/types.ts";

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
  await Promise.all(queuedBatches.map((x) => x()));
};

export const asset = (source: string) => {
  if (source.startsWith("./") || source.startsWith("../")) {
    source = path.normalize(source);

    if (assetPair.has(source)) return assetPair.get(source)!;

    const extname = path.extname(source);
    const assetDest = `__assets__/${genId()}${extname}`;
    const assetPath = path.join(projectRoot, assetDest);
    assetPair.set(source, assetPath);

    queuedBatches.push(async () => {
      await Deno.copyFile(source, path.join(outdir, assetDest));
    });

    return assetPath;
  } else {
    const extname = path.extname(source);
    const assetDest = `__assets__/${genId()}${extname}`;
    const assetPath = path.join(projectRoot, assetDest);

    if (assetPair.has(source)) return assetPair.get(source)!;
    assetPair.set(source, assetPath);

    queuedBatches.push(async () => {
      let url = new URL(await import.meta.resolve(source));

      if (url.protocol == "npm:") {
        url = new URL(`https://cdn.jsdelivr.net/npm/${url.pathname}`);
      }

      const res = await fetch(url);
      if (!res.ok) {
        throw await res.text();
      }

      await Deno.writeFile(
        path.join(outdir, assetPath),
        (await res.blob()).stream(),
      );
    });

    return assetPath;
  }
};
