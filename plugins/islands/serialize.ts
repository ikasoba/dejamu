export type SerializedData =
  | string
  | number
  | boolean
  | null
  | {
    // date
    d: string;
  }
  | {
    // object
    o: Record<string, SerializedData>;
  }
  | {
    // array
    a: SerializedData[];
  };

export const serialize = (value: unknown): SerializedData => {
  if (
    typeof value == "string" || typeof value == "number" ||
    typeof value == "boolean" || value == null
  ) {
    return value ?? null;
  } else if (value instanceof Date) {
    return { d: value.toJSON() };
  } else if (value instanceof Array) {
    return { a: value.map((x) => serialize(x)) };
  } else {
    return {
      o: Object.fromEntries(
        Object.entries(value).filter(([_, v]) => v !== undefined).map((
          [k, v],
        ) => [k, serialize(v)]),
      ),
    };
  }
};

export const deserialize = (value: SerializedData): unknown => {
  if (
    typeof value == "string" || typeof value == "number" ||
    typeof value == "boolean" || value == null
  ) {
    return value;
  } else if ("d" in value) {
    return new Date(value.d);
  } else if ("a" in value) {
    return value.a.map((x) => deserialize(x));
  } else {
    return Object.fromEntries(
      Object.entries(value.o).map(([k, v]) => [k, deserialize(v)]),
    );
  }
};
