import { Deno } from "../deno/node.ts";

export async function createDirectoryIfNotExists(path: string) {
  try {
    await Deno.mkdir(path, { recursive: true });
  } catch (e) {
    // TODO:
    // if (!(e instanceof Deno.errors.AlreadyExists)) throw e;
  }
}
