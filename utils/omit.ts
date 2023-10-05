export function omit<
  O extends { [k: string | number]: any },
  K extends (string | number)[],
>(obj: O, keys: K): Omit<O, K[number]> {
  const o: any = {};

  for (const k in obj) {
    if (keys.includes(k)) continue;
    o[k] = obj[k];
  }

  return o;
}
