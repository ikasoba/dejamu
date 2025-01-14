export interface AsyncTask<T> {
  task: () => PromiseLike<T>;
  resolve: (v: T) => void;
  reject: (e: any) => void;
  id: number;
}

export class AsyncTaskQueue {
  private atomic: Promise<unknown> = Promise.resolve();

  run<T>(fn: () => PromiseLike<T>): Promise<T> {
    const res = this.atomic.catch(() => {}).then(() => fn());
    this.atomic = res;

    return res;
  }
}
