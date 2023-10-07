import { VNode } from "npm:preact";
import { DejamuContext } from "../builder/context.ts";
import { Awaitable } from "../utils/types.ts";
import { PreBuildScript } from "../builder/PreBuildScript.ts";

export interface DejamuPluginBase {
  /**
   * プラグインがシステムに読み込まれたときに発火されます。
   * リロード時にも発火されます。
   */
  onReady?(): Awaitable<void>;

  /**
   * ページをレンダリングした時のフックで、ファイルに保存される前に処理を書き込んだりできます。
   */
  onRender?(
    pageBody: string,
    /**
     * htmlファイルに書き込まれるJSファイル
     */
    script: PreBuildScript,
  ): Awaitable<void>;
}
