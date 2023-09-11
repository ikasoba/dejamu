import { marked } from "../../deps/marked.ts";

export function Markdown({ children }: { children: string }) {
  return <div dangerouslySetInnerHTML={{ __html: marked(children) }} />;
}
