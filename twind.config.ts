import { css, defineConfig } from "@twind/core";
import presetTailwind from "@twind/preset-tailwind";
import presetExt from "@twind/preset-ext";

export default defineConfig({
  presets: [
    presetTailwind(),
    presetExt(),
  ],
  rules: [
    ["center-box", "flex justify-center"],
    [
      "btn",
      "bg-[dodgerblue] text-white p-1 rounded transition hover:brightness-95 active:brightness-9",
    ],
    [
      "card-list",
      "gap-2 flex-wrap",
    ],
    [
      "card",
      "flex flex-col bg-white border border-[lightgray] rounded p-2 width[15rem] aspect-ratio[4_/_3]",
    ],
  ],
  preflight: () => {
    return css({
      "h1": {
        "font-size": "2em",
        "font-weight": "bold",
        "margin": "1em 0",
      },
      "h2": {
        "font-size": "1.5em",
        "font-weight": "bold",
        "margin": "0.5em 0",
      },
      "a": {
        "color": "dodgerblue",
        "text-decoration": "underline",
      },
      "a:visited": {
        "color": "slateblue",
      },
      "a:active": {
        "color": "hotpink",
      },
    });
  },
});
