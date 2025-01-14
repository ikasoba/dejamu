import { Command } from "../deps/command.ts";
import { main as initProject } from "../scripts/init.ts";
import { runBuildTask, runServeTask } from "./util/task.ts";

const app = new Command()
  .name("dejamu")
  .default("help");

app.command("help", "show help message.")
  .action(() => app.showHelp());

app.command("build", "build site.")
  .action(async () => {
    await runBuildTask();
  });

app.command("serve [port]", "Start development server.")
  .action(async (_, port) => {
    await runServeTask(port ? parseInt(port) : 8000)
  });

app.command("init", "Initialize a new project in the current directory.")
  .action(() => {
    initProject();
  });

app.parse();
