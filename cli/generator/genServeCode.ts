import { Source } from "./Source.ts";

export const genServeCode = (source: Source, ctxName: string, port: number) => {
  source.header += `import { serve } from "dejamu/cli/lib/serve.ts";`;
  source.body += `await serve(${ctxName}, ${port});`;
};
