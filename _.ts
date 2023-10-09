import * as fs from "https://deno.land/std/fs/mod.ts";

const files = [];
for await (const item of fs.expandGlob("pages/**/*.md")) {
  files.push(item.path);
}

const save = async (path: string) => {
  const content = await Deno.readFile(path);
  await Deno.writeFile(path, content);
};

for (let i = 0; i < 30; i++) {
  files.map((x) => save(x));
}
