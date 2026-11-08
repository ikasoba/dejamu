import { cwd } from "node:process";
import { mkdir, open, constants, writeFile, readdir } from "node:fs/promises";
import type { DenoAPI } from "./index.ts";
import { Writable, Readable } from "node:stream";

export const Deno: DenoAPI = {
  cwd,
  async mkdir(path, options) {
    await mkdir(path, { recursive: !!options?.recursive })
  },
  async open(path, options) {
    let flags: number = 0;

    if (options?.write) {
      if (options?.read) {
        flags |= constants.O_RDWR;
      } else {
        flags |= constants.O_WRONLY;
      }
    }

    const fh = await open(path, flags);
    let readable: ReadableStream<Uint8Array>;
    let writable: WritableStream<Uint8Array>;

    return {
      close: () => fh.close(),
      get readable() {
        return readable ??= Readable.toWeb(fh.createReadStream()) as ReadableStream;
      },
      get writable() {
        return writable ??= Writable.toWeb(fh.createWriteStream());
      }
    };
  },
  async writeFile(path, source, options) {
    let flag: number = 0;
    if (options?.create) {
      flag |= constants.O_CREAT;
    }
    
    await writeFile(path, source, { flag });
  },
  async *readDir(path) {
    for (const dirent of await readdir(path, { withFileTypes: true })) {
      yield {
        name: dirent.name,
        get isDirectory() { return dirent.isDirectory() },
        get isFile() { return dirent.isFile() },
        get isSymlink() { return dirent.isSymbolicLink() }
      };
    }
  },
}
