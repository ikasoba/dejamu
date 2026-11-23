import type { BuildOptions, Plugin as EsbuildPlugin } from "../deps/esbuild.ts";
import * as esbuild from "../deps/esbuild.ts";
import type { DejamuPluginBase } from "../core/plugins/DejamuPluginBase.ts";
import type { Config } from "./Config.ts";
import { getOption } from "./option.ts";
import type { ArgsType, RemovePrefix } from "../utils/types.ts";
import type { PreBuildScript } from "./PreBuildScript.ts";
import { AsyncTaskQueue } from "../utils/AsyncTaskQueue.ts";
import { FileSystem, NativeFileSystemDriver } from "./features/FileSystem.ts";
import type { DejamuPlugin } from "./plugins/Plugin.ts";
import { type CacheSystemDriver, InMemoryCacheSystem } from "./features/CacheSystem.ts";
import { PageInfoSystem } from "./features/PageInfoSystem.ts";

export interface IContextFeatures {
  fs: FileSystem;
  cache: CacheSystemDriver;
  pages: PageInfoSystem;
}

export class DejamuContext {
  static current: DejamuContext;

  static async init(config: Config) {
    const features = {
      fs: new FileSystem(new NativeFileSystemDriver()),
      cache: new InMemoryCacheSystem(),
      pages: new PageInfoSystem(),
    }
    
    const esbuildPlugins: EsbuildPlugin[] = [];
    const dejamuPlugins: DejamuPluginBase[] = [];

    const ctx = new DejamuContext(
      config,
      esbuildPlugins,
      dejamuPlugins,
      features
    );

    DejamuContext.current = ctx;

    for (const plugin of config.plugins) {
      if (plugin.type == "esbuild") {
        esbuildPlugins.push(plugin.plugin);
      } else {
        dejamuPlugins.push(plugin.plugin);
        await plugin.plugin.onReady?.();
      }
    }

    return ctx;
  }

  public tasks = new AsyncTaskQueue();

  private constructor(
    private config: Config,
    private esbuildPlugins: EsbuildPlugin[],
    private dejamuPlugins: DejamuPluginBase[],
    public features: IContextFeatures
  ) {}

  private _esbuildOption?: BuildOptions;
  async getEsbuildOption() {
    this._esbuildOption = await getOption(this.config, this.esbuildPlugins);
    console.log(this._esbuildOption.entryPoints);

    return this._esbuildOption;
  }

  private _context?: Promise<esbuild.BuildContext>;
  async getContext() {
    this._context ??= esbuild.context(await this.getEsbuildOption());

    return this._context;
  }

  async addPlugins(...plugins: DejamuPlugin[]) {
    for (const plugin of plugins) {
      if (plugin.type == "esbuild") {
        this.esbuildPlugins.push(plugin.plugin);
      } else {
        await plugin.plugin.onReady?.();
        this.dejamuPlugins.push(plugin.plugin);
      }
    }
  }

  async dispatch<K extends RemovePrefix<keyof DejamuPluginBase, "on">>(
    name: K,
    ...args: ArgsType<DejamuPluginBase[`on${K}`] & {}>
  ) {
    for (const plugin of this.dejamuPlugins) {
      await (plugin[`on${name}`] as any)?.(...args);
    }
  }

  async dispatchRender(
    pageBody: string,
    script: PreBuildScript,
    path: string
  ): Promise<string> {
    for (const plugin of this.dejamuPlugins) {
      pageBody = (await plugin.onRender?.(pageBody, script, path)) ?? pageBody;
    }

    return pageBody;
  }

  async reload(newConfig?: Config) {
    if (newConfig) this.config = newConfig;

    this.esbuildPlugins = [];
    this.dejamuPlugins = [];

    await this.addPlugins(...this.config.plugins);

    await (await this.getContext()).dispose();
    delete this._esbuildOption;
    delete this._context;
  }

  async build() {
    const res = await esbuild.build(await this.getEsbuildOption());
    await this.dispatch("Generated");

    return res;
  }

  async rebuild() {
    const res = await (await this.getContext()).rebuild();
    await this.dispatch("Generated");

    return res;
  }

  async dispose() {
    await (await this.getContext()).dispose();
  }
}
