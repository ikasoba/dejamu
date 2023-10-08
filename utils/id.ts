const charRange = (x: string, y: string) =>
  Array.from(
    { length: y.codePointAt(0)! - x.codePointAt(0)! + 1 },
    (_, i) => String.fromCodePoint(x.codePointAt(0)! + i),
  );

const num2str = (digits: string[], n: number) => {
  let res = "";

  do {
    res += digits[n % digits.length];
    n = Math.floor(n / digits.length);
  } while (n > 0);

  return res;
};

export const alphabets = [...charRange("a", "z"), ...charRange("A", "Z")];

export function createIdGenerator(digits = alphabets, prefix?: string) {
  let i = 0;

  return () => (prefix ?? "") + num2str(digits, i++);
}
