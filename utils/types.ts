export type Awaitable<T> = T | PromiseLike<T>;
export type RemovePrefix<S extends string, P extends string> = S extends
  `${P}${infer R}` ? R : never;
export type ArgsType<F extends (...args: any[]) => any> = F extends
  (...args: infer R) => any ? R : [];
