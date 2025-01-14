export async function runDeno(code: string) {
  const proc = new Deno.Command("deno", {
    args: ["run", "-A", "-"],
    stdin: "piped",
  }).spawn();

  const writer = proc.stdin.getWriter();

  await writer.write(new TextEncoder().encode(code));

  await writer.close();

  const out = await proc.output();

  if (!out.success) {
    throw out;
  }
}

export async function runDenoWithOutputs(code: string) {
  const proc = new Deno.Command("deno", {
    args: ["run", "-A", "-"],
    stdin: "piped",
    stdout: "piped"
  }).spawn();

  const writer = proc.stdin.getWriter();

  await writer.write(new TextEncoder().encode(code));

  await writer.close();

  const stream = new TextDecoderStream();

  proc.stdout.pipeTo(stream.writable);
  
  return stream.readable;
}
