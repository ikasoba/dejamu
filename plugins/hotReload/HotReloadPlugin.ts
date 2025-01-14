import { DejamuPlugin } from "../../core/plugins/Plugin.ts";

export function HotReloadPlugin(): DejamuPlugin {
  return {
    type: "dejamu",
    plugin: {
      onRender(_, script) {
        script.head.push(
          `import { move, clearCache } from "dejamu/plugins/preact/router/Router.ts";`
        );
        
        script.footer.push(
          `window.addEventListener("load", (() => { let ws = globalThis.__dejamu_hr_ws__; return function handler() {
            if (ws) {
              window.removeEventListener("load", handler);
              return;
            }
            
            globalThis.__dejamu_hr_ws__ = ws = new WebSocket(\`ws://\${location.host}/$/__hot_reload__\`);
          
            ws.addEventListener("message", e => {
              console.log("Hot Reload:", e.data);

              const changedFiles = JSON.parse(e.data);

              if (changedFiles.some(x => /\.islands\.[tj]sx?$/.test(x))) {
                location.reload()
              } else {
                clearCache();
                move(location.href, false);
              }
            })
          } })())`,
        );
      },
    },
  };
}
