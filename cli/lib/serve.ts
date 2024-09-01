import * as path from "../../deps/path.ts";
import * as http from "../../deps/http.ts";
import { contentType } from "../../deps/media_types.ts";
import { genBuildCode } from "../generator/genBuildCode.ts";
import { genContext } from "../generator/genContext.ts";
import { Source } from "../generator/Source.ts";
import { runDeno } from "../util/runDeno.ts";

async function runBuildTask() {
  const source: Source = { header: "", body: "" };

  source.header +=
    'import { HotReloadPlugin } from "dejamu/plugins/hotReload/HotReloadPlugin.ts";';

  genContext(source, "ctx");
  source.body += `ctx.addPlugins(HotReloadPlugin());`;

  genBuildCode(source, "ctx");

  await runDeno(`${source.header}\n${source.body}`);
}

export const serve = async (port: number) => {
  try {
    await Deno.remove("./.out", { recursive: true });
  } catch (e) {
    if (e?.code != "ENOENT") throw e;
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

  await runBuildTask();

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
          )
      )
    ) {
      for (const p of event.paths) {
        notifiers.add(p);

        setTimeout(() => {
          notifiers.delete(p);
        }, 1500);
      }

      queueMicrotask(async () => {
        await runBuildTask();

        for (const socket of webSocketClients) {
          if (socket.readyState == WebSocket.OPEN) await socket.send("reload");
        }
      });
    }
  }
};
