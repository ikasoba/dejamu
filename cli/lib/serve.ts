import * as path from "../../deps/path.ts";
import * as http from "../../deps/http.ts";
import { contentType } from "../../deps/media_types.ts";
import { Config } from "../../core/Config.ts";
import { DejamuContext } from "../../core/context.ts";
import { HotReloadPlugin } from "../../plugins/hotReload/HotReloadPlugin.ts";
import {
  dynamicReload,
} from "../../utils/dynamicImport.ts";

export const serve = async (port: number) => {
  try {
    await Deno.remove("./.out", { recursive: true });
  } catch (e: any) {
    if (e?.code != "ENOENT") throw e;
  }

  const root = Deno.cwd();

  const getConfig = () =>
    import(path.join(Deno.cwd(), "dejamu.config.ts") + "#" + Date.now()).then(
      (x) => x.default as Config,
    );

  const config = await getConfig();

  const context = await DejamuContext.init(config);

  context.addPlugins(HotReloadPlugin());

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
      } catch (e: any) {
        if (e?.code != "ENOENT") throw e;
      }

      const mime = contentType(path.extname(p)) ?? "application/octet-stream";

      try {
        const body = await DejamuContext.current.features.fs.readFile(p);

        return new Response(body, {
          status: 200,
          headers: {
            "Access-Control-Allow-Origin": "*",
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

  console.log("building...");
  console.time("build completed");
  await context.rebuild();
  console.timeEnd("build completed");

  console.log(`Waiting for connection at http://localhost:${port}/`);

  const watcher = Deno.watchFs(".", {
    recursive: true,
  });

  const ignoredItems = [".out", ".git", ".vscode", ".github"];

  const notifiers = new Set();
  let prevEventRecieved = 0;

  for await (const event of watcher) {
    if (Date.now() - prevEventRecieved < 1500) {
      continue;
    }

    prevEventRecieved = Date.now();

    if (
      event.paths.some(
        (x) =>
          !(
            ignoredItems.some((y) => path.relative(".", x).startsWith(y)) ||
            notifiers.has(x)
          ),
      )
    ) {
      const paths: string[] = [];

      for (const p of event.paths) {
        notifiers.add(p);
        paths.push(path.relative(root, p));

        if (/\.[tj]sx?$/.test(p)) {
          await dynamicReload(p);
        }

        setTimeout(() => {
          notifiers.delete(p);
        }, 1500);
      }

      queueMicrotask(async () => {
        await context.dispatch("Ready");

        console.log("building...");
        console.time("build completed");
        await context.rebuild();
        console.timeEnd("build completed");

        for (const socket of webSocketClients) {
          if (socket.readyState == WebSocket.OPEN) {
            socket.send(JSON.stringify(paths));
          }
        }
      });
    }
  }
};
