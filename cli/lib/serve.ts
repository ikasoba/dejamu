import { BuildContext } from "../../deps/esbuild.ts";

export const serve = async (ctx: BuildContext, port: number) => {
  try {
    await Deno.remove("./.out", { recursive: true });
  } catch (e) {
    if (e?.code != "ENOENT") throw e;
  }

  const server = await ctx.serve({
    port,
    host: "localhost",
    servedir: "./.out/",
  });

  console.log(
    `Waiting for connection at http://${server.host}:${server.port}/`,
  );
};
