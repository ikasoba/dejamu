import { defineConfig } from "@twind/core";
import presetTailwind from "@twind/preset-tailwind";
import presetExt from "@twind/preset-ext";

export default defineConfig({
  theme: {
    extend: {
      colors: {
        primary: "hsl(220deg, 95%, 60%)"
      }
    }
  },
  presets: [
    presetTailwind(),
    presetExt(),
  ],
});
