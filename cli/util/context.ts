import * as path from "../../deps/path.ts";
import { Config } from "../../core/Config.ts";

export const getConfig = () =>
  import(path.toFileUrl(path.join(Deno.cwd(), "dejamu.config.ts")).toString() + "#" + Date.now()).then(
    (x) => x.default as Config,
  );
