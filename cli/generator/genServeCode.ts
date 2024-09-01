import { Source } from "./Source.ts";

export const genServeCode = (source: Source, port: number) => {
  source.header += `import { serve } from "dejamu/cli/lib/serve.ts";`;
  source.body += `await serve(${port});`;
};
