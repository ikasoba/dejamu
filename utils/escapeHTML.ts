export const escapeRegExp = (text: string) => {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

export const escapeHTML = (text: string, chars: string[] = []) =>
  text.replace(
    new RegExp(
      [...chars, "<", ">", '"', "'", "&", "="].map((x) => escapeRegExp(x)).join(
        "|",
      ),
      "g",
    ),
    (c) => `&x${c.charCodeAt(0).toString(16).padStart(2, "0")};`,
  );

export const unescapeHTML = (text: string, chars: string[] = []) =>
  text.replace(
    new RegExp(
      "&x(" + [...chars, "<", ">", '"', "'", "&", "="].map((x) =>
        escapeRegExp(x.charCodeAt(0).toString(16).padStart(2, "0"))
      ).join(
        "|",
      ) + ");",
      "g",
    ),
    (_, c) =>
      String.fromCharCode(parseInt(c, 16)),
  );
