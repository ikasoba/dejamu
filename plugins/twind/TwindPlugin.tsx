import { extract, TwindConfig } from "@twind/core";
import { DejamuPlugin } from "../../pluginSystem/Plugin.ts";
import { appendHead } from "../Head.tsx";

/**
 * @param configPath -
 */
export async function TwindPlugin(configPath: string): Promise<DejamuPlugin> {
  let config: TwindConfig;

  return {
    type: "dejamu",
    plugin: {
      async onReady() {
        configPath = await import.meta.resolve(configPath);
        config = await import(configPath);
      },
      async onRender(body, script) {
        const { html, css } = extract(body);

        appendHead(
          <style>
            {css}
          </style>,
        );
      },
    },
  };
}
