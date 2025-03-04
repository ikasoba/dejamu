import { concat } from "../deps/bytes.ts";
import { dirname, join, resolve } from "../deps/path.ts";
import { create } from "../deps/xxhash64.ts";
import { toArrayBuffer } from "../deps/streams.ts";

const xxh = await create();

export interface FileSystemDriver {
  getEntries(absolutePath: string): AsyncIterableIterator<string>;
  getHashable(absolutePath: string): Promise<ReadableStream<Uint8Array>>;
  openReadable(absolutePath: string): Promise<ReadableStream<Uint8Array>>;
  writeFile(absolutePath: string, source: Uint8Array): Promise<void>;
}

export class NativeFileSystemDriver implements FileSystemDriver {
  async *getEntries(absolutePath: string): AsyncGenerator<string> {
    for await (const entry of Deno.readDir(absolutePath)) {
      if (entry.isFile) {
        yield join(absolutePath, entry.name);
      } else if (entry.isDirectory) {
        yield* this.getEntries(join(absolutePath, entry.name));
      }
    }
  }
  
  getHashable(absolutePath: string): Promise<ReadableStream<Uint8Array>> {
    return this.openReadable(absolutePath);
  }
  
  async openReadable(absolutePath: string) {
    const file = await Deno.open(absolutePath);

    return file.readable;
  }

  async writeFile(absolutePath: string, source: Uint8Array) {
    await Deno.mkdir(dirname(absolutePath), { recursive: true });
    await Deno.writeFile(absolutePath, source, {
      create: true
    });
  }
}

export class FileSystem {
  constructor(private _driver: FileSystemDriver) {}

  get driver(): Readonly<FileSystemDriver> {
    return this._driver;
  }

  set driver(newDriver:FileSystemDriver) {
    this._driver = newDriver;
  }

  getEntries(path: string) {
    return this._driver.getEntries(resolve(path));
  }

  openReadable(path: string) {
    return this._driver.openReadable(resolve(path));
  }

  async getHash(path: string): Promise<Uint8Array> {
    return new Uint8Array(xxh.hash(new Uint8Array(await toArrayBuffer(await this._driver.getHashable(path)))) as unknown as ArrayBuffer);
  }

  async readFile(path: string): Promise<Uint8Array> {
    const stream = await this.openReadable(path);

    const reader = stream.getReader();

    const bytes = [];
    
    while (true) {
      const res = await reader.read();
      if (res.done) break;

      bytes.push(res.value);
    }
    
    return concat(...bytes);
  }
  
  async readTextFile(path: string): Promise<string> {
    const byteStream = await this.openReadable(path);
    const textStream = byteStream.pipeThrough(new TextDecoderStream());

    const reader = textStream.getReader();

    const chunks = [];
    
    while (true) {
      const res = await reader.read();
      if (res.done) break;

      chunks.push(res.value);
    }

    return chunks.join("");
  }
  
  writeFile(path: string, source: Uint8Array) {
    return this._driver.writeFile(resolve(path), source);
  }

  writeTextFile(path: string, source: string) {
    return this.writeFile(path, new TextEncoder().encode(source));
  }
}
