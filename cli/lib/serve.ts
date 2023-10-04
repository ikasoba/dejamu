import { BuildContext } from "../../deps/esbuild.ts";

export const serve = async (ctx: BuildContext, port: number) => {
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
