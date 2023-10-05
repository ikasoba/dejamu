import { BuildContext, context } from "../../deps/esbuild.ts";
import {
  filterIslandsFiles,
  initIslandsState,
  registerIslands,
} from "../../plugins/islands/registerIslands.ts";
import { Config } from "../Config.ts";
import { getOption } from "../option.ts";

export const build = async (config: Config) => {
  const option = await getOption(config);
  const ctx = await context(option);

  initIslandsState();
  await registerIslands("./");

  try {
    await Deno.remove("./.out", { recursive: true });
  } catch (e) {
    if (e?.code != "ENOENT") throw e;
  }

  console.log("building...");

  const res = await ctx.rebuild();

  for (const err of res.errors) {
    console.error(err);
  }

  for (const warn of res.warnings) {
    console.warn(warn);
  }

  await ctx.dispose();

  console.log("build complete!");

  Deno.exit(0);
};
