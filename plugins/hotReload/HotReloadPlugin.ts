import { DejamuPlugin } from "../../pluginSystem/Plugin.ts";

export function HotReloadPlugin(): DejamuPlugin {
  return {
    type: "dejamu",
    plugin: {
      onRender(_, script) {
        script.footer.push(
          `window.addEventListener("load", () => {
            const ws = new WebSocket(\`ws://\${location.host}/$/__hot_reload__\`);
          
            ws.addEventListener("message", e => {
              if (e.data == "reload") {
                location.reload();
              }
            })
          })`,
        );
      },
    },
  };
}
