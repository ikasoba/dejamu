let count = 0;

export async function dymport<P extends string>(
  path: P,
) {
  return await import(`${path}?${count++}`);
}
