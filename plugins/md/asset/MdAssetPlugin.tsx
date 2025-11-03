import { escapeHTML } from "../../../utils/escapeHTML.ts";
import { asset } from "../../asset.ts";
import { MarkdownExtension, useMarkdownBuildContext } from "../MarkdownPlugin.tsx";
import * as path from "../../../deps/path.ts";

export function MdAssetPlugin(): MarkdownExtension {
  return {
    renderer: {
      image(img) {
        const mdContext = useMarkdownBuildContext();

        const href = /^\.\.?[\\/]/.test(img.href) ? "/" + path.join(path.dirname(mdContext.sourcePath), img.href) : img.href;
        
        return `<img ${
          img.title ? `title="${escapeHTML(img.title)}" ` : ""
        }${
          img.text ? `alt="${escapeHTML(img.text)}" ` : ""
        }src="${escapeHTML(asset(href))}" />`;
      },
    },
  };
}
