import { Config } from "../cli/Config.ts";
import pkg from "../depm.json" assert { type: "json" };

export async function main() {
  const denoFile = {
    lock: false,
    tasks: {
      dejamu: `echo "import 'dejamu/cli/cli.ts';" | deno run -A -`,
      build: "deno task dejamu build",
      serve: "deno task dejamu serve",
    },
    imports: {
      "dejamu/":
        `https://raw.githubusercontent.com/ikasoba/dejamu/main/scripts/init.ts/${pkg.version}/`,
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
