import { DejamuContext } from "../../core/context.ts";

export const build = async (ctx: DejamuContext, paths?: string[]) => {
  try {
    await Deno.remove("./.out", { recursive: true });
  } catch (e: any) {
    if (e?.code != "ENOENT") throw e;
  }

  console.log("building...");

  const res = await ctx.build();

  for (const err of res.errors) {
    console.error(err);
  }

  for (const warn of res.warnings) {
    console.warn(warn);
  }

  console.log("build complete!");

  await ctx.dispose();

  Deno.exit(0);
};
