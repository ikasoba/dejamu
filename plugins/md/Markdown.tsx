import { marked } from "./MarkdownPlugin.tsx";
import { encodeBase64 } from "https://deno.land/std@0.203.0/encoding/base64.ts";
import { create } from "../../deps/xxhash64.ts";

const xxh = await create();

const encoder = new TextEncoder();

export function Markdown({ children }: { children: string }) {
  const hash = encodeBase64(xxh.hash(encoder.encode(children)) as Uint8Array);

  return (
    <div
      x-key={hash}
      dangerouslySetInnerHTML={{
        __html: marked.parse(children) as string,
      }}
    />
  );
}
