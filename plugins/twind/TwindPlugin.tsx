import { extract, install, TwindConfig } from "@twind/core";
import * as path from "../../deps/path.ts";
import { DejamuPlugin } from "../../pluginSystem/Plugin.ts";
import { appendHead } from "../Head.tsx";

/**
 * @param configPath -
 */
export function TwindPlugin(configPath: string): DejamuPlugin {
  let config: TwindConfig;

  return {
    type: "dejamu",
    plugin: {
      async onReady() {
        configPath = await import.meta.resolve(
          path.toFileUrl(path.resolve(path.join(Deno.cwd(), configPath)))
            .toString(),
        );
        config = (await import(configPath)).default;

        install(config);
      },
      onRender(body, script) {
        const { html, css } = extract(body);

        appendHead(
          <style dangerouslySetInnerHTML={{ __html: css }}>
          </style>,
        );

        script.head.unshift(
          'import { install as twind_install } from "@twind/core"',
          `import twindPlugin_twindConfig from ${JSON.stringify(configPath)}`,
        );
        script.footer.unshift(
          "twind_install(twindPlugin_twindConfig);",
        );

        return html;
      },
    },
  };
}
