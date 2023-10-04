import * as path from "../deps/path.ts";

export function initializeConstantsForBuildTime(pageDirectory: string) {
  globalThis.isBrowser = false;
  globalThis.pageDirectory = pageDirectory;

  globalThis.projectRoot = path.normalize(
    path.relative(globalThis.pageDirectory, "."),
  );
}
