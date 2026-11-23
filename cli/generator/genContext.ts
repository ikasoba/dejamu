import type { Source } from "./Source.ts";

export const genContext = (source: Source, name: string) => {
  source.header += 'import { DejamuContext } from "dejamu/core/context.ts";';
  source.header += 'import { getConfig } from "dejamu/cli/util/context.ts";';
  source.body += `const ${name} = await DejamuContext.init(await getConfig());`;
};
