import { DejamuContext } from "../../builder/context.ts";
import { BuildContext, context } from "../../deps/esbuild.ts";
import * as path from "../../deps/path.ts";
import {
  filterIslandsFiles,
  initIslandsState,
  registerIslands,
} from "../../plugins/islands/registerIslands.ts";
import * as http from "../../deps/http.ts";
import { contentType } from "../../deps/media_types.ts";
import { build } from "./build.ts";
import { HotReloadPlugin } from "../../plugins/hotReload/HotReloadPlugin.ts";

export const serve = async (ctx: DejamuContext, port: number) => {
  initIslandsState();
  await registerIslands("./");

  ctx.addPlugins(
    HotReloadPlugin(),
  );

  try {
    await Deno.remove("./.out", { recursive: true });
  } catch (e) {
    if (!(e instanceof Deno.errors.NotFound)) throw e;
  }

  const webSocketClients: Set<WebSocket> = new Set();

  const listener = Deno.listen({ port });
  http.serveListener(listener, async (req) => {
    const url = new URL(req.url);
    let p = path.join(".out", url.pathname);

    if (url.pathname == "/$/__hot_reload__") {
      const { socket, response } = Deno.upgradeWebSocket(req);

      socket.addEventListener("open", () => {
        webSocketClients.add(socket);
      });

      socket.addEventListener("close", () => {
        webSocketClients.delete(socket);
      });

      return response;
    } else {
      try {
        const stat = await Deno.stat(p);

        if (stat.isDirectory) p = path.join(p, "index.html");
      } catch (e) {
        if (e?.code != "ENOENT") throw e;
      }

      const mime = contentType(path.extname(p)) ?? "application/octet-stream";

      try {
        const body = await Deno.readFile(p);

        return new Response(body, {
          status: 200,
          headers: {
            "Content-Type": mime,
          },
        });
      } catch (e) {
        if (e instanceof Deno.errors.NotFound) {
          return new Response("not found.", { status: 404 });
        } else {
          return new Response(JSON.stringify(e), {
            status: 500,
          });
        }
      }
    }
  });

  await build(ctx);

  queueMicrotask(async () => {
    const watcher = Deno.watchFs(".", {
      recursive: true,
    });

    const ignoredItems = [
      ".out",
      ".git",
      ".vscode",
      ".github",
    ];

    const notifiers = new Set();

    for await (const event of watcher) {
      if (
        event.paths.filter((x) =>
          !(
            ignoredItems.some((y) => path.relative(".", x).startsWith(y)) ||
            notifiers.has(x)
          )
        ).length
      ) {
        for (const p of event.paths) {
          notifiers.add(p);

          setTimeout(() => {
            notifiers.delete(p);
          }, 1500);
        }

        await build(ctx);

        for (const socket of webSocketClients) {
          if (socket.readyState == 1) await socket.send("reload");
        }
      }
    }
  });

  console.log(
    `Waiting for connection at http://localhost:${port}/`,
  );
};
