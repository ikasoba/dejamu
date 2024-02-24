import { IslandsInfo } from "../core/buildContext.ts";

export function createHydrateScript(islands: Iterable<IslandsInfo>) {
  let script = 'import{hydrate}from"dejamu/hydrate.ts";';

  for (const island of islands) {
    script += `import $${island.id} from${JSON.stringify(island.source)};`;
  }

  script += `hydrate({`;

  for (const island of islands) {
    script += JSON.stringify(island.id) + ": $" + island.id + ",";
  }

  script += "})";

  return script;
}
