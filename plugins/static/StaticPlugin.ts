import { DejamuContext } from "../../core/context.ts";
import { DejamuPlugin } from "../../core/plugins/Plugin.ts";
import { join, relative } from "../../deps/path.ts";
import { glob } from "../../utils/glob.ts";

export interface StaticPluginConfig {
  inputs: {
    staticRoot: string;
    dest: string;
  }[];
}

export function StaticPlugin({ inputs }: StaticPluginConfig): DejamuPlugin {
  return {
    type: "dejamu",
    plugin: {
      async onGenerated() {
        const options = await DejamuContext.current.getEsbuildOption();
        const fs = DejamuContext.current.features.fs;
        
        for (const input of inputs) {
          const parent = join("./", input.staticRoot);
          const dest = input.dest.replace(/^\//, (options.outdir ?? ".out/") + "/");

          await Promise.all((await glob(join(parent, "**/*"))).map(async path => {
            const p = join(dest, relative(parent, path)).replaceAll("\\", "/");
            
            const data = await fs.readFile(path);

            await fs.writeFile(p, data);
          }));

          console.log("copied static resources!");
        }
      }
    }
  }
}
