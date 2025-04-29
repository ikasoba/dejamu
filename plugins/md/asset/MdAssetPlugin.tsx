import { escapeHTML } from "../../../utils/escapeHTML.ts";
import { asset } from "../../asset.ts";
import { MarkdownExtension } from "../MarkdownPlugin.tsx";

export function MdAssetPlugin(): MarkdownExtension {
  return {
    renderer: {
      image(img) {
        return `<img ${
          img.title ? `title="${escapeHTML(img.title)}" ` : ""
        }${
          img.text ? `alt="${escapeHTML(img.text)}" ` : ""
        }src="${escapeHTML(asset(img.href))}" />`;
      },
    },
  };
}
