import { BuildOptions, Plugin as EsbuildPlugin } from "../deps/esbuild.ts";
import * as esbuild from "../deps/esbuild.ts";
import { DejamuPluginBase } from "../pluginSystem/DejamuPluginBase.ts";
import { Config } from "./Config.ts";
import { getOption } from "./option.ts";
import { ArgsType, RemovePrefix } from "../utils/types.ts";
import { DejamuPlugin } from "../pluginSystem/Plugin.ts";

export class DejamuContext {
  static current: DejamuContext;

  static async init(config: Config) {
    const esbuildPlugins: EsbuildPlugin[] = [];
    const dejamuPlugins: DejamuPluginBase[] = [];

    for (const plugin of config.plugins) {
      if (plugin.type == "esbuild") {
        esbuildPlugins.push(plugin.plugin);
      } else {
        await plugin.plugin.onReady?.();
        dejamuPlugins.push(plugin.plugin);
      }
    }

    const esbuildOption = await getOption(config, esbuildPlugins);

    return DejamuContext.current = new DejamuContext(
      config,
      esbuildOption,
      esbuildPlugins,
      dejamuPlugins,
    );
  }

  private constructor(
    private config: Config,
    private esbuildOption: BuildOptions,
    private esbuildPlugins: EsbuildPlugin[],
    private dejamuPlugins: DejamuPluginBase[],
  ) {}

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

  async reload(newConfig?: Config) {
    if (newConfig) this.config = newConfig;

    this.esbuildPlugins = [];
    this.dejamuPlugins = [];

    await this.addPlugins(...this.config.plugins);

    this.esbuildOption = await getOption(this.config, this.esbuildPlugins);
  }

  async build() {
    return await esbuild.build(this.esbuildOption);
  }
}
