import { Source } from "./Source.ts";

export const genContext = (source: Source, name: string) => {
  source.header += 'import { DejamuContext } from "dejamu/core/context.ts";';
  source.body += `const ${name} = await DejamuContext.init((await import("./dejamu.config.ts?${Date.now()}")).default);`;
};
