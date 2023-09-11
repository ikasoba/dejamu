import { Source } from "./Source.ts";

export const genContext = (source: Source, name: string) => {
  source.header += `import config from "./dejamu.config.ts";`;
  source.header += `import { getContext } from "dejamu/cli/context.ts";`;
  source.body += `const ${name} = await getContext(config);`;
};
