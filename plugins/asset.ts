import * as path from "../deps/path.ts";
import * as semver from "../deps/semver.ts";
import { createDirectoryIfNotExists } from "../utils/createDirectoryIfNotExists.ts";
import { getDenoCacheInfo } from "../utils/denoCache.ts";
import {
  asyncIterableIteratorToArray,
  asyncIterableToArray,
} from "../utils/glob.ts";
import { createIdGenerator } from "../utils/id.ts";
import { Awaitable } from "../utils/types.ts";

const cacheInfo = await getDenoCacheInfo();

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

      // npmであればキャッシュから取る
      if (url.protocol == "npm:") {
        const pattern = /^\/?([^/@]+|@[^/@]+\/[^/@]+)(?:@([^/]+))?/;

        const pathname = url.pathname.replace(
          pattern,
          "",
        );
        const moduleNameAndVersion = url.pathname.match(
          pattern,
        );

        if (moduleNameAndVersion == null) {
          throw new Error(`cannot parse npm package name. ${url.pathname}`);
        }

        let [_, moduleName, moduleVersion] = moduleNameAndVersion;

        if (moduleVersion == null) {
          const rawVersions = await asyncIterableToArray(
            Deno.readDir(
              path.join(cacheInfo.npm, "registry.npmjs.org", moduleName),
            ),
          );
          const versions = rawVersions
            .map((x) => {
              try {
                return semver.parse(x.name);
              } catch {
                return null;
              }
            })
            .filter((x): x is semver.SemVer => x != null);

          moduleVersion = semver.format(
            versions.sort((
              a,
              b,
            ) => -semver.gt(a, b))[0],
          );
        }

        fileData = await Deno.readFile(
          path.join(
            cacheInfo.npm,
            "registry.npmjs.org",
            moduleName,
            moduleVersion,
            pathname,
          ),
        );
      } else {
        const res = await fetch(url);
        if (!res.ok) {
          throw await res.text();
        }

        fileData = new Uint8Array(await res.arrayBuffer());
      }

      await Deno.writeFile(
        path.join(outdir, assetDest),
        fileData,
      );
    });

    return assetPath;
  }
};
