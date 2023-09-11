import { Config } from "../cli/Config.ts";

export async function main() {
  const denoFile = {
    lock: false,
    imports: {
      "dejamu/": "https://esm.sh/gh/ikasoba/dejamu@0.1.0/",
    },
    compilerOptions: {
      jsx: "react-jsx",
      jsxImportSource: "npm:preact",
    },
  };

  const configFile = `import type { Config } from "dejamu/mod.ts";
import PreactPlugin from "dejamu/plugins/preact/mod.ts";
import MarkdownPlugin from "dejamu/plugins/md/mod.ts";

export default {
  entryPoints: ["pages/*.{jsx,tsx,md}"],
  plugins: [
    PreactPlugin(),
    MarkdownPlugin("layouts/"),
  ],
} satisfies Config;`;

  await Deno.writeTextFile("./deno.json", JSON.stringify(denoFile, null, "  "));
  await Deno.writeTextFile("./dejamu.config.ts", configFile);
}

if (import.meta.main) {
  await main();
}
