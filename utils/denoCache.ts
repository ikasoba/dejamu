export interface DenoCacheInfo {
  remote: string;
  npm: string;
}

export const getDenoCacheInfo = async (): Promise<DenoCacheInfo> => {
  const p = new Deno.Command("deno", {
    args: ["info"],
    stdout: "piped",
    stderr: "piped",
  });

  const res = await p.output();
  if (!res.success) {
    throw new Error(new TextDecoder().decode(res.stderr));
  }

  // deno-lint-ignore no-control-regex
  const tmp = new TextDecoder().decode(res.stdout).replace(/\x1b\[\dm/g, "")
    .split(
      /\r\n|\r|\n/,
    ).map((x) => x.split(": "));

  const obj: Record<string, string> = Object.fromEntries(tmp);
  if (!("Remote modules cache" in obj && "npm modules cache" in obj)) {
    throw new Error(`${JSON.stringify(obj)} has no contain expected keys,`);
  }

  return {
    remote: obj["Remote modules cache"],
    npm: obj["npm modules cache"],
  };
};
