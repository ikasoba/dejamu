
import { Source } from "./Source.ts";

export const genRebuildCode = (source: Source, ctxName: string, paths?: string[]) => {
  source.header += `import { rebuild } from "dejamu/cli/lib/rebuild.ts";`;
  source.body += `await rebuild(${ctxName}, ${paths ? JSON.stringify(paths) : "void 0"});`;
};
