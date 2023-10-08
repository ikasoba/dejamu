import { css, extract, setup, tw, TwindConfig } from "@twind/core";
import * as path from "../../deps/path.ts";
import * as fs from "../../deps/fs.ts";
import { DejamuPlugin } from "../../pluginSystem/Plugin.ts";
import { appendHead } from "../Head.tsx";
import { glob } from "../../utils/glob.ts";

export interface TwindPluginConfig {
  /** glob patterns for css files. */
  styles?: string[];

  /** glob pattern for a config file. */
  config?: string;
}

/**
 * @param configPath -
 */
export function TwindPlugin(
  {
    styles = [],
    config: configPath = "./twind.config.{ts,js,tsx,jsx}",
  }: TwindPluginConfig,
): DejamuPlugin {
  let config: TwindConfig;

  return {
    type: "dejamu",
    plugin: {
      async onReady() {
        configPath = await glob(configPath).then(
          (x) => path.toFileUrl(x[0].path).toString(),
        );

        config = (await import(
          configPath
        )).default;

        setup(config);

        const cssFiles = (await Promise.all(styles.map((x) => glob(x)))).flat();
        for (const file of cssFiles) {
          tw(
            css(await Deno.readTextFile(file.path)),
          );
        }
      },
      onRender(body, script) {
        const { html, css } = extract(body);

        appendHead(
          <style id="__DJM_TWIND__" dangerouslySetInnerHTML={{ __html: css }}>
          </style>,
        );

        script.head.unshift(
          'import { hydrate as twind_hydrate } from "dejamu/plugins/twind/hydrate.ts"',
          `import twindPlugin_twindConfig from ${JSON.stringify(configPath)}`,
        );

        script.body.unshift(
          "twind_hydrate(twindPlugin_twindConfig);",
        );

        return html;
      },
    },
  };
}
