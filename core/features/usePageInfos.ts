import { DejamuContext } from "../context.ts";

export function usePageInfos() {
  return DejamuContext.current.features.pages;
}
