import { Suspense } from "npm:preact/compat";
import { marked } from "./MarkdownPlugin.tsx";
import { encodeBase64 } from "https://deno.land/std@0.203.0/encoding/base64.ts";
import { create } from "../../deps/xxhash64.ts";

const xxh = await create();

const encoder = new TextEncoder();

function _Markdown({ children }: { children: string }) {
  const hash = encodeBase64(xxh.hash(encoder.encode(children)) as ArrayBuffer);

  return (   
    <div
      x-key={hash}
      dangerouslySetInnerHTML={{
        __html: marked.parse(children) as string,
      }}
    />
  );
}

export function Markdown({ children }: { children: string }) {
  return (
    <Suspense fallback={<></>}>
      <_Markdown children={children} />
    </Suspense>
  );
}
