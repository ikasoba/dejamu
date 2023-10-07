import { PreBuildScript } from "../builder/PreBuildScript.ts";
import { DejamuContext } from "../builder/context.ts";
import { OnLoadResult, OnResolveArgs } from "../deps/esbuild.ts";
import { collectIslands } from "../plugins/collectIslands.ts";
import { Island } from "../plugins/islands/registerIslands.ts";
import { template } from "../plugins/render.tsx";
import { putTextFile } from "../utils/putTextFile.ts";

export async function build(
  islands: Island[],
  body: string,
  htmlFilePath: string,
  jsFilePath: string,
): Promise<OnLoadResult> {
  const script: PreBuildScript = { head: [], body: [], footer: [] };

  if (islands.length) {
    const { head: islandsHead, reviveArg } = collectIslands(islands);

    script.head.push('import {revive} from "dejamu/mod.ts"');
    script.head.push(islandsHead);
    script.footer.push(
      'window.addEventListener("load", () => {' +
        '  console.log("start partial hydrate");' +
        `  revive(${reviveArg}, document.body);` +
        "})",
    );
  }

  await DejamuContext.current.dispatch("Render", body, script);

  const jsFile = [
    script.head.join(";"),
    script.body.join(";"),
    script.footer.join(";"),
  ].filter((x) => x.length).join(";");

  if (jsFile.length == 0) {
    const html = template(
      body,
      {
        pageDirectory: globalThis.pageDirectory,
        projectRoot: globalThis.projectRoot,
      },
      undefined,
    );

    await putTextFile(htmlFilePath, html);

    return {
      loader: "empty",
      contents: "",
    };
  } else {
    const html = template(
      body,
      {
        pageDirectory: globalThis.pageDirectory,
        projectRoot: globalThis.projectRoot,
      },
      jsFilePath,
    );

    await putTextFile(htmlFilePath, html);

    return {
      loader: "tsx",
      contents: jsFile,
    };
  }
}
