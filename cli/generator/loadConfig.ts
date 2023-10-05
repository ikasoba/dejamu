import { Source } from "./Source.ts";

export const loadConfig = (source: Source, name: string) => {
  source.header += `import ${name} from "./dejamu.config.ts";`;
};
