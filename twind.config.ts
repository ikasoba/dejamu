import { defineConfig } from "@twind/core";
import presetTailwind from "@twind/preset-tailwind";
import presetExt from "@twind/preset-ext";

export default defineConfig({
  presets: [
    presetTailwind(),
    presetExt(),
  ],
});
