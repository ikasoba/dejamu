import { DejamuContext } from "../../builder/context.ts";
import { BuildContext, context } from "../../deps/esbuild.ts";
import {
  filterIslandsFiles,
  initIslandsState,
  registerIslands,
} from "../../plugins/islands/registerIslands.ts";

export const build = async (ctx: DejamuContext) => {
  try {
    await Deno.remove("./.out", { recursive: true });
  } catch (e) {
    if (e?.code != "ENOENT") throw e;
  }

  initIslandsState();
  await registerIslands("./");

  console.log("building...");

  const res = await ctx.build();

  for (const err of res.errors) {
    console.error(err);
  }

  for (const warn of res.warnings) {
    console.warn(warn);
  }

  console.log("build complete!");
};
