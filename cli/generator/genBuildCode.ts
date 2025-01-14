import { Source } from "./Source.ts";

export const genBuildCode = (source: Source, ctxName: string, paths?: string[]) => {
  source.header += `import { build } from "dejamu/cli/lib/build.ts";`;
  source.body += `await build(${ctxName}, ${paths ? JSON.stringify(paths) : "void 0"});`;
};
