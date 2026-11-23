export interface DenoAPI {
  cwd(): string;
  mkdir(path: string, options?: { recursive: boolean }): Promise<void>;
  open(path: string, options?: OpenOptions): Promise<FsFile>;
  writeFile(path: string, source: Uint8Array | ReadableStream<Uint8Array>, options?: WriteFileOptions): Promise<void>;
  readDir(path: string): AsyncIterable<DirEntry>;
}

export interface OpenOptions {
  read?: boolean;
  write?: boolean;
}

export interface FsFile {
  writable: WritableStream<Uint8Array>;
  readable: ReadableStream<Uint8Array>;
  close(): Promise<void>;
}

export interface WriteFileOptions {
  create?: boolean;
}

export interface DirEntry {
  name: string;
  isFile: boolean;
  isDirectory: boolean;
  isSymlink: boolean;
}
