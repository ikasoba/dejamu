import { BuildContext } from "../../deps/esbuild.ts";

export const build = async (ctx: BuildContext) => {
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
