import { BuildContext, context } from "../../deps/esbuild.ts";
import * as path from "../../deps/path.ts";
import {
  filterIslandsFiles,
  initIslandsState,
  registerIslands,
} from "../../plugins/islands/registerIslands.ts";
import { Config } from "../Config.ts";
import { getOption } from "../option.ts";

export const serve = async (config: Config, port: number) => {
  const option = await getOption(config);
  const ctx = await context(option);

  initIslandsState();
  await registerIslands("./");

  try {
    await Deno.remove("./.out", { recursive: true });
  } catch (e) {
    if (e?.code != "ENOENT") throw e;
  }

  await ctx.serve({
    port,
    servedir: ".out",
  });

  console.log(
    `Waiting for connection at http://localhost:${port}/`,
  );
};
