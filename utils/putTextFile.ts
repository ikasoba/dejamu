import * as path from "../deps/path.ts";

export const putTextFile = async (dest: string, content: string) => {
  try {
    await Deno.mkdir(path.dirname(dest), { recursive: true });
  } catch (_) {}

  await Deno.writeTextFile(dest, content);
};
