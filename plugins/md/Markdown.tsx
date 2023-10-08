import { marked } from "./MarkdownPlugin.tsx";

export function Markdown({ children }: { children: string }) {
  return (
    <div
      dangerouslySetInnerHTML={{
        __html: marked.parse(children) as string,
      }}
    />
  );
}
