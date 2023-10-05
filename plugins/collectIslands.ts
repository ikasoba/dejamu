import { Island } from "./islands/registerIslands.ts";

export const collectIslands = (islands: Island[]) => {
  let islandsImportHeader = "";

  let idNum = 0;
  const newId = () => `$island_${idNum++}`;

  const reviveArgData: [string, string][] = [];

  for (const island of islands) {
    const id = newId();
    islandsImportHeader += `import {${island.exportName} as ${id}} from ${
      JSON.stringify(island.modulePath)
    };`;
    reviveArgData.push([island.id, id]);
  }

  const reviveArg = "{" +
    reviveArgData.map(([k, v]) => `${JSON.stringify(k)}: ${v}`).join(",") + "}";

  return {
    head: islandsImportHeader,
    reviveArg,
  };
};
