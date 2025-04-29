import { DejamuContext } from "../../core/context.ts";
import { dirname, resolve, toFileUrl } from "../../deps/path.ts";
import { DejamuPlugin } from "../../core/plugins/Plugin.ts";
import { FileSystemDriver } from "../../core/features/FileSystem.ts";
import { Awaitable } from "../../utils/types.ts";

export interface VirtualFile {
  path: string;
  getHashable(): Awaitable<Uint8Array>;
  getContent(): Awaitable<Uint8Array>;
}

export class VirtualFileSystemDriver implements FileSystemDriver {
  constructor(
    private files: Map<string, VirtualFile>,
    private target?: Readonly<FileSystemDriver>,
  ) {}

  async *getEntries(absolutePath: string): AsyncIterableIterator<string> {
    const iterated = new Set();

    if (this.target) {
      for await (const path of this.target.getEntries(absolutePath)) {
        iterated.add(path);

        yield path;
      }
    }

    for (const key of this.files.keys()) {
      if (
        !iterated.has(key) && key.startsWith(absolutePath.replace(/\/*$/, "/"))
      ) {
        yield key;
      }
    }
  }

  async getHashable(absolutePath: string): Promise<ReadableStream<Uint8Array>> {
    const virtual = this.files.get(absolutePath);

    if (!virtual) {
      if (!this.target) throw new Deno.errors.NotFound();

      return this.target.openReadable(absolutePath);
    }

    return new ReadableStream({
      async start(controller) {
        controller.enqueue(await virtual.getHashable());
        controller.close();
      },
    });
  }

  async openReadable(
    absolutePath: string,
  ): Promise<ReadableStream<Uint8Array>> {
    const virtual = this.files.get(absolutePath);
    if (!virtual) {
      if (!this.target) throw new Deno.errors.NotFound();

      return this.target.openReadable(absolutePath);
    }

    return new ReadableStream({
      async start(controller) {
        controller.enqueue(await virtual.getContent());
        controller.close();
      },
    });
  }

  writeFile(absolutePath: string, source: Uint8Array): Promise<void> {
    if (!this.target || this.files.has(absolutePath)) {
      throw new Deno.errors.PermissionDenied();
    }

    return this.target.writeFile(absolutePath, source);
  }
}

export function VirtualPlugin(entries: VirtualFile[]): DejamuPlugin {
  const files = new Map<string, VirtualFile>();

  for (const file of entries) {
    files.set(resolve(file.path), file);
  }

  let isPatched = false;

  return {
    type: "dejamu",
    plugin: {
      onReady() {
        if (!isPatched) {
          isPatched = true;

          const { fs } = DejamuContext.current.features;

          fs.driver = new VirtualFileSystemDriver(files, fs.driver);

          DejamuContext.current.addPlugins({
            type: "esbuild",
            plugin: {
              name: "VirtualPlugin",
              setup(build) {
                build.onResolve({ filter: /^/, namespace: "" }, (args) => {
                  const path = resolve(args.path);
                  if (args.namespace != "" || !files.has(path)) return;

                  return build.resolve(args.path.replace(/^(?!\.+\/)/, "./"), {
                    kind: "entry-point",
                    namespace: "file",
                    resolveDir: Deno.cwd()
                  });
                });
              },
            },
          });
        }
      },
    },
  };
}

export default VirtualPlugin;
