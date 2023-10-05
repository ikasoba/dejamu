import { Command } from "../deps/command.ts";
import { main as initProject } from "../scripts/init.ts";
import { Source } from "./generator/Source.ts";
import { genBuildCode } from "./generator/genBuildCode.ts";
import { genServeCode } from "./generator/genServeCode.ts";
import { loadConfig } from "./generator/loadConfig.ts";

const app = new Command()
  .name("dejamu")
  .default("help");

app.command("help", "show help message.")
  .action(() => app.showHelp());

app.command("build", "build site.")
  .action(async () => {
    let source: Source = { header: "", body: "" };

    loadConfig(source, "cfg");
    genBuildCode(source, "cfg");

    const proc = new Deno.Command("deno", {
      args: ["run", "-A", "-"],
      stdin: "piped",
    }).spawn();

    const writer = proc.stdin.getWriter();

    await writer.write(
      new TextEncoder().encode(`${source.header}\n${source.body}`),
    );

    await writer.close();
  });

app.command("serve [port]", "Start development server.")
  .action(async (_, port) => {
    let source: Source = { header: "", body: "" };

    loadConfig(source, "cfg");
    genServeCode(source, "cfg", port ? +port : 8000);

    const proc = new Deno.Command("deno", {
      args: ["run", "-A", "-"],
      stdin: "piped",
    }).spawn();

    const writer = proc.stdin.getWriter();

    await writer.write(
      new TextEncoder().encode(`${source.header}\n${source.body}`),
    );

    await writer.close();
  });

app.command("init", "Initialize a new project in the current directory.")
  .action(() => {
    initProject();
  });

app.parse();
