import { Source } from "../generator/Source.ts";
import { genBuildCode } from "../generator/genBuildCode.ts";
import { genRebuildCode } from "../generator/genRebuildCode.ts";
import { genContext } from "../generator/genContext.ts";
import { genServeCode } from "../generator/genServeCode.ts";
import { runDeno } from "./runDeno.ts";

export async function runBuildTask() {
  const source: Source = { header: "", body: "" };

  genContext(source, "ctx");
  genBuildCode(source, "ctx");

  await runDeno(`${source.header}\n${source.body}`);
}

export async function runRebuildTask() {
  const source: Source = { header: "", body: "" };

  genContext(source, "ctx");
  genRebuildCode(source, "ctx");

  await runDeno(`${source.header}\n${source.body}`);
}

export async function runServeTask(port: number) {
  const source: Source = { header: "", body: "" };

  genServeCode(source, port);

  await runDeno(`${source.header}\n${source.body}`);
}
