import { css, extract, setup, tw, TwindConfig } from "@twind/core";
import * as path from "../../deps/path.ts";
import { DejamuPlugin } from "../../core/plugins/Plugin.ts";
import { appendHead } from "../Head.tsx";
import { glob } from "../../utils/glob.ts";
import { DejamuContext } from "../../core/context.ts";
import { dynamicImport } from "../../utils/dynamicImport.ts";

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
    config: configPathPattern = "./twind.config.{ts,js,tsx,jsx}",
  }: TwindPluginConfig,
): DejamuPlugin {
  let configPath: string;
  let config: TwindConfig;
  let hrKey = -1;

  return {
    type: "dejamu",
    plugin: {
      async onReady() {
        hrKey += 1;

        configPath = await glob(configPathPattern).then(
          (x) => path.toFileUrl(x[0]).toString(),
        );

        config = (await dynamicImport(
          configPath,
        )).default;

        setup(config);

        const cssFiles = (await Promise.all(styles.map((x) => glob(x)))).flat();
        for (const filePath of cssFiles) {
          tw(
            css(await DejamuContext.current.features.fs.readTextFile(filePath)),
          );
        }
      },
      onRender(body, script) {
        const { html, css } = extract(body);

        appendHead(
          <style
            x-key={"" + hrKey}
            id="__DJM_TWIND__"
            dangerouslySetInnerHTML={{ __html: css }}
          >
          </style>,
        );

        if (script.hasIslands) {
          script.head.push(
            'import { hydrate as twind_hydrate } from "dejamu/plugins/twind/hydrate.ts";',
          );

          script.footer.push(
            `window.addEventListener("load", async function handler() {` +
              `  const { default: twind_config } = await import(${
                JSON.stringify(configPath)
              });` +
              '  console.time("twind hydrate");' +
              `  twind_hydrate(twind_config);` +
              '  console.timeEnd("twind hydrate");' +
              '  window.removeEventListener("load", handler)' +
              `});`,
          );
        }

        return html;
      },
    },
  };
}
