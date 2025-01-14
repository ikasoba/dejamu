import { Awaitable } from "../../utils/types.ts";
import { PreBuildScript } from "../PreBuildScript.ts";

export interface DejamuPluginBase {
  /**
   * プラグインがシステムに読み込まれたときに発火されます。
   * リロード時にも発火されます。
   */
  onReady?(): Awaitable<void>;

  /**
   * ページをレンダリングした時のフックで、ファイルに保存される前に処理を書き込んだりできます。
   * @returns 空じゃなければ `pageBody` を返り値にする
   */
  onRender?(
    pageBody: string,
    /**
     * htmlファイルに書き込まれるJSファイル
     */
    script: PreBuildScript,
    path: string
  ): Awaitable<string | null | void>;
}
