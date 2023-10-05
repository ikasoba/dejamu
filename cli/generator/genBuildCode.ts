import { Source } from "./Source.ts";

export const genBuildCode = (source: Source, configName: string) => {
  source.header += `import { build } from "dejamu/cli/lib/build.ts";`;
  source.body += `await build(${configName});`;
};
